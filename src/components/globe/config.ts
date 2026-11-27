// Everything the two globe renderers (WebGL and Canvas 2D) have in common:
// scene constants, the geometry they both draw, and the per-frame state the
// controller hands them.
import globeData from "@/data/globe.json";

export type Vec3 = [number, number, number];

/* ------------------------------------------------------------------ */
/* Camera & pose                                                       */
/* ------------------------------------------------------------------ */
export const FOV = 30;
export const CAMERA_Z = 6.3;
export const HALF_FOV_TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

export const BASE_TILT = 0.56; // leans the north toward the viewer so Europe sits high-centre
export const AXIS_LEAN = -0.16;
// Longitude facing the camera once assembled. A little east of Europe, so the
// six markets start left of centre and travel across the whole face.
export const BASE_SPIN = (-38 * Math.PI) / 180;
export const AUTO_SPIN = 0.06; // rad/s, west → east like the real thing
export const INTRO_SECONDS = 3.2;
export const INTRO_SWING = 2.6; // radians the globe spins through while assembling

export const ATMOSPHERE = 1.3; // outer radius of the glow, in globe radii
export const DOT_RADIUS = 1.004;
export const DOT_SIZE = (Math.PI / globeData.rings) * 0.6; // world-space diameter
export const KEY_LIGHT: Vec3 = normalize([-0.42, 0.52, 0.74]); // view space

/* ------------------------------------------------------------------ */
/* Markets, the links between them, and the orbit rings                 */
/* ------------------------------------------------------------------ */
export const MARKETS = [
  { lat: 48.86, lon: 2.35 }, // 0 Paris
  { lat: 52.52, lon: 13.4 }, // 1 Berlin
  { lat: 41.9, lon: 12.5 }, // 2 Rome
  { lat: 40.42, lon: -3.7 }, // 3 Madrid
  { lat: 52.23, lon: 21.01 }, // 4 Warsaw
  { lat: 39.93, lon: 32.86 }, // 5 Ankara
];
export const MARKET_VECTORS: Vec3[] = MARKETS.map((m) => onSphere(m.lat, m.lon));

export const LINKS: [number, number][] = [
  [0, 1], [1, 4], [0, 3], [0, 2], [2, 5], [4, 5], [3, 2], [1, 2],
];
export const ARC_STEPS = 24;
/** Per-arc animation of the travelling pulse: phase offset and speed. */
export const arcTiming = (index: number) => ({
  offset: index * 0.29,
  speed: 0.3 + (index % 3) * 0.07,
});

export const BEACON_HALF = 0.075; // half-size of a market beacon, in globe radii
export const beaconPhase = (index: number) => index * 0.37;

export const RIPPLE_ORDER = [0, 4, 3, 5, 1, 2];
export const RIPPLE_SECONDS = 4.6;
export const RIPPLE_REACH = 1.45; // radians a ripple travels before it fades out

export const ORBITS = [
  { radius: 1.6, roll: -0.3, pitch: 1.3, speed: 0.05, base: 0.2, nodes: [0.02, 0.4, 0.69] },
  { radius: 1.38, roll: 0.44, pitch: 1.17, speed: -0.04, base: 0.16, nodes: [0.18, 0.61] },
  { radius: 1.72, roll: 1.02, pitch: 1.37, speed: 0.028, base: 0.07, nodes: [0.33] },
];
/** World-space diameter of the glowing node riding a ring. */
export const nodeSize = (indexOnRing: number) => (indexOnRing === 0 ? 0.17 : 0.13);

/* ------------------------------------------------------------------ */
/* Per-frame state                                                     */
/* ------------------------------------------------------------------ */
export type GlobeFrame = {
  time: number;
  /** 0 → 1 while the dots assemble */
  intro: number;
  /** 0 → 1 draw-on of the orbit rings */
  lines: number;
  /** 0 → 1 fade of beacons, arcs and sparks */
  fx: number;
  /** rotation about the globe's own axis */
  spin: number;
  tilt: number;
  /** pointer parallax, applied to the whole rig */
  parallaxX: number;
  parallaxY: number;
  /** vertical drift (world units) and scale of the whole rig */
  offsetY: number;
  scale: number;
  /** two travelling ripples: origin on the unit sphere + band shape */
  rippleOrigin: [Vec3, Vec3];
  /** [cos(radius), 1 / width, strength] – compared in cosine space */
  ripple: [Vec3, Vec3];
  /** flash of each market beacon, 1 → 0 */
  ping: number[];
  /** per ring: current roll and the 0–1 position of each node */
  orbits: { roll: number; heads: number[] }[];
  dustSpin: number;
  dustTip: number;
};

