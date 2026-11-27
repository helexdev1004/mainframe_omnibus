// GLSL for the WebGL globe renderer (machines with a real GPU).
//
// Colours are display-referred sRGB: none of these materials go through
// three's colour management, so what is typed is what lands on screen.
// The maths mirrors renderCanvas2d.ts line for line – change one, change both.
// The glass sphere itself is not here: it is a still image (see plate.ts).

const PALETTE = /* glsl */ `
  const vec3 GOLD = vec3(0.93, 0.70, 0.02);
  const vec3 SUN  = vec3(1.00, 0.90, 0.05);
  const vec3 HOT  = vec3(1.00, 0.98, 0.76);
`;

/* ------------------------------------------------------------------ */
/* Dot matrix: one point per grid cell on the sphere                   */
/* ------------------------------------------------------------------ */
export const dotsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uPxPerUnit;
  uniform float uDot;
  uniform float uSea;
  uniform vec3  uRippleOrigin[2];
  uniform vec3  uRipple[2];   // x: cos(radius) · y: 1 / width · z: strength

  attribute vec3 aScatter;
  attribute vec2 aSeed;       // x: random 0–1 · y: 0 sea, 1 land, 2 market

  varying vec3  vColor;
  varying float vAlpha;

  ${PALETTE}

  void main() {
    float rnd      = aSeed.x;
    float isLand   = step(0.5, aSeed.y);
    float isMarket = step(1.5, aSeed.y);

    // Intro: every dot flies in from a loose shell, staggered by its seed.
    float t = clamp(uIntro * 1.6 - rnd * 0.6, 0.0, 1.0);
    float q = (1.0 - t) * (1.0 - t);
    float e = 1.0 - q * q;
    vec3 pos = mix(aScatter, position, e);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vec3 v = normalize(-mv.xyz);
    float facing = dot(n, v);

    // Settled dots on the far side leave clip space: no raster work at all.
    float hidden = step(facing, 0.0) * step(0.97, e);
    gl_Position = mix(projectionMatrix * mv, vec4(2.0, 2.0, 2.0, 1.0), hidden);

    float limb  = smoothstep(0.02, 0.42, mix(1.0, max(facing, 0.0), e));
    float light = max(dot(n, normalize(vec3(-0.42, 0.52, 0.74))), 0.0);

    // Ripples of "fieldwork" travelling out from the active markets.
    // Compared in cosine space, so there is no acos per dot.
    vec3 unit = position * 0.996;
    float ripple = 0.0;
    for (int i = 0; i < 2; i++) {
      float x = (dot(unit, uRippleOrigin[i]) - uRipple[i].x) * uRipple[i].y;
      float band = max(1.0 - x * x, 0.0);
      ripple += band * band * uRipple[i].z;
    }

    // A brief blink once per cycle, each dot on its own clock.
    float phase = fract(uTime * (0.07 + rnd * 0.16) + rnd * 13.0);
    float tw = isLand * max(1.0 - abs(phase - 0.5) * 30.0, 0.0);
    tw *= tw;

    float glow = 0.22 + light * 0.78 + isMarket * 0.5 + ripple * 1.1 + tw;
    vec3 landCol = mix(GOLD, SUN, clamp(glow, 0.0, 1.0));
    landCol = mix(landCol, HOT, clamp(glow - 1.0, 0.0, 1.0));
    vec3 seaCol = mix(vec3(0.60, 0.61, 0.66), SUN, clamp(ripple * 1.2, 0.0, 1.0));
    vColor = mix(seaCol, landCol, isLand);

    float landA = min(0.42 + 0.58 * light + isMarket * 0.3 + ripple * 0.6 + tw * 0.6, 1.0);
    float seaA  = uSea * (0.45 + 0.9 * light) + ripple * 0.32;
    vAlpha = mix(seaA, landA, isLand) * limb * smoothstep(0.0, 0.3, t);

    float size = uDot * mix(0.6, 1.0, isLand)
      * (1.0 + isMarket * 0.2 + ripple * 0.6 + tw * 0.55)
      * mix(1.9, 1.0, e);
    gl_PointSize = max(size * uPxPerUnit / -mv.z, 1.0);
  }
`;

export const dotsFragment = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float disc = 1.0 - smoothstep(0.115, 0.25, dot(p, p));
    gl_FragColor = vec4(vColor, disc * vAlpha);
  }
`;

