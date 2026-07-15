'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createEarthDayTexture,
  createEarthNightTexture,
  createEarthBumpTexture,
  createSpecularTexture,
} from './earth-textures';
import {
  earthVertexShader,
  earthFragmentShader,
} from './shaders';
import { getSunDirection } from './globe-utils';

const EARTH_RADIUS = 2;

export function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate textures once
  const textures = useMemo(() => {
    const dayMap = createEarthDayTexture(4096, 2048);
    const nightMap = createEarthNightTexture(4096, 2048);
    const bumpMap = createEarthBumpTexture(4096, 2048);
    const specularMap = createSpecularTexture(4096, 2048);
    return { dayMap, nightMap, bumpMap, specularMap };
  }, []);

  // Shader uniforms
  const uniforms = useMemo(() => ({
    uDayMap: { value: textures.dayMap },
    uNightMap: { value: textures.nightMap },
    uSpecularMap: { value: textures.specularMap },
    uBumpMap: { value: textures.bumpMap },
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
    uBumpScale: { value: 0.03 },
  }), [textures]);

  // Geometry
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(EARTH_RADIUS, 128, 64);
  }, []);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uSunDirection.value.copy(getSunDirection(materialRef.current.uniforms.uTime.value));
    }
  });

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      Object.values(textures).forEach(tex => tex.dispose());
    };
  }, [textures]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  );
}
