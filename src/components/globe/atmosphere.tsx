'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { atmosphereVertexShader, atmosphereFragmentShader } from './shaders';
import { getSunDirection } from './globe-utils';

const ATMOSPHERE_RADIUS = 2.18;

export function AtmosphereMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
    uIntensity: { value: 1.2 },
  }), []);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 32);
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uSunDirection.value.copy(
        getSunDirection(materialRef.current.uniforms.uTime.value)
      );
    }
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Inner atmospheric glow (front side, for rim lighting)
export function AtmosphereInnerGlow() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
    uIntensity: { value: 0.6 },
  }), []);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(2.04, 64, 32);
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uSunDirection.value.copy(
        getSunDirection(materialRef.current.uniforms.uTime.value)
      );
    }
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.FrontSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