/* ------------------------------------------------------------------ */
/* Orbit rings: closed tubes with comet trails behind each node        */
/* ------------------------------------------------------------------ */
export const lineVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const orbitFragment = /* glsl */ `
  uniform float uHeads[3];
  uniform float uDir;
  uniform float uBase;
  uniform float uIntro;
  varying vec2 vUv;

  ${PALETTE}

  void main() {
    float a = uBase;
    float hot = 0.0;
    for (int i = 0; i < 3; i++) {
      float on = step(0.0, uHeads[i]);
      float f  = 1.0 - fract((uHeads[i] - vUv.x) * uDir);
      float f2 = f * f;
      float f8 = f2 * f2 * f2 * f2;
      float f32 = f8 * f8 * f8 * f8;
      a  += on * f8 * f * 0.85;
      hot = max(hot, on * f32 * f8);
    }
    float drawn = 1.0 - smoothstep(uIntro - 0.08, uIntro, vUv.x * 0.92);
    gl_FragColor = vec4(mix(SUN, HOT, hot), clamp(a, 0.0, 1.0) * drawn);
  }
`;

/* ------------------------------------------------------------------ */
/* Market arcs: all eight tubes in one draw call                       */
/* ------------------------------------------------------------------ */
export const arcVertex = /* glsl */ `
  uniform float uTime;
  attribute vec2 aArc;       // x: phase offset · y: speed
  varying float vAlong;
  varying float vHead;

  void main() {
    vAlong = uv.x;
    vHead = fract(uTime * aArc.y + aArc.x) * 1.7;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const arcFragment = /* glsl */ `
  uniform float uIntro;
  varying float vAlong;
  varying float vHead;

  ${PALETTE}

  void main() {
    float behind = vHead - vAlong;
    float f = max(1.0 - behind * 1.6, 0.0);
    float trail = step(0.0, behind) * f * f * f * f;
    float ends = smoothstep(0.0, 0.08, vAlong) * (1.0 - smoothstep(0.92, 1.0, vAlong));
    float a = (0.22 + trail * 0.9) * (0.35 + 0.65 * ends);
    gl_FragColor = vec4(mix(SUN, HOT, trail), a * uIntro);
  }
`;

/* ------------------------------------------------------------------ */
/* Sparks: soft glowing points (orbit nodes and drifting dust)         */
/* ------------------------------------------------------------------ */
export const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPxPerUnit;
  attribute vec3 aSpark;    // x: world-space diameter · y: alpha · z: twinkle seed (0 = steady)
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float wave = abs(fract(uTime * (0.08 + aSpark.z * 0.12) + aSpark.z * 7.0) - 0.5) * 2.0;
    vAlpha = aSpark.y * mix(1.0, 0.25 + 0.75 * wave, step(0.001, aSpark.z));
    gl_PointSize = max(aSpark.x * uPxPerUnit / -mv.z, 1.5);
  }
`;

export const sparkFragment = /* glsl */ `
  uniform float uIntro;
  varying float vAlpha;

  ${PALETTE}

  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float d2 = dot(p, p);
    float h = max(1.0 - d2, 0.0);
    float core = 1.0 - smoothstep(0.012, 0.07, d2);
    float halo = h * h * h * 0.6;
    gl_FragColor = vec4(mix(SUN, HOT, core), (core + halo) * vAlpha * uIntro);
  }
`;

/* ------------------------------------------------------------------ */
/* Market beacons: six tangent quads in one draw call                   */
/* ------------------------------------------------------------------ */
export const beaconVertex = /* glsl */ `
  uniform float uPing[6];
  attribute vec2 aBeacon;    // x: phase · y: market index
  varying vec2  vUv;
  varying float vPhase;
  varying float vPing;

  void main() {
    vUv = uv;
    vPhase = aBeacon.x;
    vPing = uPing[int(aBeacon.y + 0.5)];
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const beaconFragment = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  varying vec2  vUv;
  varying float vPhase;
  varying float vPing;

  ${PALETTE}

  float ring(float d, float t) {
    return (1.0 - smoothstep(0.0, 0.07, abs(d - t * 0.95))) * (1.0 - t);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float d2 = dot(p, p);
    float d = sqrt(d2);
    float t1 = fract(uTime * 0.38 + vPhase);
    float t2 = fract(uTime * 0.38 + vPhase + 0.5);
    float rings = ring(d, t1) + ring(d, t2);
    float core = 1.0 - smoothstep(0.09, 0.20, d);
    float h = max(1.0 - d2 * (1.0 - vPing * 0.45), 0.0);
    float halo = h * h * h * (0.35 + vPing * 0.6);
    float a = (rings * (0.55 + vPing * 0.6) + core + halo) * (1.0 - smoothstep(0.85, 1.0, d));
    gl_FragColor = vec4(mix(SUN, HOT, clamp(core + vPing * 0.5, 0.0, 1.0)), a * uIntro);
  }
`;
