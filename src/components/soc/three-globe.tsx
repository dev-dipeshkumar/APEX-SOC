'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SEVERITY_COLORS, ATTACK_TYPE_LABELS, ATTACK_TYPE_COLORS, type AttackConnection, type AttackType, type Severity } from '@/lib/constants';
import { formatTime } from '@/lib/formatters';

// --- Earth texture generation ---
function createEarthTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Ocean base
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#060c1a');
  gradient.addColorStop(0.5, '#0a1628');
  gradient.addColorStop(1, '#060c1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continent definitions (simplified polygons as [x%, y%, w%, h%])
  const continents: { points: [number, number][]; color: string }[] = [
    { // North America
      points: [[0.08, 0.18], [0.12, 0.12], [0.18, 0.1], [0.22, 0.15], [0.25, 0.2], [0.28, 0.28], [0.25, 0.35], [0.22, 0.38], [0.18, 0.42], [0.15, 0.38], [0.1, 0.32], [0.08, 0.25]],
      color: '#0d2818',
    },
    { // South America
      points: [[0.2, 0.48], [0.23, 0.45], [0.26, 0.48], [0.27, 0.55], [0.26, 0.65], [0.24, 0.72], [0.22, 0.78], [0.2, 0.72], [0.19, 0.6]],
      color: '#0d2818',
    },
    { // Europe
      points: [[0.45, 0.15], [0.48, 0.12], [0.52, 0.14], [0.54, 0.18], [0.52, 0.25], [0.5, 0.3], [0.47, 0.28], [0.45, 0.22]],
      color: '#0d2818',
    },
    { // Africa
      points: [[0.46, 0.32], [0.5, 0.3], [0.54, 0.33], [0.56, 0.4], [0.55, 0.52], [0.52, 0.62], [0.49, 0.65], [0.47, 0.58], [0.45, 0.45]],
      color: '#0d2818',
    },
    { // Asia
      points: [[0.54, 0.12], [0.6, 0.1], [0.68, 0.12], [0.76, 0.15], [0.8, 0.2], [0.82, 0.28], [0.78, 0.35], [0.72, 0.38], [0.65, 0.4], [0.58, 0.35], [0.55, 0.25]],
      color: '#0d2818',
    },
    { // Australia
      points: [[0.78, 0.58], [0.83, 0.55], [0.87, 0.58], [0.88, 0.65], [0.85, 0.7], [0.8, 0.68], [0.77, 0.62]],
      color: '#0d2818',
    },
  ];

  continents.forEach(cont => {
    ctx.beginPath();
    cont.points.forEach(([x, y], i) => {
      const px = x * canvas.width;
      const py = y * canvas.height;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = cont.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Country borders (subtle grid lines)
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.015)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 15) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 15) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // City lights
  const cityPositions = [
    [0.21, 0.3], [0.22, 0.28], [0.23, 0.32], // US East
    [0.15, 0.3], [0.17, 0.28], // US West
    [0.48, 0.2], [0.49, 0.22], [0.5, 0.18], // Europe
    [0.75, 0.25], [0.76, 0.28], [0.78, 0.22], // East Asia
    [0.84, 0.62], [0.85, 0.6], // Australia
    [0.55, 0.35], // Middle East
    [0.72, 0.32], // India
    [0.5, 0.45], [0.52, 0.5], // Africa
  ];
  cityPositions.forEach(([x, y]) => {
    const px = x * canvas.width;
    const py = y * canvas.height;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
    glow.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(px - 8, py - 8, 16, 16);
    ctx.beginPath();
    ctx.arc(px, py, 1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.fill();
  });

  return canvas;
}

// --- Lat/Lng to 3D position ---
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// --- Globe Component ---
function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const canvas = createEarthTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.03;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={texture}
          roughness={0.8}
          metalness={0.1}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere ref={atmosphereRef} args={[2.06, 64, 64]}>
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer atmosphere */}
      <Sphere args={[2.15, 32, 32]}>
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.015}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

