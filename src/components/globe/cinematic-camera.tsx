'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globe-store';
import { latLngToVector3, easeInOutCubic } from './globe-utils';

/**
 * Cinematic camera system with:
 * - Smooth orbit controls with inertia
 * - Auto-rotation when idle
 * - Camera zoom-to-attack transitions
 * - Momentum and damping
 */
export function CinematicCamera() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const cameraTarget = useGlobeStore(s => s.cameraTarget);
  const isAutoRotating = useGlobeStore(s => s.isAutoRotating);
  const setAutoRotating = useGlobeStore(s => s.setAutoRotating);
  const setCameraZoom = useGlobeStore(s => s.setCameraZoom);

  // Smooth camera transition state
  const transitionRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
  }>({
    active: false,
    startTime: 0,
    duration: 1500,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Handle camera target transitions
  useEffect(() => {
    if (!cameraTarget) return;

    const target = cameraTarget;
    const targetPos3D = latLngToVector3(target.lat, target.lng, target.zoom);
    const lookAtPoint = latLngToVector3(target.lat, target.lng, 0);

    transitionRef.current = {
      active: true,
      startTime: Date.now(),
      duration: target.transitionDuration,
      startPos: camera.position.clone(),
      endPos: targetPos3D,
      startTarget: controlsRef.current?.target?.clone() || new THREE.Vector3(),
      endTarget: lookAtPoint,
    };

    // Disable auto-rotation during transition
    setAutoRotating(false);
  }, [cameraTarget, camera, setAutoRotating]);

  useFrame(() => {
    const transition = transitionRef.current;

    if (transition.active) {
      const elapsed = Date.now() - transition.startTime;
      const progress = Math.min(1, elapsed / transition.duration);
      const easedProgress = easeInOutCubic(progress);

      // Interpolate position
      camera.position.lerpVectors(transition.startPos, transition.endPos, easedProgress);

      // Interpolate look-at target
      if (controlsRef.current) {
        const newTarget = new THREE.Vector3().lerpVectors(
          transition.startTarget,
          transition.endTarget,
          easedProgress
        );
        controlsRef.current.target.copy(newTarget);
      }

      if (progress >= 1) {
        transition.active = false;
      }
    }

    // Track zoom level
    const dist = camera.position.length();
    setCameraZoom(dist);
  });

  // Track user interaction to pause auto-rotation
  const handleStart = useCallback(() => {
    if (isAutoRotating) {
      setAutoRotating(false);
    }
  }, [isAutoRotating, setAutoRotating]);

  // Re-enable auto-rotation after inactivity
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnd = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!useGlobeStore.getState().selectedThreatId) {
        setAutoRotating(true);
      }
    }, 5000);
  }, [setAutoRotating]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      minDistance={2.5}
      maxDistance={12}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.9}
      autoRotate={isAutoRotating}
      autoRotateSpeed={0.3}
      enablePan={false}
      makeDefault
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
    />
  );
}
