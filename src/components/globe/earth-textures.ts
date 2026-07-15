// ─────────────────────────────────────────────────────────────
// High-resolution procedural Earth texture generation
// Creates realistic satellite-style Earth without external assets
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';

// Continent outlines as simplified polygon data (lon/lat pairs)
const CONTINENT_DATA: Array<Array<[number, number]>> = [
  // North America
  [[-130,50],[-125,60],[-115,68],[-100,72],[-85,73],[-75,72],[-65,62],[-55,48],[-60,44],[-68,42],[-75,35],[-82,25],[-90,18],[-97,16],[-105,20],[-110,24],[-117,32],[-122,37],[-125,42],[-130,50]],
  // South America
  [[-80,10],[-75,5],[-68,-2],[-55,-3],[-44,-5],[-35,-8],[-35,-18],[-42,-22],[-52,-28],[-58,-35],[-65,-42],[-70,-50],[-75,-53],[-70,-40],[-70,-30],[-70,-18],[-75,-8],[-80,0],[-80,10]],
  // Europe
  [[-10,36],[0,38],[3,43],[-2,48],[2,51],[5,53],[8,55],[12,56],[15,58],[20,58],[25,60],[30,65],[35,68],[40,70],[32,62],[28,55],[25,50],[30,46],[28,42],[24,38],[22,36],[15,38],[8,44],[3,43],[-5,42],[-10,36]],
  // Africa
  [[-17,15],[-15,28],[-5,36],[10,37],[25,32],[33,30],[38,20],[42,12],[50,5],[50,-2],[45,-10],[40,-18],[35,-26],[30,-34],[25,-34],[20,-30],[15,-25],[12,-18],[10,-5],[5,5],[-5,5],[-10,7],[-17,15]],
  // Asia
  [[30,42],[35,45],[40,43],[45,40],[50,38],[55,37],[60,38],[65,40],[70,38],[75,35],[80,28],[85,22],[90,22],[95,18],[100,14],[105,10],[108,16],[112,22],[118,28],[122,32],[128,38],[132,36],[135,42],[138,45],[142,48],[148,55],[155,60],[165,65],[175,68],[180,68],[180,72],[170,72],[160,68],[150,62],[140,55],[130,50],[120,55],[105,60],[90,65],[75,70],[65,72],[55,68],[48,58],[42,52],[35,48],[30,42]],
  // Australia
  [[115,-15],[120,-14],[130,-12],[138,-12],[145,-14],[150,-18],[153,-24],[152,-30],[148,-35],[142,-38],[135,-35],[128,-32],[118,-30],[114,-25],[113,-20],[115,-15]],
  // Greenland
  [[-55,60],[-45,60],[-25,68],[-18,75],[-20,80],[-30,83],[-45,82],[-55,78],[-58,73],[-55,60]],
  // Japan
  [[130,31],[132,33],[135,34],[137,36],[140,39],[141,42],[142,44],[140,42],[137,38],[135,35],[132,33],[130,31]],
  // UK/Ireland
  [[-10,50],[-5,50],[-1,51],[1,53],[0,55],[-2,57],[-5,58],[-7,58],[-6,56],[-3,54],[-5,52],[-10,50]],
  // Indonesia/SEA
  [[95,6],[100,2],[104,-3],[106,-7],[110,-8],[115,-8],[118,-5],[120,-2],[116,2],[110,4],[105,5],[100,5],[95,6]],
];

// Bounding boxes for continents (for faster point-in-polygon)
interface BBox { minX: number; maxX: number; minY: number; maxY: number; }