export interface GlobeRenderer {
  readonly canvas: HTMLCanvasElement;
  /** `ratio` is device pixels per CSS pixel for the drawing buffer */
  resize(width: number, height: number, ratio: number): void;
  render(frame: GlobeFrame): void;
  dispose(): void;
}

/* ------------------------------------------------------------------ */
/* Shared geometry                                                     */
/* ------------------------------------------------------------------ */
export function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** lon 0 faces +z (the camera), east is +x, north is +y */
export function onSphere(lat: number, lon: number, radius = 1): Vec3 {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  return [
    Math.cos(phi) * Math.sin(lam) * radius,
    Math.sin(phi) * radius,
    Math.cos(phi) * Math.cos(lam) * radius,
  ];
}

export type DotCloud = {
  count: number;
  /** resting place on the sphere, xyz */
  position: Float32Array;
  /** where each dot starts its intro flight, xyz */
  scatter: Float32Array;
  /** [random 0–1, kind] – kind: 0 sea · 1 land · 2 market */
  seed: Float32Array;
};

/** Expands the ring masks in globe.json into a point cloud. */
export function buildDots(includeSea: boolean): DotCloud {
  const { rings, rows } = globeData as { rings: number; rows: string[] };
  const keep = (kind: string) => includeSea || kind !== "0";
  let count = 0;
  for (const row of rows) for (const kind of row) if (keep(kind)) count++;

  const position = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const seed = new Float32Array(count * 2);
  let k = 0;
  rows.forEach((row, i) => {
    const lat = -90 + ((i + 0.5) * 180) / rings;
    for (let j = 0; j < row.length; j++) {
      if (!keep(row[j])) continue;
      const lon = -180 + ((j + 0.5) * 360) / row.length;
      const at = onSphere(lat, lon, DOT_RADIUS);
      position.set(at, k * 3);
      // a loose shell around the globe, roughly above where the dot will land
      const out = normalize([
        at[0] + (Math.random() - 0.5) * 1.2,
        at[1] + (Math.random() - 0.5) * 1.2,
        at[2] + (Math.random() - 0.5) * 1.2,
      ]);
      const distance = 1.3 + Math.random() * 1.5;
      scatter.set([out[0] * distance, out[1] * distance, out[2] * distance], k * 3);
      seed[k * 2] = Math.random();
      seed[k * 2 + 1] = row.charCodeAt(j) - 48;
      k++;
    }
  });
  return { count, position, scatter, seed };
}

/** A great-circle hop between two surface points, lifted in the middle. */
export function arcPoints(from: Vec3, to: Vec3, steps: number): Vec3[] {
  const angle = Math.acos(
    Math.min(1, Math.max(-1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2])),
  );
  const lift = 0.03 + angle * 0.3;
  const points: Vec3[] = [];
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const on = normalize([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ]);
    const radius = 1.008 + Math.sin(Math.PI * t) * lift;
    points.push([on[0] * radius, on[1] * radius, on[2] * radius]);
  }
  return points;
}

/**
 * A point on an orbit ring, in rig space (before parallax, scale and drift).
 * The ring lies in its own XY plane, pitched about X and then rolled about Z.
 */
export function orbitPoint(
  radius: number,
  pitch: number,
  roll: number,
  turn: number,
  out: Vec3 = [0, 0, 0],
): Vec3 {
  const angle = turn * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * Math.cos(pitch);
  out[0] = x * Math.cos(roll) - y * Math.sin(roll);
  out[1] = x * Math.sin(roll) + y * Math.cos(roll);
  out[2] = Math.sin(angle) * radius * Math.sin(pitch);
  return out;
}

export type DustCloud = { count: number; position: Float32Array; spark: Float32Array };

/** Drifting motes. spark = [world-space diameter, alpha, twinkle seed] */
export function buildDust(count: number): DustCloud {
  const position = new Float32Array(count * 3);
  const spark = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const direction = normalize([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
    const distance = 1.4 + Math.random() * 1.5;
    position.set(direction.map((c) => c * distance), i * 3);
    spark.set(
      [0.014 + Math.random() * 0.03, 0.2 + Math.random() * 0.55, 0.2 + Math.random() * 1.8],
      i * 3,
    );
  }
  return { count, position, spark };
}

export const fract = (x: number) => x - Math.floor(x);
export const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
