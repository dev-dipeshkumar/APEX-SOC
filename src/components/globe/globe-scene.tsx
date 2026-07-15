'use client';

import { Suspense, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { EarthMesh } from './earth-mesh';
import { AtmosphereMesh, AtmosphereInnerGlow } from './atmosphere';
import { CloudsMesh } from './clouds';
import { CinematicCamera } from './cinematic-camera';
import { ThreatVisualization } from './threat-visualization';
import { GlobeInteractionHandler } from './globe-interaction';
import { Starfield, AmbientParticles, NeuralNetworkLines } from './background-effects';
import { useGlobeStore } from '@/stores/globe-store';
import type { AttackConnection } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────
// Loading fallback
// ─────────────────────────────────────────────────────────────
function GlobeLoader() {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 16]} />
      <meshBasicMaterial color="#0a1628" transparent opacity={0.5} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Post-processing effects
// ─────────────────────────────────────────────────────────────
function PostProcessing() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.3}
        blendFunction={BlendFunction.NORMAL}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

// ─────────────────────────────────────────────────────────────
// Main 3D Scene content (inside Canvas)
// ─────────────────────────────────────────────────────────────
function GlobeSceneContent() {
  const setGlobeReady = useGlobeStore(s => s.setGlobeReady);

  useEffect(() => {
    const timer = setTimeout(() => setGlobeReady(true), 500);
    return () => clearTimeout(timer);
  }, [setGlobeReady]);

  return (
    <>
      {/* HDR-like lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.15} color="#4488ff" />

      {/* Background */}
      <Starfield />
      <NeuralNetworkLines />
      <AmbientParticles />

      {/* Globe layers */}
      <EarthMesh />
      <CloudsMesh />
      <AtmosphereMesh />
      <AtmosphereInnerGlow />

      {/* Threat visualization */}
      <ThreatVisualization />

      {/* Camera system */}
      <CinematicCamera />

      {/* Interaction handler */}
      <GlobeInteractionHandler />

      {/* Post-processing */}
      <PostProcessing />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Exported GlobeScene component (wraps Canvas)
// ─────────────────────────────────────────────────────────────
interface GlobeSceneProps {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  hoveredAttack: AttackConnection | null;
  onSelectAttack: (attack: AttackConnection) => void;
  onHoverAttack: (attack: AttackConnection | null) => void;
}

export function GlobeScene({ attacks }: GlobeSceneProps) {
  const addThreat = useGlobeStore(s => s.addThreat);
  const cleanupExpired = useGlobeStore(s => s.cleanupExpired);
  const prevAttackIds = useRef<Set<string>>(new Set());

  // Sync incoming attacks to globe store
  useEffect(() => {
    const currentIds = new Set(attacks.map(a => a.id));
    for (const attack of attacks) {
      if (!prevAttackIds.current.has(attack.id)) {
        addThreat(attack);
      }
    }
    prevAttackIds.current = currentIds;
  }, [attacks, addThreat]);

  // Periodic cleanup of old threats
  useEffect(() => {
    const interval = setInterval(cleanupExpired, 10000);
    return () => clearInterval(interval);
  }, [cleanupExpired]);

  // ESC key to deselect
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const store = useGlobeStore.getState();
      if (store.selectedThreatId) {
        store.deselectThreat();
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={<GlobeLoader />}>
        <GlobeSceneContent />
      </Suspense>
    </Canvas>
  );
}