function getBBox(polygon: Array<[number, number]>): BBox {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

// Point-in-polygon test (ray casting)
function pointInPolygon(px: number, py: number, polygon: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Pre-compute bounding boxes
const CONTINENT_BBOXES = CONTINENT_DATA.map(getBBox);

function isLand(lon: number, lat: number): boolean {
  for (let i = 0; i < CONTINENT_DATA.length; i++) {
    const bb = CONTINENT_BBOXES[i];
    if (lon < bb.minX - 5 || lon > bb.maxX + 5 || lat < bb.minY - 5 || lat > bb.maxY + 5) continue;
    if (pointInPolygon(lon, lat, CONTINENT_DATA[i])) return true;
  }
  return false;
}

// Color utilities
function lerpColor(c1: [number,number,number], c2: [number,number,number], t: number): [number,number,number] {
  return [c1[0]+(c2[0]-c1[0])*t, c1[1]+(c2[1]-c1[1])*t, c1[2]+(c2[2]-c1[2])*t];
}

function colorToUint8(c: [number,number,number]): [number,number,number] {
  return [Math.floor(c[0]*255), Math.floor(c[1]*255), Math.floor(c[2]*255)];
}

// Seeded noise for consistent terrain
function hashNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number): number {
  const sx = x / scale, sy = y / scale;
  const ix = Math.floor(sx), iy = Math.floor(sy);
  const fx = sx - ix, fy = sy - iy;
  const a = hashNoise(ix, iy), b = hashNoise(ix + 1, iy);
  const c = hashNoise(ix, iy + 1), d = hashNoise(ix + 1, iy + 1);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return a * (1-u)*(1-v) + b * u*(1-v) + c * (1-u)*v + d * u*v;
}

function fbm(x: number, y: number, octaves: number = 5): number {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq, 200);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

// ─────────────────────────────────────────────────────────────
// Main texture generation
// ─────────────────────────────────────────────────────────────

export function createEarthDayTexture(width = 4096, height = 2048): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Color palettes
  const deepOcean: [number,number,number] = [0.02, 0.06, 0.14];
  const shallowOcean: [number,number,number] = [0.04, 0.10, 0.22];
  const coastWater: [number,number,number] = [0.06, 0.15, 0.28];
  const lowland: [number,number,number] = [0.10, 0.18, 0.08];
  const forest: [number,number,number] = [0.06, 0.14, 0.04];
  const highland: [number,number,number] = [0.18, 0.16, 0.10];
  const mountain: [number,number,number] = [0.28, 0.24, 0.18];
  const snow: [number,number,number] = [0.85, 0.88, 0.92];
  const desert: [number,number,number] = [0.35, 0.28, 0.14];
  const ice: [number,number,number] = [0.82, 0.87, 0.93];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * 360 - 180;
      const lat = 90 - (y / height) * 180;
      const idx = (y * width + x) * 4;

      const absLat = Math.abs(lat);
      const isPolar = absLat > 70;
      const isArctic = absLat > 80;
      const noise = fbm(x, y, 5);
      const land = isLand(lon, lat);

      let color: [number,number,number];

      if (isArctic) {
        color = lerpColor(ice, snow, noise);
      } else if (isPolar) {
        if (land) {
          color = lerpColor(snow, highland, noise * 0.7);
        } else {
          color = lerpColor(coastWater, ice, noise * 0.5 + 0.3);
        }
      } else if (land) {
        const elevation = noise * 0.7 + 0.3;
        // Desert belt check (roughly 15-35 latitude)
        const isDesertBelt = absLat > 15 && absLat < 35;
        const isTropical = absLat < 23;

        if (elevation > 0.75) {
          color = lerpColor(mountain, snow, (elevation - 0.75) * 4);
        } else if (elevation > 0.55) {
          color = lerpColor(highland, mountain, (elevation - 0.55) * 5);
        } else if (isDesertBelt && noise > 0.45) {
          color = lerpColor(desert, lowland, (noise - 0.45) * 3);
        } else if (isTropical) {
          color = lerpColor(forest, lowland, noise);
        } else {
          color = lerpColor(lowland, forest, noise);
        }
      } else {
        // Ocean with depth variation
        const depth = noise * 0.4 + 0.6;
        if (depth > 0.8) {
          color = lerpColor(shallowOcean, coastWater, (depth - 0.8) * 5);
        } else if (depth > 0.5) {
          color = lerpColor(deepOcean, shallowOcean, (depth - 0.5) * 2);
        } else {
          color = deepOcean;
        }
      }

      const [r, g, b] = colorToUint8(color);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  return tex;
}

