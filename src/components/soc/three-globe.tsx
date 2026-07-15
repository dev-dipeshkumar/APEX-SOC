'use client';

import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { SEVERITY_COLORS, ATTACK_TYPE_LABELS, type AttackConnection, type Severity } from '@/lib/constants';
import { formatTime } from '@/lib/formatters';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const EARTH_RADIUS = 2;
const ATMOSPHERE_RADIUS = 2.12;
const CLOUD_RADIUS = 2.03;
const GLOW_RADIUS = 2.25;

// ─────────────────────────────────────────────────────────────
// Procedural Earth Texture - High resolution with detailed continents
// ─────────────────────────────────────────────────────────────
function createEarthTexture(): HTMLCanvasElement {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.6);
  oceanGrad.addColorStop(0, '#0a1a2e');
  oceanGrad.addColorStop(0.5, '#071428');
  oceanGrad.addColorStop(1, '#050e1c');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // Add ocean depth variation
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 30 + Math.random() * 80;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(8, 24, 48, ${0.1 + Math.random() * 0.1})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Detailed continent polygons [lng%, lat%] - lng: 0→1 maps to -180→180, lat: 0→1 maps to 90→-90
  const continents: { points: [number, number][]; fillColor: string; strokeColor: string; terrain?: [number, number, string][] }[] = [
    {
      // North America
      points: [
        [0.04, 0.12], [0.06, 0.1], [0.08, 0.08], [0.1, 0.09], [0.12, 0.08],
        [0.14, 0.1], [0.16, 0.12], [0.17, 0.14], [0.19, 0.16], [0.2, 0.18],
        [0.21, 0.2], [0.22, 0.22], [0.23, 0.25], [0.22, 0.28], [0.21, 0.3],
        [0.2, 0.32], [0.19, 0.34], [0.17, 0.36], [0.16, 0.38], [0.15, 0.4],
        [0.14, 0.42], [0.12, 0.4], [0.1, 0.36], [0.09, 0.33], [0.08, 0.3],
        [0.07, 0.26], [0.06, 0.22], [0.05, 0.18], [0.04, 0.15]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.12, 0.2, '#0d3820'], [0.15, 0.25, '#0c3420'], [0.18, 0.22, '#0e3a22'],
        [0.13, 0.3, '#0b3020'], [0.1, 0.25, '#0c3620']
      ]
    },
    {
      // South America
      points: [
        [0.2, 0.44], [0.22, 0.42], [0.24, 0.43], [0.25, 0.46],
        [0.26, 0.5], [0.265, 0.55], [0.26, 0.6], [0.25, 0.65],
        [0.24, 0.7], [0.23, 0.75], [0.22, 0.78], [0.21, 0.74],
        [0.2, 0.68], [0.19, 0.6], [0.19, 0.52], [0.2, 0.48]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.23, 0.55, '#0d3820'], [0.22, 0.5, '#0c3420'], [0.24, 0.6, '#0e3a22']
      ]
    },
    {
      // Europe
      points: [
        [0.47, 0.14], [0.48, 0.12], [0.5, 0.11], [0.52, 0.12],
        [0.53, 0.14], [0.54, 0.16], [0.535, 0.18], [0.52, 0.2],
        [0.51, 0.22], [0.5, 0.24], [0.49, 0.26], [0.48, 0.24],
        [0.47, 0.22], [0.46, 0.2], [0.465, 0.17]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.5, 0.16, '#0d3820'], [0.49, 0.2, '#0c3420']
      ]
    },
    {
      // Africa
      points: [
        [0.47, 0.28], [0.49, 0.26], [0.51, 0.27], [0.53, 0.29],
        [0.55, 0.32], [0.56, 0.36], [0.57, 0.4], [0.565, 0.46],
        [0.55, 0.52], [0.53, 0.58], [0.51, 0.62], [0.49, 0.64],
        [0.48, 0.6], [0.47, 0.54], [0.46, 0.46], [0.455, 0.38],
        [0.46, 0.32]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.51, 0.4, '#0d3820'], [0.53, 0.35, '#0c3420'], [0.5, 0.5, '#0e3a22']
      ]
    },
    {
      // Asia
      points: [
        [0.54, 0.1], [0.58, 0.08], [0.62, 0.07], [0.66, 0.08],
        [0.7, 0.1], [0.74, 0.12], [0.78, 0.14], [0.8, 0.16],
        [0.82, 0.2], [0.83, 0.24], [0.82, 0.28], [0.8, 0.32],
        [0.76, 0.34], [0.72, 0.36], [0.68, 0.38], [0.64, 0.4],
        [0.6, 0.38], [0.57, 0.34], [0.55, 0.3], [0.54, 0.24],
        [0.535, 0.18], [0.54, 0.14]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.65, 0.2, '#0d3820'], [0.7, 0.25, '#0c3420'], [0.6, 0.3, '#0e3a22'],
        [0.75, 0.2, '#0c3620'], [0.68, 0.15, '#0b3020']
      ]
    },
    {
      // Australia
      points: [
        [0.8, 0.56], [0.83, 0.54], [0.86, 0.55], [0.88, 0.58],
        [0.885, 0.62], [0.87, 0.66], [0.85, 0.68], [0.82, 0.67],
        [0.8, 0.64], [0.79, 0.6]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
      terrain: [
        [0.84, 0.6, '#0d3820']
      ]
    },
    {
      // Greenland
      points: [
        [0.3, 0.08], [0.33, 0.06], [0.35, 0.07], [0.36, 0.1],
        [0.35, 0.14], [0.33, 0.16], [0.31, 0.14], [0.3, 0.1]
      ],
      fillColor: '#0c3020',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
    },
    {
      // Japan
      points: [
        [0.82, 0.22], [0.83, 0.2], [0.835, 0.22], [0.83, 0.26],
        [0.825, 0.28], [0.82, 0.26]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
    },
    {
      // UK
      points: [
        [0.475, 0.16], [0.48, 0.14], [0.483, 0.16], [0.48, 0.19],
        [0.476, 0.18]
      ],
      fillColor: '#0a2e1a',
      strokeColor: 'rgba(0, 200, 160, 0.06)',
    }
  ];

  // Draw continents with terrain detail
  continents.forEach(cont => {
    ctx.beginPath();
    cont.points.forEach(([x, y], i) => {
      const px = x * W;
      const py = y * H;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();

    // Fill with gradient
    const bounds = cont.points.reduce((acc, [x, y]) => ({
      minX: Math.min(acc.minX, x), maxX: Math.max(acc.maxX, x),
      minY: Math.min(acc.minY, y), maxY: Math.max(acc.maxY, y),
    }), { minX: 1, maxX: 0, minY: 1, maxY: 0 });

    const fillGrad = ctx.createLinearGradient(
      bounds.minX * W, bounds.minY * H,
      bounds.maxX * W, bounds.maxY * H
    );
    fillGrad.addColorStop(0, cont.fillColor);
    fillGrad.addColorStop(0.5, '#0c3420');
    fillGrad.addColorStop(1, cont.fillColor);
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Terrain detail
    if (cont.terrain) {
      cont.terrain.forEach(([tx, ty, color]) => {
        const r = 20 + Math.random() * 40;
        const grad = ctx.createRadialGradient(tx * W, ty * H, 0, tx * W, ty * H, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(tx * W - r, ty * H - r, r * 2, r * 2);
      });
    }

    // Coastline glow
    ctx.strokeStyle = cont.strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle inner coastline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.015)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Country borders (more detailed grid)
  ctx.strokeStyle = 'rgba(0, 200, 160, 0.025)';
  ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 10) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 10) {
    const x = ((lng + 180) / 360) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // City lights - much more detailed
  const cityPositions: [number, number, number][] = [
    // US East
    [0.21, 0.3, 12], [0.22, 0.28, 10], [0.23, 0.32, 8], [0.205, 0.31, 6], [0.215, 0.26, 7],
    // US West
    [0.13, 0.3, 10], [0.14, 0.28, 8], [0.135, 0.32, 6], [0.15, 0.29, 5],
    // Europe
    [0.48, 0.18, 12], [0.49, 0.2, 10], [0.5, 0.17, 8], [0.51, 0.19, 9],
    [0.495, 0.22, 7], [0.52, 0.21, 6], [0.47, 0.21, 5],
    // East Asia
    [0.76, 0.24, 14], [0.77, 0.27, 12], [0.82, 0.24, 10], [0.825, 0.22, 8],
    [0.78, 0.25, 7], [0.8, 0.23, 6],
    // India
    [0.72, 0.32, 10], [0.71, 0.34, 8], [0.73, 0.3, 7],
    // Australia
    [0.85, 0.62, 10], [0.86, 0.6, 8], [0.84, 0.64, 6],
    // Middle East
    [0.56, 0.32, 8], [0.57, 0.34, 6], [0.55, 0.3, 5],
    // Africa
    [0.51, 0.44, 8], [0.52, 0.48, 6], [0.5, 0.42, 5],
    // South America
    [0.23, 0.62, 8], [0.24, 0.58, 6], [0.22, 0.55, 5],
    // Russia
    [0.6, 0.14, 8], [0.65, 0.12, 6], [0.7, 0.13, 5], [0.55, 0.15, 7],
  ];

  cityPositions.forEach(([x, y, intensity]) => {
    const px = x * W;
    const py = y * H;
    const glowRadius = intensity + 4;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    glow.addColorStop(0, `rgba(0, 240, 255, ${0.08 + intensity * 0.01})`);
    glow.addColorStop(0.4, `rgba(0, 200, 180, ${0.04 + intensity * 0.005})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);
    // Core light
    ctx.beginPath();
    ctx.arc(px, py, 1 + intensity * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 240, 255, ${0.3 + intensity * 0.03})`;
    ctx.fill();
  });

  return canvas;
}

// ─────────────────────────────────────────────────────────────
// Night side texture with brighter city lights
// ─────────────────────────────────────────────────────────────
function createNightTexture(): HTMLCanvasElement {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark background
  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, W, H);

  // City lights (brighter for night side)
  const cityPositions: [number, number, number][] = [
    [0.21, 0.3, 16], [0.22, 0.28, 14], [0.23, 0.32, 12], [0.205, 0.31, 10], [0.215, 0.26, 8],
    [0.13, 0.3, 14], [0.14, 0.28, 12], [0.135, 0.32, 8],
    [0.48, 0.18, 18], [0.49, 0.2, 16], [0.5, 0.17, 14], [0.51, 0.19, 12],
    [0.76, 0.24, 18], [0.77, 0.27, 16], [0.82, 0.24, 14], [0.825, 0.22, 12],
    [0.72, 0.32, 14], [0.71, 0.34, 12],
    [0.85, 0.62, 12], [0.86, 0.6, 10],
    [0.56, 0.32, 10], [0.57, 0.34, 8],
    [0.51, 0.44, 10], [0.52, 0.48, 8],
    [0.23, 0.62, 10], [0.24, 0.58, 8],
    [0.6, 0.14, 10], [0.65, 0.12, 8], [0.55, 0.15, 10],
  ];

  cityPositions.forEach(([x, y, intensity]) => {
    const px = x * W;
    const py = y * H;
    // Bright glow
    const glowRadius = intensity + 8;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    glow.addColorStop(0, `rgba(255, 200, 80, ${0.15 + intensity * 0.01})`);
    glow.addColorStop(0.3, `rgba(255, 180, 50, ${0.08 + intensity * 0.005})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);
    // Core
    ctx.beginPath();
    ctx.arc(px, py, 1.5 + intensity * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 120, ${0.5 + intensity * 0.02})`;
    ctx.fill();
  });

  return canvas;
}

// ─────────────────────────────────────────────────────────────
// Cloud texture
// ─────────────────────────────────────────────────────────────
function createCloudTexture(): HTMLCanvasElement {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.clearRect(0, 0, W, H);

  // Procedural clouds
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const rx = 20 + Math.random() * 60;
    const ry = 10 + Math.random() * 30;
    const opacity = 0.01 + Math.random() * 0.04;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
    ctx.fill();
    ctx.restore();
  }

  // Cloud bands
  for (let band = 0; band < 8; band++) {
    const y = H * (0.1 + band * 0.1);
    const bandWidth = H * 0.08;
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * W;
      const cy = y + (Math.random() - 0.5) * bandWidth;
      const r = 30 + Math.random() * 80;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(200, 220, 255, ${0.02 + Math.random() * 0.03})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  return canvas;
}

// ─────────────────────────────────────────────────────────────
// Atmosphere Shader
// ─────────────────────────────────────────────────────────────
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    vec3 color = mix(vec3(0.0, 0.94, 1.0), vec3(0.1, 0.4, 0.8), intensity);
    gl_FragColor = vec4(color, intensity * 0.4);
  }
`;

// ─────────────────────────────────────────────────────────────
// Lat/Lng to 3D position
// ─────────────────────────────────────────────────────────────
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ─────────────────────────────────────────────────────────────
// Earth Component
// ─────────────────────────────────────────────────────────────
const GlobeEarth = memo(function GlobeEarth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Generate textures with useMemo to avoid lint error
  const textures = useMemo(() => {
    const earthCanvas = createEarthTexture();
    const nightCanvas = createNightTexture();
    const cloudCanvas = createCloudTexture();

    const earthTex = new THREE.CanvasTexture(earthCanvas);
    earthTex.anisotropy = 8;
    const nightTex = new THREE.CanvasTexture(nightCanvas);
    nightTex.anisotropy = 8;
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);

    return { earth: earthTex, night: nightTex, clouds: cloudTex };
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.015;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.02;
  });

  if (!textures) return null;

  return (
    <group>
      {/* Main Earth */}
      <mesh ref={earthRef} rotation={[0, 0, -23.4 * Math.PI / 180]}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshPhongMaterial
          map={textures.earth}
          emissiveMap={textures.night}
          emissive={new THREE.Color(1, 1, 1)}
          emissiveIntensity={0.6}
          specular={new THREE.Color(0x111122)}
          shininess={15}
        />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudRef} rotation={[0, 0, -23.4 * Math.PI / 180]}>
        <sphereGeometry args={[CLOUD_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={textures.clouds}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

// ─────────────────────────────────────────────────────────────
// Atmosphere Component
// ─────────────────────────────────────────────────────────────
function Atmosphere() {
  return (
    <>
      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[ATMOSPHERE_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[GLOW_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#0088aa"
          transparent
          opacity={0.012}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Attack Arc with particles and pulse - GPU accelerated
// ─────────────────────────────────────────────────────────────
const AttackArc = memo(function AttackArc({
  attack,
  isSelected,
  isHovered,
  isDimmed,
}: {
  attack: AttackConnection;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const arcRef = useRef<THREE.Line>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const sourcePulseRef = useRef<THREE.Mesh>(null);
  const targetPulseRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const particleTimeRef = useRef(0);

  const color = SEVERITY_COLORS[attack.severity];
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const startPos = useMemo(() =>
    latLngToVector3(attack.sourceCoords[0], attack.sourceCoords[1], EARTH_RADIUS + 0.005),
    [attack]
  );
  const endPos = useMemo(() =>
    latLngToVector3(attack.targetCoords[0], attack.targetCoords[1], EARTH_RADIUS + 0.005),
    [attack]
  );

  const { curve, arcPoints, particlePositions } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const distance = startPos.distanceTo(endPos);
    mid.normalize().multiplyScalar(EARTH_RADIUS + distance * 0.35);

    const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
    const arcPoints = curve.getPoints(80);

    // Particle positions along the arc
    const particleCount = 20;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1);
      const point = curve.getPoint(t);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }

    return { curve, arcPoints, particlePositions: positions };
  }, [startPos, endPos]);

  // Arc line geometry
  const arcGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(arcPoints);
    return geom;
  }, [arcPoints]);

  // Particle geometry
  const particleGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    return geom;
  }, [particlePositions]);

  const baseOpacity = isDimmed ? 0.05 : isSelected ? 0.8 : isHovered ? 0.7 : 0.4;
  const pulseMultiplier = isSelected ? 1.5 : isHovered ? 1.2 : 1;

  useFrame((state, delta) => {
    progressRef.current = Math.min(progressRef.current + delta * 0.4, 1);
    particleTimeRef.current += delta;

    const opacity = progressRef.current * baseOpacity;

    // Update arc
    if (arcRef.current) {
      const mat = arcRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = opacity;
      if (isSelected || isHovered) {
        mat.linewidth = 2;
      }
    }

    // Animate particles along curve
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      if (positions) {
        const count = positions.count;
        for (let i = 0; i < count; i++) {
          const baseT = i / (count - 1);
          const t = (baseT + particleTimeRef.current * 0.3) % 1;
          const point = curve.getPoint(t);
          positions.setXYZ(i, point.x, point.y, point.z);
        }
        positions.needsUpdate = true;
      }
      const pMat = particlesRef.current.material as THREE.PointsMaterial;
      pMat.opacity = opacity * 0.8;
      pMat.size = (isSelected ? 0.035 : isHovered ? 0.03 : 0.02) * pulseMultiplier;
    }

    // Source pulse animation
    if (sourcePulseRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = (1 + Math.sin(t * 3) * 0.4) * pulseMultiplier;
      sourcePulseRef.current.scale.set(scale, scale, scale);
      const sMat = sourcePulseRef.current.material as THREE.MeshBasicMaterial;
      sMat.opacity = isDimmed ? 0.02 : (0.4 + Math.sin(t * 3) * 0.2) * (isSelected ? 1.3 : 1);
    }

    // Target pulse animation
    if (targetPulseRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = (1 + Math.sin(t * 2.5 + 1) * 0.3) * pulseMultiplier;
      targetPulseRef.current.scale.set(scale, scale, scale);
      const tMat = targetPulseRef.current.material as THREE.MeshBasicMaterial;
      tMat.opacity = isDimmed ? 0.02 : (0.3 + Math.sin(t * 2.5 + 1) * 0.15);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Attack arc line */}
      <line ref={arcRef} geometry={arcGeometry}>
        <lineBasicMaterial
          color={threeColor}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </line>

      {/* Flowing particles */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          color={threeColor}
          transparent
          opacity={0}
          size={0.02}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Source marker with pulse */}
      <group position={startPos}>
        <mesh>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color={threeColor} transparent opacity={isDimmed ? 0.05 : 0.9} />
        </mesh>
        {/* Pulse ring */}
        <mesh ref={sourcePulseRef}>
          <ringGeometry args={[0.025, 0.04, 24]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Expanding ripple */}
        <ExpandingRipple color={threeColor} position={[0, 0, 0]} baseSize={0.05} isDimmed={isDimmed} />
      </group>

      {/* Target marker with pulse */}
      <group position={endPos}>
        <mesh>
          <sphereGeometry args={[0.015, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={isDimmed ? 0.03 : 0.7} />
        </mesh>
        <mesh ref={targetPulseRef}>
          <ringGeometry args={[0.02, 0.032, 24]} />
          <meshBasicMaterial
            color={threeColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <ExpandingRipple color={threeColor} position={[0, 0, 0]} baseSize={0.04} isDimmed={isDimmed} />
      </group>
    </group>
  );
});

// ─────────────────────────────────────────────────────────────
// Expanding Ripple Effect
// ─────────────────────────────────────────────────────────────
function ExpandingRipple({
  color,
  position,
  baseSize,
  isDimmed,
}: {
  color: THREE.Color;
  position: [number, number, number];
  baseSize: number;
  isDimmed: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Math.random() * 3);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = (state.clock.getElapsedTime() + startTime.current) % 2;
    const scale = 1 + t * 1.5;
    meshRef.current.scale.set(scale, scale, scale);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = isDimmed ? 0 : Math.max(0, (1 - t / 2) * 0.3);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[baseSize * 0.8, baseSize, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Attack Tooltip (HTML overlay)
// ─────────────────────────────────────────────────────────────
function AttackTooltip({ attack, position }: { attack: AttackConnection; position: THREE.Vector3 }) {
  return (
    <Html position={position} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div
        className="rounded-xl p-3 min-w-[220px] shadow-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(8, 13, 24, 0.85)',
          border: `1px solid ${SEVERITY_COLORS[attack.severity]}20`,
          borderLeft: `3px solid ${SEVERITY_COLORS[attack.severity]}`,
          boxShadow: `0 0 20px ${SEVERITY_COLORS[attack.severity]}10, 0 8px 32px rgba(0,0,0,0.4)`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[attack.severity], boxShadow: `0 0 6px ${SEVERITY_COLORS[attack.severity]}` }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SEVERITY_COLORS[attack.severity] }}>
            {attack.severity}
          </span>
          <span className="text-[9px] text-gray-500 ml-auto">{formatTime(attack.timestamp)}</span>
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
        </div>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────
// Globe Scene - Main 3D Scene
// ─────────────────────────────────────────────────────────────
function GlobeScene({
  attacks,
  selectedAttack,
  hoveredAttack,
  onSelectAttack,
  onHoverAttack,
}: {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  hoveredAttack: AttackConnection | null;
  onSelectAttack: (a: AttackConnection) => void;
  onHoverAttack: (a: AttackConnection | null) => void;
}) {
  const controlsRef = useRef<any>(null);

  // Limit displayed attacks for performance
  const displayAttacks = useMemo(() => attacks.slice(-50), [attacks]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 3, 5]} intensity={0.5} color="#d0e8ff" />
      <directionalLight position={[-3, -1, -5]} intensity={0.08} color="#00f0ff" />
      <pointLight position={[0, 5, 0]} intensity={0.1} color="#4488ff" />

      {/* Stars */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

      {/* Earth + Atmosphere */}
      <GlobeEarth />
      <Atmosphere />

      {/* Attack visualizations */}
      {displayAttacks.map(attack => (
        <AttackArc
          key={attack.id}
          attack={attack}
          isSelected={selectedAttack?.id === attack.id}
          isHovered={hoveredAttack?.id === attack.id}
          isDimmed={selectedAttack !== null && selectedAttack.id !== attack.id}
        />
      ))}

      {/* Selected attack tooltip */}
      {selectedAttack && (
        <AttackTooltip
          attack={selectedAttack}
          position={latLngToVector3(
            selectedAttack.sourceCoords[0],
            selectedAttack.sourceCoords[1],
            EARTH_RADIUS + 0.3
          )}
        />
      )}

      {/* OrbitControls with premium feel */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2.8}
        maxDistance={8}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.15}
        enableInertia
        inertiaFactor={0.8}
      />

      {/* Post-processing effects - minimal for performance */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main 3D Globe Component (exported)
// ─────────────────────────────────────────────────────────────
export function ThreeGlobe({
  attacks,
  selectedAttack,
  hoveredAttack,
  onSelectAttack,
  onHoverAttack,
}: {
  attacks: AttackConnection[];
  selectedAttack: AttackConnection | null;
  hoveredAttack: AttackConnection | null;
  onSelectAttack: (a: AttackConnection) => void;
  onHoverAttack: (a: AttackConnection | null) => void;
}) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 1000 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={1}
        style={{ background: 'transparent' }}
        performance={{ min: 0.5 }}
      >
        <GlobeScene
          attacks={attacks}
          selectedAttack={selectedAttack}
          hoveredAttack={hoveredAttack}
          onSelectAttack={onSelectAttack}
          onHoverAttack={onHoverAttack}
        />
      </Canvas>
    </div>
  );
}
