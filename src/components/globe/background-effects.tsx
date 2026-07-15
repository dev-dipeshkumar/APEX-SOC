'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Animated background starfield
// ─────────────────────────────────────────────────────────────
export function Starfield() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Random position on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 30 + Math.random() * 70;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // Color variation
      const brightness = 0.3 + Math.random() * 0.7;
      const colorType = Math.random();
      if (colorType < 0.6) {
        // White/blue stars
        colors[i3] = brightness * 0.8;
        colors[i3 + 1] = brightness * 0.9;
        colors[i3 + 2] = brightness;
      } else if (colorType < 0.85) {
        // Warm stars
        colors[i3] = brightness;
        colors[i3 + 1] = brightness * 0.85;
        colors[i3 + 2] = brightness * 0.6;
      } else {
        // Cyan accent
        colors[i3] = brightness * 0.2;
        colors[i3 + 1] = brightness * 0.9;
        colors[i3 + 2] = brightness;
      }

      sizes[i] = 0.3 + Math.random() * 1.2;
    }

    return { positions, colors, sizes };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────
// Floating particles around globe for ambient effect
// ─────────────────────────────────────────────────────────────
export function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, opacities } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 4;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      opacities[i] = 0.1 + Math.random() * 0.3;
    }

    return { positions, opacities };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#00f0ff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────────
// Neural network lines (subtle background connection lines)
// ─────────────────────────────────────────────────────────────
export function NeuralNetworkLines() {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: Array<{ start: THREE.Vector3; end: THREE.Vector3; opacity: number }> = [];
    const nodeCount = 40;

    // Generate random nodes on a sphere
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.5 + Math.random() * 2;
      nodes.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }

    // Connect nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < 4) {
          result.push({
            start: nodes[i],
            end: nodes[j],
            opacity: (1 - dist / 4) * 0.08,
          });
        }
      }
    }

    return result.slice(0, 60); // Limit lines
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([line.start, line.end]);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial
              color="#00f0ff"
              transparent
              opacity={line.opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}
    </group>
  );
}
