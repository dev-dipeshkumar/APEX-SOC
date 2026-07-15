'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSunDirection } from './globe-utils';

const CLOUD_RADIUS = 2.025;

/**
 * Simple cloud layer using a semi-transparent sphere with noise-based shader
 */
export function CloudsMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const cloudVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const cloudFragmentShader = `
    uniform vec3 uSunDirection;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vNormal;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.1;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      float sunDot = dot(vNormal, uSunDirection);
      float dayFactor = smoothstep(-0.1, 0.3, sunDot);

      // Animated cloud pattern
      vec2 cloudUv = vUv * 8.0 + vec2(uTime * 0.01, 0.0);
      float cloud = fbm(cloudUv);
      cloud = smoothstep(0.35, 0.65, cloud);

      // Cloud bands based on latitude
      float lat = abs(vUv.y - 0.5) * 2.0;
      float band = exp(-lat * lat * 3.0);
      cloud *= band;

      vec3 cloudColor = mix(vec3(0.03, 0.04, 0.06), vec3(0.9, 0.92, 0.95), dayFactor);
      float alpha = cloud * 0.4 * dayFactor;

      gl_FragColor = vec4(cloudColor, alpha);
    }
  `;

  const uniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
  }), []);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(CLOUD_RADIUS, 32, 16);
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.008;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uSunDirection.value.copy(
        getSunDirection(materialRef.current.uniforms.uTime.value)
      );
    }
  });

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
