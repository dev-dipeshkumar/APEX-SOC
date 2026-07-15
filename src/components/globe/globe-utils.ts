// ─────────────────────────────────────────────────────────────
// Utility functions for the globe visualization
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';

const EARTH_RADIUS = 2;

/**
 * Convert latitude/longitude to 3D position on globe surface
 */
export function latLngToVector3(lat: number, lng: number, radius: number = EARTH_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Create a curved arc between two points on the globe
 */
export function createArcCurve(
  start: [number, number],
  end: [number, number],
  altitude: number = 0.4,
  segments: number = 64
): THREE.CurvePath<THREE.Vector3> {
  const startVec = latLngToVector3(start[0], start[1]);
  const endVec = latLngToVector3(end[0], end[1]);

  // Calculate arc height based on distance
  const distance = startVec.distanceTo(endVec);
  const arcHeight = altitude + distance * 0.25;

  // Create control points for the bezier curve
  const midPoint = new THREE.Vector3()
    .addVectors(startVec, endVec)
    .multiplyScalar(0.5);

  // Push midpoint outward from center
  const midNormal = midPoint.clone().normalize();
  midPoint.add(midNormal.multiplyScalar(arcHeight));

  // Create additional control points for smoother curve
  const control1 = new THREE.Vector3()
    .addVectors(startVec, midPoint)
    .multiplyScalar(0.5);
  const ctrlNormal1 = control1.clone().normalize();
  control1.add(ctrlNormal1.multiplyScalar(arcHeight * 0.6));

  const control2 = new THREE.Vector3()
    .addVectors(midPoint, endVec)
    .multiplyScalar(0.5);
  const ctrlNormal2 = control2.clone().normalize();
  control2.add(ctrlNormal2.multiplyScalar(arcHeight * 0.6));

  const curve = new THREE.CubicBezierCurve3(startVec, control1, control2, endVec);

  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(curve);
  return path;
}

/**
 * Get points along an arc for rendering
 */
export function getArcPoints(
  start: [number, number],
  end: [number, number],
  altitude: number = 0.4,
  segments: number = 64
): THREE.Vector3[] {
  const curvePath = createArcCurve(start, end, altitude, segments);
  return curvePath.getPoints(segments);
}

/**
 * Get severity color as THREE.Color
 */
export function getSeverityColor(severity: string): THREE.Color {
  const colors: Record<string, string> = {
    critical: '#ff2d55',
    high: '#ff9500',
    medium: '#ffd60a',
    low: '#30d158',
  };
  return new THREE.Color(colors[severity] || '#00f0ff');
}

/**
 * Get attack type color as THREE.Color
 */
export function getAttackTypeColor(type: string): THREE.Color {
  const colors: Record<string, string> = {
    c2_beaconing: '#ff2d55',
    spear_phishing: '#ff9500',
    brute_force: '#ffd60a',
    ddos: '#ff2d55',
    exploit: '#ff9500',
    scan: '#ffd60a',
    lateral_move: '#ff9500',
    data_exfil: '#ff2d55',
    recon: '#30d158',
    zero_day: '#ff2d55',
  };
  return new THREE.Color(colors[type] || '#00f0ff');
}

/**
 * Smooth step function
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Lerp between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in out cubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Calculate sun direction based on time (simulated)
 */
export function getSunDirection(time: number): THREE.Vector3 {
  // Slowly rotate sun position for day/night cycle
  const angle = time * 0.02; // Very slow rotation
  return new THREE.Vector3(
    Math.cos(angle),
    0.3,
    Math.sin(angle)
  ).normalize();
}
