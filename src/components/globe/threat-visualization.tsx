'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globe-store';
import { latLngToVector3, getSeverityColor } from './globe-utils';
import type { GlobeThreat } from '@/stores/globe-store';

const EARTH_RADIUS = 2;

/**
 * Lightweight threat visualization using instanced meshes
 * instead of individual objects per threat.
 */
export function ThreatVisualization() {
  const threats = useGlobeStore(s => s.threats);
  const selectedThreatId = useGlobeStore(s => s.selectedThreatId);
  const severityFilter = useGlobeStore(s => s.severityFilter);
  const typeFilter = useGlobeStore(s => s.typeFilter);

  // Animate threat progress
  const progressMap = useRef<Map<string, number>>(new Map());

  useFrame((_, delta) => {
    const store = useGlobeStore.getState();
    for (const threat of store.threats) {
      let progress = progressMap.current.get(threat.id) || 0;
      if (progress < 1) {
        const speed = threat.severity === 'critical' ? 1.5 :
                      threat.severity === 'high' ? 1.2 : 0.8;
        progress = Math.min(1, progress + delta * speed);
        progressMap.current.set(threat.id, progress);
        store.updateThreatProgress(threat.id, progress);
      }
    }
    // Cleanup old entries
    const currentIds = new Set(store.threats.map(t => t.id));
    for (const [id] of progressMap.current) {
      if (!currentIds.has(id)) progressMap.current.delete(id);
    }
  });

  // Filter threats
  const filteredThreats = useMemo(() => {
    let result = threats;
    if (severityFilter) result = result.filter(t => t.severity === severityFilter);
    if (typeFilter) result = result.filter(t => t.attackType === typeFilter);
    return result.slice(-30); // Reduced cap for memory
  }, [threats, severityFilter, typeFilter]);

  return (
    <group>
      {filteredThreats.map(threat => (
        <SingleAttackArc
          key={threat.id}
          threat={threat}
          isSelected={threat.id === selectedThreatId}
          isDimmed={!!selectedThreatId && threat.id !== selectedThreatId}
        />
      ))}
    </group>
  );
}

// Simple attack arc - just a line with endpoint markers
function SingleAttackArc({ threat, isSelected, isDimmed }: {
  threat: GlobeThreat;
  isSelected: boolean;
  isDimmed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const srcRef = useRef<THREE.Mesh>(null);
  const destRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => getSeverityColor(threat.severity), [threat.severity]);
  const colorHex = '#' + color.getHexString();
  const opacity = isDimmed ? 0.1 : isSelected ? 1.0 : 0.7;

  const arcPoints = useMemo(() => {
    const src = latLngToVector3(threat.sourceCoords[0], threat.sourceCoords[1], EARTH_RADIUS + 0.01);
    const dest = latLngToVector3(threat.targetCoords[0], threat.targetCoords[1], EARTH_RADIUS + 0.01);
    
    // Simple arc: interpolate with elevation
    const points: THREE.Vector3[] = [];
    const segments = 30;
    const mid = new THREE.Vector3().addVectors(src, dest).multiplyScalar(0.5);
    const dist = src.distanceTo(dest);
    const altitude = 0.3 + dist * 0.2;
    mid.normalize().multiplyScalar(EARTH_RADIUS + altitude);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Quadratic bezier: src -> mid -> dest
      const point = new THREE.Vector3();
      point.x = (1-t)*(1-t)*src.x + 2*(1-t)*t*mid.x + t*t*dest.x;
      point.y = (1-t)*(1-t)*src.y + 2*(1-t)*t*mid.y + t*t*dest.y;
      point.z = (1-t)*(1-t)*src.z + 2*(1-t)*t*mid.z + t*t*dest.z;
      points.push(point);
    }
    return points;
  }, [threat.sourceCoords, threat.targetCoords]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(arcPoints);
  }, [arcPoints]);

  const srcPos = useMemo(() => latLngToVector3(threat.sourceCoords[0], threat.sourceCoords[1], EARTH_RADIUS + 0.02), [threat.sourceCoords]);
  const destPos = useMemo(() => latLngToVector3(threat.targetCoords[0], threat.targetCoords[1], EARTH_RADIUS + 0.02), [threat.targetCoords]);

  // Pulse animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * 2 + threat.pulsePhase) * 0.3 + 1;
    if (srcRef.current) srcRef.current.scale.setScalar(pulse * 0.6);
    if (destRef.current) destRef.current.scale.setScalar(pulse * 0.5);
  });

  return (
    <group ref={groupRef}>
      {/* Arc line */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={colorHex}
          transparent
          opacity={opacity * 0.6}
          linewidth={1}
        />
      </line>

      {/* Source marker */}
      <mesh ref={srcRef} position={srcPos}>
        <sphereGeometry args={[0.02, 6, 4]} />
        <meshBasicMaterial color={colorHex} transparent opacity={opacity * 0.9} />
      </mesh>

      {/* Destination marker */}
      <mesh ref={destRef} position={destPos}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshBasicMaterial color={colorHex} transparent opacity={opacity * 0.8} />
      </mesh>
    </group>
  );
}
