'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createCloudTexture } from './earth-textures';
import { cloudVertexShader, cloudFragmentShader } from './shaders';
import { getSunDirection } from './globe-utils';

const CLOUD_RADIUS = 2.025;

export function CloudsMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const cloudTexture = useMemo(() => createCloudTexture(2048, 1024), []);

  const uniforms = useMemo(() => ({
    uCloudMap: { value: cloudTexture },
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
    uOpacity: { value: 0.45 },
  }), [cloudTexture]);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(CLOUD_RADIUS, 64, 32);
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Slow independent rotation
      meshRef.current.rotation.y += delta * 0.008;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uSunDirection.value.copy(
        getSunDirection(materialRef.current.uniforms.uTime.value)
      );
    }
  });

  useEffect(() => {
    return () => cloudTexture.dispose();
  }, [cloudTexture]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
