// Canvas 2D renderer for the globe – used when there is no real GPU (VMs,
// remote desktops, blocklisted drivers), where emulated WebGL is far slower
// than plain CPU drawing. Same scene, same maths as shaders.ts: every dot is
// projected here in JavaScript and drawn additively.
import {
  ARC_STEPS,
  AXIS_LEAN,
  BEACON_HALF,
  CAMERA_Z,
  DOT_RADIUS,
  DOT_SIZE,
  HALF_FOV_TAN,
  KEY_LIGHT,
  LINKS,
  MARKET_VECTORS,
  ORBITS,
  arcPoints,
  arcTiming,
  beaconPhase,
  buildDots,
  buildDust,
  nodeSize,
  orbitPoint,
  type GlobeFrame,
  type GlobeRenderer,
  type Vec3,
} from "./config";

const TAU = Math.PI * 2;

// Bundlers may route every use of an imported binding through the module
// record. These are needed thousands of times a frame, so keep local copies.
const cameraZ = CAMERA_Z;
const arcSteps = ARC_STEPS;
const ringPoint = orbitPoint;
const fract = (x: number) => x - Math.floor(x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// Display-referred sRGB, matching PALETTE in shaders.ts
const GOLD = [237, 179, 5];
const SUN = [255, 230, 13];
const HOT = [255, 250, 194];

/** GOLD → SUN → HOT as `glow` runs 0 → 1 → 2 */
function ramp(glow: number) {
  const upper = glow > 1;
  const from = upper ? SUN : GOLD;
  const to = upper ? HOT : SUN;
  const t = upper ? Math.min(glow - 1, 1) : Math.max(glow, 0);
  return from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
}
const rgba = (rgb: number[], alpha: number) =>
  `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;

/* ---- dot colour by glow (0 → 2), as a 256-entry lookup ---- */
const GLOW_LUT = new Uint8Array(256 * 3);
for (let i = 0; i < 256; i++) GLOW_LUT.set(ramp((i / 255) * 2), i * 3);
/* ---- 3×3 rotations, row-major ---- */
type Mat3 = number[];
const rotX = (a: number): Mat3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
const rotY = (a: number): Mat3 => [Math.cos(a), 0, Math.sin(a), 0, 1, 0, -Math.sin(a), 0, Math.cos(a)];
const rotZ = (a: number): Mat3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];
function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
    }
  }
  return out;
}

/** A soft glowing disc, pre-rendered once and stamped wherever a spark is. */
function makeSprite(withCore: boolean) {
  const size = 96;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const context = sprite.getContext("2d")!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // halo = (1 - d²)³ · 0.6, sampled along the radius
  const halo = (d: number) => Math.pow(1 - d * d, 3) * 0.6;
  if (withCore) {
    gradient.addColorStop(0, rgba(HOT, 1));
    gradient.addColorStop(0.11, rgba(HOT, 1));
    gradient.addColorStop(0.18, rgba(ramp(1.5), 1));
    gradient.addColorStop(0.26, rgba(SUN, halo(0.26)));
  } else {
    gradient.addColorStop(0, rgba(SUN, halo(0)));
    gradient.addColorStop(0.2, rgba(SUN, halo(0.2)));
  }
  for (const d of [0.4, 0.55, 0.7, 0.85]) gradient.addColorStop(d, rgba(SUN, halo(d)));
  gradient.addColorStop(1, rgba(SUN, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return sprite;
}

export function createCanvasRenderer(): GlobeRenderer {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const ctx = context;

  const cloud = buildDots(false);
  const dust = buildDust(110);
  const nodeSprite = makeSprite(true);
  const haloSprite = makeSprite(false);
  const arcs = LINKS.map(([a, b]) => arcPoints(MARKET_VECTORS[a], MARKET_VECTORS[b], arcSteps));

  // The dots are written straight into a pixel buffer (see render): for a few
  // thousand tiny discs that is far cheaper on a CPU than canvas paths.
  let image: ImageData | null = null;
  let dirty = { x0: 0, y0: 0, x1: -1, y1: -1 }; // buffer rect touched last frame

  const count = cloud.count;
  const RING_SEGMENTS = 132;
  const lineX = new Float32Array(RING_SEGMENTS + 1);
  const lineY = new Float32Array(RING_SEGMENTS + 1);
  const lineOn = new Uint8Array(RING_SEGMENTS + 1);
  const point: Vec3 = [0, 0, 0];

  let width = 1;
  let height = 1;
  let ratio = 1;
  let focal = 1; // CSS px per world unit at distance 1

  return {
    canvas,

    resize(nextWidth, nextHeight, nextRatio) {
      width = nextWidth;
      height = nextHeight;
      ratio = nextRatio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      focal = height / 2 / HALF_FOV_TAN;
      image = ctx.createImageData(canvas.width, canvas.height);
      dirty = { x0: 0, y0: 0, x1: -1, y1: -1 };
    },

    render(frame: GlobeFrame) {
      const { time, intro, scale, offsetY } = frame;
      const cx = width / 2;
      const cy = height / 2;

      // rig = pointer parallax · globe = rig × tilt × lean × spin
      const rig = multiply(rotX(frame.parallaxX), rotY(frame.parallaxY));
      const g = multiply(
        multiply(rig, multiply(rotX(frame.tilt), rotZ(AXIS_LEAN))),
        rotY(frame.spin),
      );

      // Is a world-space point hidden behind the globe, as seen from the camera?
      const globeRadius = 0.997 * scale;
      const ez = cameraZ;
      const ey = -offsetY;
      const cTerm = ey * ey + ez * ez - globeRadius * globeRadius;
      const occluded = (wx: number, wy: number, wz: number) => {
        const dz = wz - cameraZ;
        const a = wx * wx + wy * wy + dz * dz;
        const b = 2 * (wy * ey + dz * ez);
        const disc = b * b - 4 * a * cTerm;
        if (disc <= 0) return false;
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        return t > 0 && t < 0.999;
      };

      /* ------------------------------ dots ------------------------------
         Each visible dot is splatted into `image` as a small anti-aliased disc:
         colour by max, alpha by (clamped) addition – i.e. additive glow.     */
      if (!image) return;
      const pixels = image.data;
      const bufferWidth = image.width;
      const bufferHeight = image.height;
      // wipe only what the previous frame touched
      for (let y = dirty.y0; y <= dirty.y1; y++) {
        pixels.fill(0, (y * bufferWidth + dirty.x0) * 4, (y * bufferWidth + dirty.x1 + 1) * 4);
      }
      let minX = bufferWidth;
      let minY = bufferHeight;
      let maxX = -1;
      let maxY = -1;

      // Locals for the hot loop: imported bindings are looked up through the
      // module record on every use, which is slow in development bundles.
      const dotSize = DOT_SIZE;
      const lightX = KEY_LIGHT[0];
      const lightY = KEY_LIGHT[1];
      const lightZ = KEY_LIGHT[2];
      const g0 = g[0], g1 = g[1], g2 = g[2], g3 = g[3], g4 = g[4], g5 = g[5], g6 = g[6], g7 = g[7], g8 = g[8];
      const o0x = frame.rippleOrigin[0][0], o0y = frame.rippleOrigin[0][1], o0z = frame.rippleOrigin[0][2];
      const o1x = frame.rippleOrigin[1][0], o1y = frame.rippleOrigin[1][1], o1z = frame.rippleOrigin[1][2];
      const r0c = frame.ripple[0][0], r0w = frame.ripple[0][1], r0s = frame.ripple[0][2];
      const r1c = frame.ripple[1][0], r1w = frame.ripple[1][1], r1s = frame.ripple[1][2];
      const halfWidth = cx * ratio;
      const halfHeight = cy * ratio;
      const focalBuffer = focal * ratio;
      const occludeRadius2 = globeRadius * globeRadius;

      const P = cloud.position;
      const S = cloud.scatter;
      const SEED = cloud.seed;
      const inverseRadius = 1 / DOT_RADIUS;
      const assembled = intro >= 1;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const px = P[i3];
        const py = P[i3 + 1];
        const pz = P[i3 + 2];
        const rnd = SEED[i * 2];

        // intro flight
        let t = 1;
        let e = 1;
        let lx = px;
        let ly = py;
        let lz = pz;
        if (!assembled) {
          t = intro * 1.6 - rnd * 0.6;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const q = (1 - t) * (1 - t);
          e = 1 - q * q;
          lx = S[i3] + (px - S[i3]) * e;
          ly = S[i3 + 1] + (py - S[i3 + 1]) * e;
          lz = S[i3 + 2] + (pz - S[i3 + 2]) * e;
        }

        const wx = (g0 * lx + g1 * ly + g2 * lz) * scale;
        const wy = (g3 * lx + g4 * ly + g5 * lz) * scale + offsetY;
        const wz = (g6 * lx + g7 * ly + g8 * lz) * scale;
        const depth = cameraZ - wz;

        // surface normal (view space) against the direction to the camera
        const nx = (g0 * px + g1 * py + g2 * pz) * inverseRadius;
        const ny = (g3 * px + g4 * py + g5 * pz) * inverseRadius;
        const nz = (g6 * px + g7 * py + g8 * pz) * inverseRadius;
        let facing = (-nx * wx - ny * wy + nz * depth) / Math.sqrt(wx * wx + wy * wy + depth * depth);

        if (e >= 0.97) {
          if (facing <= 0) continue;
        } else {
          // still in flight: hidden while the globe is between it and the camera
          const dz = wz - cameraZ;
          const a = wx * wx + wy * wy + dz * dz;
          const b = 2 * (wy * ey + dz * ez);
          const disc = b * b - 4 * a * (ey * ey + ez * ez - occludeRadius2);
          if (disc > 0) {
            const hit = (-b - Math.sqrt(disc)) / (2 * a);
            if (hit > 0 && hit < 0.999) continue;
          }
          if (facing < 0) facing = 0;
          facing = 1 + (facing - 1) * e;
        }

        // limb fade: smoothstep(0.02, 0.42, facing)
        let limb = (facing - 0.02) * 2.5;
        if (limb <= 0) continue;
        limb = limb >= 1 ? 1 : limb * limb * (3 - 2 * limb);
        let light = nx * lightX + ny * lightY + nz * lightZ;
        if (light < 0) light = 0;

        // ripples, compared in cosine space
        let ripple = 0;
        let x = ((px * o0x + py * o0y + pz * o0z) * 0.996 - r0c) * r0w;
        if (x > -1 && x < 1) ripple += (1 - x * x) * (1 - x * x) * r0s;
        x = ((px * o1x + py * o1y + pz * o1z) * 0.996 - r1c) * r1w;
        if (x > -1 && x < 1) ripple += (1 - x * x) * (1 - x * x) * r1s;

        // a brief blink once per cycle
        let phase = time * (0.07 + rnd * 0.16) + rnd * 13;
        phase -= Math.floor(phase);
        let twinkle = 1 - Math.abs(phase - 0.5) * 30;
        twinkle = twinkle > 0 ? twinkle * twinkle : 0;

        const market = SEED[i * 2 + 1] > 1.5 ? 1 : 0;
        let alpha = 0.42 + 0.58 * light + market * 0.3 + ripple * 0.6 + twinkle * 0.6;
        if (alpha > 1) alpha = 1;
        alpha *= limb;
        if (!assembled) {
          const appear = t >= 0.3 ? 1 : (t / 0.3) * (t / 0.3) * (3 - 2 * (t / 0.3));
          alpha *= appear;
        }
        if (alpha < 0.02) continue;

        const glow = 0.22 + light * 0.78 + market * 0.5 + ripple * 1.1 + twinkle;
        const size = dotSize * (1 + market * 0.2 + ripple * 0.6 + twinkle * 0.55) * (1.9 - 0.9 * e);

        // to buffer pixels
        const project = focalBuffer / depth;
        const bx = halfWidth + wx * project;
        const by = halfHeight - wy * project;
        const reach = Math.max(size * project * 0.43, 0.5) + 0.5; // disc radius + AA fringe
        const x0 = Math.max(Math.floor(bx - reach), 0);
        const x1 = Math.min(Math.ceil(bx + reach), bufferWidth - 1);
        const y0 = Math.max(Math.floor(by - reach), 0);
        const y1 = Math.min(Math.ceil(by + reach), bufferHeight - 1);
        if (x0 > x1 || y0 > y1) continue;
        if (x0 < minX) minX = x0;
        if (x1 > maxX) maxX = x1;
        if (y0 < minY) minY = y0;
        if (y1 > maxY) maxY = y1;

        const tone = Math.min((glow * 127.5) | 0, 255) * 3;
        const red = GLOW_LUT[tone];
        const green = GLOW_LUT[tone + 1];
        const blue = GLOW_LUT[tone + 2];
        const strength = alpha * 255;
        for (let y = y0; y <= y1; y++) {
          const dy = y + 0.5 - by;
          let at = (y * bufferWidth + x0) * 4;
          for (let xx = x0; xx <= x1; xx++, at += 4) {
            const dx = xx + 0.5 - bx;
            const cover = reach - Math.sqrt(dx * dx + dy * dy);
            if (cover <= 0) continue;
            if (pixels[at] < red) pixels[at] = red;
            if (pixels[at + 1] < green) pixels[at + 1] = green;
            if (pixels[at + 2] < blue) pixels[at + 2] = blue;
            pixels[at + 3] += cover >= 1 ? strength : strength * cover; // clamps at 255
          }
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, bufferWidth, bufferHeight);
      if (maxX >= minX && maxY >= minY) {
        ctx.putImageData(image, 0, 0, minX, minY, maxX - minX + 1, maxY - minY + 1);
      }
      dirty = { x0: minX, y0: minY, x1: maxX, y1: maxY };

      // everything else is drawn in CSS pixels, adding light on top
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = "lighter";

      /* ------------------------- orbit rings + nodes ------------------------- */
      ctx.lineCap = "butt";
      ORBITS.forEach((def, index) => {
        const state = frame.orbits[index];
        const direction = Math.sign(def.speed);

        for (let s = 0; s <= RING_SEGMENTS; s++) {
          ringPoint(def.radius, def.pitch, state.roll, s / RING_SEGMENTS, point);
          const wx = (rig[0] * point[0] + rig[1] * point[1] + rig[2] * point[2]) * scale;
          const wy = (rig[3] * point[0] + rig[4] * point[1] + rig[5] * point[2]) * scale + offsetY;
          const wz = (rig[6] * point[0] + rig[7] * point[1] + rig[8] * point[2]) * scale;
          const project = focal / (cameraZ - wz);
          lineX[s] = cx + wx * project;
          lineY[s] = cy - wy * project;
          lineOn[s] = occluded(wx, wy, wz) ? 0 : 1;
        }

        ctx.lineWidth = 1.25;
        for (let s = 0; s < RING_SEGMENTS; s++) {
          if (!lineOn[s] || !lineOn[s + 1]) continue;
          const u = (s + 0.5) / RING_SEGMENTS;
          const drawn = 1 - smoothstep(frame.lines - 0.08, frame.lines, u * 0.92);
          if (drawn <= 0) continue;
          let alpha = def.base;
          let hot = 0;
          for (const at of state.heads) {
            const f = 1 - fract((at - u) * direction);
            const f8 = f ** 8;
            alpha += f8 * f * 0.85;
            hot = Math.max(hot, f8 ** 5);
          }
          ctx.strokeStyle = rgba(ramp(1 + hot), Math.min(alpha, 1) * drawn);
          ctx.beginPath();
          ctx.moveTo(lineX[s], lineY[s]);
          ctx.lineTo(lineX[s + 1], lineY[s + 1]);
          ctx.stroke();
        }

        ctx.globalAlpha = frame.fx;
        state.heads.forEach((at, i) => {
          ringPoint(def.radius, def.pitch, state.roll, at, point);
          const wx = (rig[0] * point[0] + rig[1] * point[1] + rig[2] * point[2]) * scale;
          const wy = (rig[3] * point[0] + rig[4] * point[1] + rig[5] * point[2]) * scale + offsetY;
          const wz = (rig[6] * point[0] + rig[7] * point[1] + rig[8] * point[2]) * scale;
          if (occluded(wx, wy, wz)) return;
          const project = focal / (cameraZ - wz);
          const size = Math.max(nodeSize(i) * project, 3);
          ctx.drawImage(nodeSprite, cx + wx * project - size / 2, cy - wy * project - size / 2, size, size);
        });
        ctx.globalAlpha = 1;
      });

      if (frame.fx > 0.004) {
        /* ------------------------------ arcs ------------------------------ */
        ctx.lineWidth = 1.2;
        arcs.forEach((points, index) => {
          const { offset, speed } = arcTiming(index);
          const pulse = fract(time * speed + offset) * 1.7;
          for (let s = 0; s <= arcSteps; s++) {
            const [ax, ay, az] = points[s];
            const wx = (g[0] * ax + g[1] * ay + g[2] * az) * scale;
            const wy = (g[3] * ax + g[4] * ay + g[5] * az) * scale + offsetY;
            const wz = (g[6] * ax + g[7] * ay + g[8] * az) * scale;
            const project = focal / (cameraZ - wz);
            lineX[s] = cx + wx * project;
            lineY[s] = cy - wy * project;
            lineOn[s] = occluded(wx, wy, wz) ? 0 : 1;
          }
          for (let s = 0; s < arcSteps; s++) {
            if (!lineOn[s] || !lineOn[s + 1]) continue;
            const u = (s + 0.5) / arcSteps;
            const behind = pulse - u;
            const f = Math.max(1 - behind * 1.6, 0);
            const trail = behind >= 0 ? f ** 4 : 0;
            const ends = smoothstep(0, 0.08, u) * (1 - smoothstep(0.92, 1, u));
            const alpha = (0.22 + trail * 0.9) * (0.35 + 0.65 * ends) * frame.fx;
            ctx.strokeStyle = rgba(ramp(1 + trail), Math.min(alpha, 1));
            ctx.beginPath();
            ctx.moveTo(lineX[s], lineY[s]);
            ctx.lineTo(lineX[s + 1], lineY[s + 1]);
            ctx.stroke();
          }
        });

        /* ----------------------------- beacons ----------------------------- */
        MARKET_VECTORS.forEach((market, index) => {
          const nx = g[0] * market[0] + g[1] * market[1] + g[2] * market[2];
          const ny = g[3] * market[0] + g[4] * market[1] + g[5] * market[2];
          const nz = g[6] * market[0] + g[7] * market[1] + g[8] * market[2];
          const wx = nx * 1.012 * scale;
          const wy = ny * 1.012 * scale + offsetY;
          const wz = nz * 1.012 * scale;
          const depth = cameraZ - wz;
          const facing = (-nx * wx - ny * wy + nz * depth) / Math.hypot(wx, wy, depth);
          if (facing <= 0.03) return;

          const project = focal / depth;
          const x = cx + wx * project;
          const y = cy - wy * project;
          const reach = BEACON_HALF * scale * project; // radius of the beacon, px
          const ping = frame.ping[index];
          const tangent = Math.atan2(-ny, nx); // the disc is squashed along this axis
          const visible = frame.fx * smoothstep(0.03, 0.2, facing);

          const haloSize = reach * 2 * (1 + ping * 0.45);
          ctx.globalAlpha = Math.min((0.35 + ping * 0.6) * visible, 1);
          ctx.drawImage(haloSprite, x - haloSize / 2, y - haloSize / 2, haloSize, haloSize);
          ctx.globalAlpha = 1;

          ctx.lineWidth = Math.max(reach * 0.075, 0.9);
          for (const shift of [0, 0.5]) {
            const t = fract(time * 0.38 + beaconPhase(index) + shift);
            const ring = reach * t * 0.95;
            ctx.strokeStyle = rgba(SUN, Math.min((1 - t) * (0.55 + ping * 0.6) * visible, 1));
            ctx.beginPath();
            ctx.ellipse(x, y, Math.max(ring * facing, 0.01), Math.max(ring, 0.01), tangent, 0, TAU);
            ctx.stroke();
          }

          const core = reach * 0.15;
          ctx.fillStyle = rgba(HOT, visible);
          ctx.beginPath();
          ctx.ellipse(x, y, Math.max(core * facing, 0.3), core, tangent, 0, TAU);
          ctx.fill();
        });

        /* ------------------------------ dust ------------------------------ */
        const d = multiply(rig, multiply(rotX(frame.dustTip), rotY(frame.dustSpin)));
        const DP = dust.position;
        const DS = dust.spark;
        ctx.fillStyle = rgba(SUN, 1);
        for (let i = 0; i < dust.count; i++) {
          const i3 = i * 3;
          const wx = (d[0] * DP[i3] + d[1] * DP[i3 + 1] + d[2] * DP[i3 + 2]) * scale;
          const wy = (d[3] * DP[i3] + d[4] * DP[i3 + 1] + d[5] * DP[i3 + 2]) * scale + offsetY;
          const wz = (d[6] * DP[i3] + d[7] * DP[i3 + 1] + d[8] * DP[i3 + 2]) * scale;
          if (occluded(wx, wy, wz)) continue;
          const project = focal / (cameraZ - wz);
          const seed = DS[i3 + 2];
          const wave = Math.abs(fract(time * (0.08 + seed * 0.12) + seed * 7) - 0.5) * 2;
          ctx.globalAlpha = DS[i3 + 1] * (0.25 + 0.75 * wave) * frame.fx;
          ctx.beginPath();
          ctx.arc(cx + wx * project, cy - wy * project, Math.max(DS[i3] * project * 0.3, 0.6), 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },

    dispose() {
      canvas.width = canvas.height = 0;
    },
  };
}
