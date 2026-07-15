'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { atmosphereVertexShader, atmosphereFragmentShader } from './shaders';
import { getSunDirection } from './globe-utils';

const EARTH_RADIUS = 2;

/**
 * Lightweight Earth mesh - uses a simple color shader instead of 
 * heavy procedural textures to avoid OOM in memory-constrained environments.
 * Still looks cinematic with custom shaders for day/night.
 */
export function EarthMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Simple earth shader that creates continents procedurally in the GPU
  const earthVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const earthFragmentShader = `
    uniform vec3 uSunDirection;
    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    // Simple hash noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    // Simplified continent detection using noise
    float continentMask(vec2 uv) {
      vec2 lonLat = vec2(uv.x * 360.0 - 180.0, 90.0 - uv.y * 180.0);
      float n = fbm(lonLat * 0.02 + vec2(3.7, 1.2));
      n += fbm(lonLat * 0.01 + vec2(7.3, 4.1)) * 0.5;
      
      // Bias toward known land areas
      float lat = abs(lonLat.y);
      float landBias = 0.0;
      
      // Northern continents bias
      if (lonLat.y > 15.0 && lonLat.y < 70.0) {
        // North America/Europe/Asia band
        if (lonLat.x > -130.0 && lonLat.x < 180.0) landBias += 0.15;
        if (lonLat.x > -10.0 && lonLat.x < 40.0) landBias += 0.1; // Europe
        if (lonLat.x > 60.0 && lonLat.x < 140.0) landBias += 0.15; // Asia
      }
      
      // Africa
      if (lonLat.y > -35.0 && lonLat.y < 35.0 && lonLat.x > -20.0 && lonLat.x < 55.0) {
        landBias += 0.15;
      }
      
      // South America
      if (lonLat.y > -55.0 && lonLat.y < 10.0 && lonLat.x > -80.0 && lonLat.x < -35.0) {
        landBias += 0.15;
      }
      
      // Australia
      if (lonLat.y > -40.0 && lonLat.y < -10.0 && lonLat.x > 110.0 && lonLat.x < 155.0) {
        landBias += 0.15;
      }
      
      n = n + landBias;
      return smoothstep(0.48, 0.52, n);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      float sunDot = dot(normal, uSunDirection);
      float dayFactor = smoothstep(-0.15, 0.25, sunDot);

      // Generate continent/ocean pattern
      float land = continentMask(vUv);
      float terrainNoise = fbm(vUv * 200.0);

      // Ocean colors
      vec3 deepOcean = vec3(0.02, 0.06, 0.15);
      vec3 shallowOcean = vec3(0.04, 0.10, 0.22);
      vec3 oceanColor = mix(deepOcean, shallowOcean, terrainNoise);

      // Land colors
      vec3 lowland = vec3(0.08, 0.14, 0.06);
      vec3 forest = vec3(0.05, 0.12, 0.04);
      vec3 highland = vec3(0.16, 0.14, 0.09);
      vec3 mountain = vec3(0.25, 0.22, 0.16);
      vec3 snow = vec3(0.82, 0.85, 0.90);
      vec3 desert = vec3(0.32, 0.25, 0.12);

      float elevation = terrainNoise;
      float absLat = abs(90.0 - vUv.y * 180.0);
      float isDesert = smoothstep(15.0, 30.0, absLat) * (1.0 - smoothstep(35.0, 50.0, absLat));

      vec3 landColor = lowland;
      if (elevation > 0.7) landColor = mix(mountain, snow, (elevation - 0.7) * 3.3);
      else if (elevation > 0.55) landColor = mix(highland, mountain, (elevation - 0.55) * 3.0);
      else if (isDesert > 0.3 && terrainNoise > 0.4) landColor = mix(landColor, desert, isDesert * 0.6);
      else landColor = mix(forest, lowland, terrainNoise);

      // Polar ice caps
      float polarIce = smoothstep(70.0, 80.0, absLat);
      landColor = mix(landColor, snow, polarIce);
      oceanColor = mix(oceanColor, vec3(0.6, 0.7, 0.8), polarIce * 0.7);

      // Blend land and ocean
      vec3 dayColor = mix(oceanColor, landColor, land);

      // Night side - city lights
      float cityLight = 0.0;
      if (land > 0.5 && dayFactor < 0.5) {
        float cityNoise = hash(floor(vUv * 500.0));
        if (cityNoise > 0.93) cityLight = 0.8;
        // Brighter near known city centers
        float cityCluster = fbm(vUv * 100.0 + vec2(42.0, 17.0));
        cityLight += cityCluster * 0.3;
        cityLight *= (1.0 - dayFactor);
      }
      vec3 nightColor = vec3(0.005, 0.008, 0.018) + vec3(1.0, 0.85, 0.5) * cityLight;

      vec3 surfaceColor = mix(nightColor, dayColor, dayFactor);

      // Twilight tint
      float twilight = smoothstep(-0.1, 0.1, sunDot) * smoothstep(0.3, 0.1, sunDot);
      surfaceColor += vec3(0.12, 0.04, 0.01) * twilight;

      // Specular on ocean
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 halfDir = normalize(uSunDirection + viewDir);
      float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
      surfaceColor += vec3(0.3, 0.4, 0.5) * spec * (1.0 - land) * dayFactor * 0.5;

      // Rim lighting
      float rim = 1.0 - max(0.0, dot(viewDir, normal));
      surfaceColor += vec3(0.02, 0.05, 0.12) * pow(rim, 3.0) * dayFactor;

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `;

  const uniforms = useMemo(() => ({
    uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
    uTime: { value: 0 },
  }), []);

  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(EARTH_RADIUS, 48, 24);
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
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  );
}
