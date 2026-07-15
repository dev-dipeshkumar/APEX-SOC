'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globe-store';
import { latLngToVector3, getArcPoints, getSeverityColor, EARTH_RADIUS as _ER } from './globe-utils';
import type { GlobeThreat } from '@/stores/globe-store';

// ─────────────────────────────────────────────────────────────
// Single Attack Arc with animated pulse, glow, and trail
// ─────────────────────────────────────────────────────────────
function AttackArc({ threat, isSelected, isHovered, isDimmed }: {
  threat: GlobeThreat;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const srcRingRef = useRef<THREE.Mesh>(null);
  const destRingRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Line>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => getSeverityColor(threat.severity), [threat.severity]);
  const arcPoints = useMemo(() =>
    getArcPoints(threat.sourceCoords, threat.targetCoords, 0.5, 80),
    [threat.sourceCoords, threat.targetCoords]
  );

  const srcPos = useMemo(() => latLngToVector3(threat.sourceCoords[0], threat.sourceCoords[1], EARTH_RADIUS + 0.01), [threat.sourceCoords]);
  const destPos = useMemo(() => latLngToVector3(threat.targetCoords[0], threat.targetCoords[1], EARTH_RADIUS + 0.01), [threat.targetCoords]);

  // Create arc geometry
  const arcGeometry = useMemo(() => {
    const points = arcPoints;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [arcPoints]);

  // Create animated arc (visible portion grows)
  const animArcGeometry = useMemo(() => {
    const points = arcPoints;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // Set draw range to 0 initially
    geometry.setDrawRange(0, 0);
    return geometry;
  }, [arcPoints]);

  // Pulse position along arc
  const pulseGeometry = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), []);

  // Source ring
  const ringGeometry = useMemo(() => new THREE.RingGeometry(0.02, 0.05, 32), []);

  // Glow sphere
  const glowGeometry = useMemo(() => new THREE.SphereGeometry(0.04, 12, 12), []);

  // Opacity based on state
  const baseOpacity = isDimmed ? 0.1 : (isHovered ? 1.0 : 0.7);
  const lineWidth = isSelected ? 2.0 : (isHovered ? 1.5 : 1.0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Grow arc animation
    const progress = threat.animationProgress;
    const totalPoints = arcPoints.length;
    const visibleCount = Math.floor(progress * totalPoints);
    animArcGeometry.setDrawRange(0, visibleCount);

    // Animate pulse along the visible portion of the arc
    if (pulseRef.current && progress > 0.1) {
      const pulseT = ((Date.now() * 0.001 * (threat.severity === 'critical' ? 1.2 : 0.6)) % 1) * progress;
      const idx = Math.floor(pulseT * (totalPoints - 1));
      if (idx < arcPoints.length) {
        pulseRef.current.position.copy(arcPoints[idx]);
      }
      pulseRef.current.visible = true;
    } else if (pulseRef.current) {
      pulseRef.current.visible = false;
    }

    // Source ring pulse
    if (srcRingRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.003 + threat.pulsePhase) * 0.3;
      srcRingRef.current.scale.setScalar(scale);
      srcRingRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }

    // Destination ring pulse
    if (destRingRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.004 + threat.pulsePhase + 1) * 0.4;
      destRingRef.current.scale.setScalar(scale);
      destRingRef.current.lookAt(new THREE.Vector3(0, 0, 0));
    }

    // Glow pulse
    if (glowRef.current) {
      const glowScale = 1 + Math.sin(Date.now() * 0.005 + threat.pulsePhase) * 0.2;
      glowRef.current.scale.setScalar(glowScale * (isHovered ? 1.5 : 1.0));
    }

    // Fade expired threats
    if (threat.fadeOut < 1) {
      groupRef.current.traverse(child => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat.opacity !== undefined) {
            mat.opacity = baseOpacity * threat.fadeOut;
          }
        }
      });
    }
  });

  const colorHex = '#' + color.getHexString();
  const glowIntensity = isHovered ? 0.8 : (isSelected ? 0.6 : 0.3);

  return (
    <group ref={groupRef}>
      {/* Base arc line (dim, always visible once drawn) */}
      <line geometry={arcGeometry}>
        <lineBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * 0.25}
          linewidth={1}
        />
      </line>

      {/* Animated growing arc */}
      <line geometry={animArcGeometry}>
        <lineBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * 0.8}
          linewidth={lineWidth}
        />
      </line>

      {/* Traveling pulse */}
      <mesh ref={pulseRef} geometry={pulseGeometry}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * 0.9}
        />
      </mesh>

      {/* Source marker - expanding ring */}
      <mesh ref={srcRingRef} position={srcPos} geometry={ringGeometry}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * 0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Source glow sphere */}
      <mesh position={srcPos} geometry={glowGeometry}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * glowIntensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Destination marker - expanding ring */}
      <mesh ref={destRingRef} position={destPos} geometry={ringGeometry}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * 0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Destination glow sphere */}
      <mesh position={destPos} geometry={glowGeometry}>
        <meshBasicMaterial
          color={colorHex}
          transparent
          opacity={baseOpacity * glowIntensity * 0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

const EARTH_RADIUS = 2;

// ─────────────────────────────────────────────────────────────
// Threat Visualization System - manages all attack arcs
// ─────────────────────────────────────────────────────────────
export function ThreatVisualization() {
  const threats = useGlobeStore(s => s.threats);
  const selectedThreatId = useGlobeStore(s => s.selectedThreatId);
  const hoveredThreatId = useGlobeStore(s => s.hoveredThreatId);
  const severityFilter = useGlobeStore(s => s.severityFilter);
  const typeFilter = useGlobeStore(s => s.typeFilter);

  // Animate threat progress
  const animatedThreats = useRef<Map<string, number>>(new Map());

  useFrame((_, delta) => {
    const store = useGlobeStore.getState();
    for (const threat of store.threats) {
      let progress = animatedThreats.current.get(threat.id) || 0;
      if (progress < 1) {
        // Growth speed varies by severity
        const speed = threat.severity === 'critical' ? 1.5 :
                      threat.severity === 'high' ? 1.2 :
                      threat.severity === 'medium' ? 0.8 : 0.6;
        progress = Math.min(1, progress + delta * speed);
        animatedThreats.current.set(threat.id, progress);

        // Update store
        store.updateThreatProgress(threat.id, progress);
      }
    }

    // Cleanup old entries
    const currentIds = new Set(store.threats.map(t => t.id));
    for (const [id] of animatedThreats.current) {
      if (!currentIds.has(id)) {
        animatedThreats.current.delete(id);
      }
    }
  });

  // Filter threats
  const filteredThreats = useMemo(() => {
    let result = threats;
    if (severityFilter) result = result.filter(t => t.severity === severityFilter);
    if (typeFilter) result = result.filter(t => t.attackType === typeFilter);
    return result.slice(-80); // Performance cap
  }, [threats, severityFilter, typeFilter]);

  return (
    <group>
      {filteredThreats.map(threat => (
        <AttackArc
          key={threat.id}
          threat={threat}
          isSelected={threat.id === selectedThreatId}
          isHovered={threat.id === hoveredThreatId}
          isDimmed={!!selectedThreatId && threat.id !== selectedThreatId}
        />
      ))}
    </group>
  );
}
