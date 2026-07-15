'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globe-store';
import { latLngToVector3 } from './globe-utils';
import type { GlobeThreat } from '@/stores/globe-store';

const EARTH_RADIUS = 2;

/**
 * Handles raycasting interactions with threat markers on the globe.
 * Implements: click-to-select, hover-to-highlight
 */
export function GlobeInteractionHandler() {
  const { camera, pointer, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const hoveredIdRef = useRef<string | null>(null);
  const lastClickTime = useRef(0);

  const hoverThreat = useGlobeStore(s => s.hoverThreat);
  const selectThreat = useGlobeStore(s => s.selectThreat);
  const selectedThreatId = useGlobeStore(s => s.selectedThreatId);
  const deselectThreat = useGlobeStore(s => s.deselectThreat);

  // Convert screen coords to 3D ray
  const getMouseRay = useCallback(() => {
    raycaster.current.setFromCamera(pointer, camera);
    return raycaster.current;
  }, [camera, pointer]);

  // Handle click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Debounce rapid clicks
      const now = Date.now();
      if (now - lastClickTime.current < 200) return;
      lastClickTime.current = now;

      const ray = getMouseRay();

      // Find threat markers (spheres at source/destination positions)
      // We check intersection with the earth sphere and then find nearby threats
      const earthMesh = scene.children.find(c => c.type === 'Mesh') as THREE.Mesh;
      if (!earthMesh) return;

      const intersects = ray.intersectObject(earthMesh, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;

        // Find closest threat source/destination
        const threats = useGlobeStore.getState().threats;
        let closestThreat: GlobeThreat | null = null;
        let closestDist = 0.3; // Max click distance threshold

        for (const threat of threats) {
          const srcPos = latLngToVector3(threat.sourceCoords[0], threat.sourceCoords[1], EARTH_RADIUS + 0.01);
          const destPos = latLngToVector3(threat.targetCoords[0], threat.targetCoords[1], EARTH_RADIUS + 0.01);

          const srcDist = point.distanceTo(srcPos);
          const destDist = point.distanceTo(destPos);
          const minDist = Math.min(srcDist, destDist);

          if (minDist < closestDist) {
            closestDist = minDist;
            closestThreat = threat;
          }
        }

        if (closestThreat) {
          selectThreat(closestThreat.id);
        } else if (selectedThreatId) {
          deselectThreat();
        }
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, getMouseRay, scene, selectThreat, deselectThreat, selectedThreatId]);

  // Handle hover
  useEffect(() => {
    const handleMove = () => {
      const ray = getMouseRay();
      const earthMesh = scene.children.find(c => c.type === 'Mesh') as THREE.Mesh;
      if (!earthMesh) return;

      const intersects = ray.intersectObject(earthMesh, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const threats = useGlobeStore.getState().threats;
        let closestId: string | null = null;
        let closestDist = 0.25;

        for (const threat of threats) {
          const srcPos = latLngToVector3(threat.sourceCoords[0], threat.sourceCoords[1], EARTH_RADIUS + 0.01);
          const destPos = latLngToVector3(threat.targetCoords[0], threat.targetCoords[1], EARTH_RADIUS + 0.01);
          const srcDist = point.distanceTo(srcPos);
          const destDist = point.distanceTo(destPos);
          const minDist = Math.min(srcDist, destDist);

          if (minDist < closestDist) {
            closestDist = minDist;
            closestId = threat.id;
          }
        }

        if (closestId !== hoveredIdRef.current) {
          hoveredIdRef.current = closestId;
          hoverThreat(closestId);
          gl.domElement.style.cursor = closestId ? 'pointer' : 'grab';
        }
      } else {
        if (hoveredIdRef.current) {
          hoveredIdRef.current = null;
          hoverThreat(null);
          gl.domElement.style.cursor = 'grab';
        }
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousemove', handleMove);
    return () => canvas.removeEventListener('mousemove', handleMove);
  }, [gl, getMouseRay, scene, hoverThreat]);

  return null;
}