export function createEarthNightTexture(width = 4096, height = 2048): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // City light clusters (rough population center coords)
  const cityClusters: Array<[number, number, number]> = [
    // North America
    [-74, 41, 1.0], [-87, 42, 0.9], [-118, 34, 1.0], [-95, 30, 0.85],
    [-122, 48, 0.6], [-80, 26, 0.7], [-71, 42, 0.75], [-84, 34, 0.7],
    [-105, 40, 0.6], [-90, 30, 0.6], [-77, 39, 0.7], [-83, 42, 0.7],
    [-117, 33, 0.8], [-99, 19, 0.9], [-79, 44, 0.7], [-123, 46, 0.5],
    // Europe
    [2, 49, 0.95], [14, 52, 0.85], [-4, 52, 0.8], [12, 42, 0.85],
    [24, 38, 0.7], [-3, 41, 0.75], [5, 52, 0.7], [18, 48, 0.7],
    [14, 48, 0.65], [24, 48, 0.6], [37, 56, 0.8], [30, 50, 0.75],
    [10, 45, 0.6], [23, 43, 0.6], [25, 60, 0.5], [18, 59, 0.5],
    // Asia
    [121, 31, 1.0], [116, 40, 1.0], [139, 35, 1.0], [127, 37, 0.95],
    [77, 29, 0.95], [114, 23, 0.9], [104, 1, 0.8], [100, 14, 0.8],
    [106, 22, 0.8], [91, 23, 0.7], [51, 25, 0.7], [55, 25, 0.65],
    [67, 25, 0.65], [73, 19, 0.7], [80, 13, 0.65], [78, 35, 0.7],
    [88, 23, 0.65], [120, 15, 0.6], [107, -7, 0.6], [106, 10, 0.6],
    // South America
    [-47, -23, 0.85], [-58, -35, 0.8], [-70, -33, 0.7], [-77, -12, 0.65],
    [-74, 5, 0.7], [-43, -23, 0.7], [-51, -30, 0.6],
    // Africa
    [31, 30, 0.7], [3, 7, 0.75], [-7, 33, 0.6], [28, -26, 0.65],
    [37, -1, 0.6], [32, 0, 0.55], [9, 4, 0.5], [47, -19, 0.5],
    // Australia/Oceania
    [151, -34, 0.8], [145, -38, 0.7], [153, -28, 0.6], [175, -37, 0.5],
  ];

  const darkBg: [number,number,number] = [0.005, 0.008, 0.018];
  const cityColor: [number,number,number] = [1.0, 0.85, 0.5];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * 360 - 180;
      const lat = 90 - (y / height) * 180;
      const idx = (y * width + x) * 4;

      let lightIntensity = 0;
      const land = isLand(lon, lat);

      if (land) {
        for (const [cLon, cLat, cIntensity] of cityClusters) {
          const dLon = lon - cLon;
          const dLat = lat - cLat;
          const dist = Math.sqrt(dLon * dLon + dLat * dLat);
          if (dist < 8) {
            const falloff = Math.max(0, 1 - dist / 8);
            lightIntensity = Math.max(lightIntensity, cIntensity * falloff * falloff);
          }
        }
        // Add scattered rural lights
        const noise = hashNoise(x * 0.3, y * 0.3);
        if (noise > 0.92) {
          lightIntensity = Math.max(lightIntensity, 0.08);
        }
      }

      // Apply noise for variation
      const noiseVal = hashNoise(x * 0.7, y * 0.7);
      lightIntensity *= (0.8 + noiseVal * 0.4);
      lightIntensity = Math.min(1, lightIntensity);

      const color = lerpColor(darkBg, cityColor, lightIntensity);
      const [r, g, b] = colorToUint8(color);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function createEarthBumpTexture(width = 4096, height = 2048): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * 360 - 180;
      const lat = 90 - (y / height) * 180;
      const idx = (y * width + x) * 4;

      const land = isLand(lon, lat);
      const noise = fbm(x, y, 6);
      let bump = land ? noise * 0.8 + 0.2 : 0;
      // Mountains have higher bumps
      if (land && noise > 0.6) {
        bump = noise;
      }
      const v = Math.floor(bump * 255);
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function createCloudTexture(width = 2048, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const noise = fbm(x + 5000, y + 5000, 6);

      // Cloud bands
      const lat = Math.abs(y / height - 0.5) * 2;
      const bandFactor = Math.exp(-lat * lat * 3);

      const cloudDensity = Math.pow(Math.max(0, noise * 1.3 - 0.35), 1.5) * bandFactor;
      const alpha = Math.min(1, cloudDensity * 2.5);

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(alpha * 180);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

export function createSpecularTexture(width = 4096, height = 2048): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * 360 - 180;
      const lat = 90 - (y / height) * 180;
      const idx = (y * width + x) * 4;

      const land = isLand(lon, lat);
      // Ocean is highly specular, land is not
      const spec = land ? 20 : 220;
      data[idx] = spec;
      data[idx + 1] = spec;
      data[idx + 2] = spec;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