// --- Attack Marker ---
function AttackMarker({
  attack,
  isSelected,
  onClick,
}: {
  attack: AttackConnection;
  isSelected: boolean;
  onClick: () => void;
}) {
  const markerRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLngToVector3(attack.sourceCoords[0], attack.sourceCoords[1], 2.01), [attack]);
  const color = SEVERITY_COLORS[attack.severity];
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (pulseRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 3) * 0.3;
      pulseRef.current.scale.set(scale, scale, scale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - Math.sin(t * 3) * 0.2;
    }
  });

  return (
    <group ref={markerRef} position={pos}>
      {/* Core dot */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={threeColor} />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={pulseRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <ringGeometry args={[0.03, 0.05, 16]} />
        <meshBasicMaterial color={threeColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.05, 0.07, 16]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// --- Attack Arc ---
function AttackArc({ attack, globeRef }: { attack: AttackConnection; globeRef: React.RefObject<THREE.Group | null> }) {
  const progressRef = useRef(0);
  const color = SEVERITY_COLORS[attack.severity];
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const lineObj = useMemo(() => {
    const start = latLngToVector3(attack.sourceCoords[0], attack.sourceCoords[1], 2.02);
    const end = latLngToVector3(attack.targetCoords[0], attack.targetCoords[1], 2.02);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(2 + distance * 0.3);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: threeColor, transparent: true, opacity: 0 });
    return new THREE.Line(geometry, material);
  }, [attack, threeColor]);

  useFrame((_, delta) => {
    progressRef.current = Math.min(progressRef.current + delta * 0.5, 1);
    if (lineObj) {
      (lineObj.material as THREE.LineBasicMaterial).opacity = progressRef.current * 0.6;
    }
  });

  return <primitive object={lineObj} />;
}

// --- Target Marker ---
function TargetMarker({ attack }: { attack: AttackConnection }) {
  const pos = useMemo(() => latLngToVector3(attack.targetCoords[0], attack.targetCoords[1], 2.01), [attack]);

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// --- Tooltip ---
function AttackTooltip({ attack, position }: { attack: AttackConnection; position: THREE.Vector3 }) {
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div className="glass-heavy rounded-lg p-3 min-w-[200px] shadow-xl" style={{ borderLeft: `3px solid ${SEVERITY_COLORS[attack.severity]}` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[attack.severity] }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SEVERITY_COLORS[attack.severity] }}>
            {attack.severity}
          </span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="text-gray-300">{ATTACK_TYPE_LABELS[attack.attackType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Source</span>
            <span className="text-gray-300 font-mono">{attack.sourceIp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Target</span>
            <span className="text-gray-300 font-mono">{attack.targetIp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Adversary</span>
            <span className="text-gray-300">{attack.adversary}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="text-gray-300">{formatTime(attack.timestamp)}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// --- Globe Scene ---
function GlobeScene({
  attacks,
  selectedAttack,
  onSelectAttack,
}: {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  onSelectAttack: (a: AttackConnection) => void;
}) {
  const globeRef = useRef<THREE.Group>(null);

  // Limit displayed attacks for performance
  const displayAttacks = useMemo(() => attacks.slice(-60), [attacks]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.4} color="#e2e8f0" />
      <directionalLight position={[-5, -3, -5]} intensity={0.1} color="#00f0ff" />

      <group ref={globeRef}>
        <GlobeMesh />

        {displayAttacks.map(attack => (
          <group key={attack.id}>
            <AttackMarker
              attack={attack}
              isSelected={selectedAttack?.id === attack.id}
              onClick={() => onSelectAttack(attack)}
            />
            <TargetMarker attack={attack} />
            <AttackArc attack={attack} globeRef={globeRef} />
          </group>
        ))}

        {selectedAttack && (
          <AttackTooltip
            attack={selectedAttack}
            position={latLngToVector3(selectedAttack.sourceCoords[0], selectedAttack.sourceCoords[1], 2.3)}
          />
        )}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

// --- Main 3D Globe Component ---
export function ThreeGlobe({
  attacks,
  selectedAttack,
  onSelectAttack,
}: {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  onSelectAttack: (a: AttackConnection) => void;
}) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <GlobeScene
          attacks={attacks}
          selectedAttack={selectedAttack}
          onSelectAttack={onSelectAttack}
        />
      </Canvas>
    </div>
  );
}
