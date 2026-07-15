// ─────────────────────────────────────────────────────────────
// GLSL Shaders for atmospheric scattering, day/night, etc.
// ─────────────────────────────────────────────────────────────

export const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = `
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rimFactor = 1.0 - max(0.0, dot(viewDir, vNormal));

    // Atmospheric scattering - blue glow at edges
    float atmosphere = pow(rimFactor, 2.5) * uIntensity;

    // Sun-side enhancement
    float sunAlignment = dot(vNormal, uSunDirection);
    float sunFactor = smoothstep(-0.2, 0.8, sunAlignment) * 0.5 + 0.5;

    // Color gradient: blue to lighter blue on sun side
    vec3 dayAtmo = vec3(0.3, 0.6, 1.0);
    vec3 nightAtmo = vec3(0.05, 0.1, 0.3);
    vec3 atmoColor = mix(nightAtmo, dayAtmo, sunFactor);

    // Subtle breathing animation
    float breathe = 1.0 + sin(uTime * 0.3) * 0.03;
    atmosphere *= breathe;

    // Fresnel rim for realistic look
    float fresnel = pow(rimFactor, 4.0) * 0.5;

    vec3 finalColor = atmoColor * (atmosphere + fresnel);
    float alpha = atmosphere * 0.7 + fresnel * 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const earthFragmentShader = `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uSpecularMap;
  uniform sampler2D uBumpMap;
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uBumpScale;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);

    // Bump mapping
    float bumpVal = texture2D(uBumpMap, vUv).r;
    normal = normalize(normal + vec3(0.0, 0.0, bumpVal * uBumpScale));

    // Sun lighting
    float sunDot = dot(normal, uSunDirection);
    float dayFactor = smoothstep(-0.15, 0.25, sunDot);

    // Sample textures
    vec4 dayColor = texture2D(uDayMap, vUv);
    vec4 nightColor = texture2D(uNightMap, vUv);
    float specularVal = texture2D(uSpecularMap, vUv).r;

    // Day/night blend
    vec3 surfaceColor = mix(nightColor.rgb, dayColor.rgb, dayFactor);

    // Specular highlight on ocean
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 halfDir = normalize(uSunDirection + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);
    float specMask = step(0.5, specularVal / 255.0);
    surfaceColor += vec3(0.4, 0.5, 0.6) * spec * specMask * dayFactor * 0.6;

    // Ambient light (subtle)
    surfaceColor += dayColor.rgb * 0.03;

    // Twilight terminator - orange tint
    float twilight = smoothstep(-0.1, 0.1, sunDot) * smoothstep(0.3, 0.1, sunDot);
    surfaceColor += vec3(0.15, 0.05, 0.02) * twilight;

    // Rim lighting
    float rim = 1.0 - max(0.0, dot(viewDir, normal));
    surfaceColor += vec3(0.02, 0.05, 0.12) * pow(rim, 3.0) * dayFactor;

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

export const cloudVertexShader = `
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

export const cloudFragmentShader = `
  uniform sampler2D uCloudMap;
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uOpacity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    float sunDot = dot(normal, uSunDirection);
    float dayFactor = smoothstep(-0.1, 0.3, sunDot);

    vec4 cloud = texture2D(uCloudMap, vUv);
    float alpha = cloud.a * uOpacity;

    // Clouds are white in sunlight, dark on night side
    vec3 cloudColor = mix(vec3(0.03, 0.04, 0.06), vec3(1.0, 1.0, 1.0), dayFactor);

    // Edge softening
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(0.0, dot(viewDir, normal));
    alpha *= smoothstep(0.0, 0.3, 1.0 - rim);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

export const attackArcVertexShader = `
  attribute float aProgress;
  attribute float aRandom;

  varying float vProgress;
  varying float vRandom;

  void main() {
    vProgress = aProgress;
    vRandom = aRandom;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const attackArcFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  varying float vProgress;
  varying float vRandom;

  void main() {
    // Flowing pulse along the arc
    float pulse = fract(vProgress - uTime * 0.5 + vRandom * 0.3);
    float glow = smoothstep(0.0, 0.15, pulse) * smoothstep(0.4, 0.15, pulse);

    // Leading edge
    float edge = smoothstep(0.0, 0.05, pulse) * smoothstep(0.1, 0.05, pulse);

    // Combine
    float intensity = glow * 0.6 + edge * 0.4;

    vec3 color = uColor * (1.0 + intensity * 2.0);
    float alpha = intensity * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const threatMarkerVertexShader = `
  attribute float aPhase;

  varying float vPhase;
  varying vec3 vPosition;

  void main() {
    vPhase = aPhase;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const threatMarkerFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPulseSpeed;

  varying float vPhase;

  void main() {
    float pulse = sin(uTime * uPulseSpeed + vPhase) * 0.5 + 0.5;
    vec3 color = uColor * (1.0 + pulse * 0.5);
    float alpha = 0.6 + pulse * 0.4;
    gl_FragColor = vec4(color, alpha);
  }
`;
