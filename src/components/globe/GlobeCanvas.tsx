"use client";

import { useEffect, useRef, useState } from "react";
import {
  AUTO_SPIN,
  BASE_SPIN,
  BASE_TILT,
  CAMERA_Z,
  HALF_FOV_TAN,
  INTRO_SECONDS,
  INTRO_SWING,
  MARKET_VECTORS,
  ORBITS,
  RIPPLE_ORDER,
  RIPPLE_REACH,
  RIPPLE_SECONDS,
  clamp,
  fract,
  smoothstep,
  type GlobeFrame,
  type GlobeRenderer,
} from "./config";
import { bakePlate } from "./plate";
import { createCanvasRenderer } from "./renderCanvas2d";

/**
 * True when the browser can draw WebGL on a real GPU. Without one (VMs,
 * remote desktops, blocklisted drivers) WebGL is emulated on the CPU and is
 * much slower than the Canvas 2D renderer, so that one is used instead.
 */
function hasHardwareWebGL() {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|basic render|llvmpipe|softpipe|software|warp/i.test(name);
  } catch {
    return false;
  }
}

/**
 * Owns everything the two renderers share: the still of the glass sphere,
 * the intro, rotation with inertia, pointer and scroll response, the ripple
 * schedule, and the frame loop. Each frame it hands a GlobeFrame to whichever
 * renderer suits the machine.
 */
function createGlobe(wrap: HTMLDivElement, onReady: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = "position:absolute;inset:0;display:block;width:100%;height:100%;";
  let disposed = false;

  /* ---- the still: glass core + atmosphere, baked once per size ---- */
  let still: HTMLElement = document.createElement("canvas");
  still.style.cssText = `${layer}will-change:transform;`;
  wrap.append(still);

  /* ---- the live renderer ---- */
  let renderer: GlobeRenderer | null = null;
  let hardware = hasHardwareWebGL();
  let resolution = 1; // sheds itself if frames run long (see tick)
  let width = 0;
  let height = 0;
  let globeRadiusPx = 1;

  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  const applySize = () => renderer?.resize(width, height, pixelRatio() * resolution);

  const mount = (next: GlobeRenderer) => {
    renderer?.canvas.remove();
    renderer?.dispose();
    renderer = next;
    next.canvas.style.cssText = layer;
    wrap.append(next.canvas);
    // Lets the stylesheet switch on the effects that need a real GPU.
    document.documentElement.dataset.gfx = hardware ? "full" : "lite";
    if (width && height) applySize();
  };

  let sizedFor = "";
  const resize = () => {
    width = wrap.clientWidth;
    height = wrap.clientHeight;
    const key = `${width}x${height}@${window.devicePixelRatio}`;
    if (!width || !height || key === sizedFor) return;
    sizedFor = key;
    globeRadiusPx = height / 2 / (CAMERA_Z * HALF_FOV_TAN);

    if (still instanceof HTMLCanvasElement && !bakePlate(still, width, height, pixelRatio())) {
      // No WebGL at all: a CSS sphere stands in for the baked one.
      const fallback = document.createElement("div");
      fallback.className = "globe-fallback";
      still.replaceWith(fallback);
      still = fallback;
    }
    applySize();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrap);
  resize();

  /* ---------------------------------------------------------------- */
  /* Per-frame state                                                   */
  /* ---------------------------------------------------------------- */
  const frame: GlobeFrame = {
    time: 0,
    intro: reduced ? 1 : 0,
    lines: 0,
    fx: 0,
    spin: BASE_SPIN,
    tilt: BASE_TILT,
    parallaxX: 0,
    parallaxY: 0,
    offsetY: 0,
    scale: 1,
    rippleOrigin: [MARKET_VECTORS[0], MARKET_VECTORS[3]],
    ripple: [
      [1, 1, 0],
      [1, 1, 0],
    ],
    ping: MARKET_VECTORS.map(() => 0),
    orbits: ORBITS.map((orbit) => ({ roll: orbit.roll, heads: [...orbit.nodes] })),
    dustSpin: 0,
    dustTip: 0,
  };

  let spin = BASE_SPIN;
  let spinVelocity = reduced ? 0 : AUTO_SPIN;
  let tilt = BASE_TILT;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let pointerX = 0;
  let pointerY = 0;
  let easedX = 0;
  let easedY = 0;
  const rippleProgress = [-0.05, -0.55]; // negative = waiting to start
  let rippleIndex = 0;

  /* ---------------------------------------------------------------- */
  /* Interaction                                                       */
  /* ---------------------------------------------------------------- */
  const overGlobe = (event: PointerEvent) => {
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2 - frame.offsetY * globeRadiusPx;
    return Math.hypot(event.clientX - cx, event.clientY - cy) < globeRadiusPx * 1.06;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!overGlobe(event)) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = performance.now();
    spinVelocity = 0;
    wrap.setPointerCapture(event.pointerId);
    wrap.style.cursor = "grabbing";
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) {
      wrap.style.cursor = overGlobe(event) ? "grab" : "";
      return;
    }
    const now = performance.now();
    const dt = Math.max((now - lastMove) / 1000, 1 / 240);
    const dx = (event.clientX - lastX) / globeRadiusPx;
    const dy = (event.clientY - lastY) / globeRadiusPx;
    spin += dx;
    tilt = clamp(tilt + dy * 0.6, -0.2, 1.2);
    spinVelocity += (dx / dt - spinVelocity) * 0.35;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = now;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastMove > 120) spinVelocity = 0;
    spinVelocity = clamp(spinVelocity, -5, 5);
    if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    wrap.style.cursor = "";
  };
  const onWindowPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerY = (event.clientY / window.innerHeight) * 2 - 1;
  };

  wrap.addEventListener("pointerdown", onPointerDown);
  wrap.addEventListener("pointermove", onPointerMove);
  wrap.addEventListener("pointerup", onPointerUp);
  wrap.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("pointermove", onWindowPointer, { passive: true });

  /* ---------------------------------------------------------------- */
  /* Loop                                                              */
  /* ---------------------------------------------------------------- */
  let frameId = 0;
  let running = false;
  let inView = true;
  let previous = 0;
  let announced = false;
  let frameCost = 1 / 60;
  let lastTune = 0;
  let stillTransform = "";

  const tick = (now: number) => {
    frameId = requestAnimationFrame(tick);
    if (!renderer) return;
    const elapsed = (now - previous) / 1000;
    previous = now;
    const dt = Math.min(elapsed, 0.1);
    if (!reduced) frame.time += dt;
    const time = frame.time;

    // Keep it fluid. If frames keep running long once everything has settled:
    // first shed resolution, and if a "GPU" still cannot keep up, hand over
    // to the Canvas 2D renderer.
    if (frame.intro < 1) lastTune = now + 1500; // ignore the busy first seconds
    frameCost += (Math.min(elapsed, 0.25) - frameCost) * 0.05;
    if (frameCost > 0.045 && now - lastTune > 2000) {
      lastTune = now;
      if (resolution > 0.62) {
        resolution = Math.max(0.6, resolution * 0.85);
        applySize();
      } else if (hardware && frameCost > 0.05) {
        hardware = false;
        resolution = 1;
        frameCost = 1 / 60;
        mount(createCanvasRenderer());
      }
    }

    // Intro: dots assemble, the globe spins into place, rings draw on.
    frame.intro = Math.min(1, frame.intro + Math.min(elapsed, 0.25) / INTRO_SECONDS);
    const settle = 1 - Math.pow(1 - frame.intro, 4);
    frame.lines = smoothstep(0.3, 0.95, frame.intro);
    frame.fx = smoothstep(0.5, 1, frame.intro);

    // Rotation: free-spinning with inertia, easing back to the idle speed.
    if (!dragging) {
      const idle = reduced ? 0 : AUTO_SPIN;
      spinVelocity += (idle - spinVelocity) * (1 - Math.exp(-dt * 1.5));
      spin += spinVelocity * dt;
      tilt += (BASE_TILT - tilt) * (1 - Math.exp(-dt * 1.1));
    }
    const follow = 1 - Math.exp(-dt * 2.6);
    easedX += (pointerX - easedX) * follow;
    easedY += (pointerY - easedY) * follow;

    // Scrolling turns the globe and lets it sink away slower than the page.
    const scrollY = window.scrollY;
    const scrolled = Math.min(scrollY / Math.max(window.innerHeight, 1), 1.3);
    frame.spin = spin - (1 - settle) * INTRO_SWING + scrollY * 0.0016;
    frame.tilt = tilt;
    frame.parallaxX = easedY * 0.1;
    frame.parallaxY = easedX * 0.16;
    frame.offsetY = -scrolled * 0.42;
    frame.scale = (0.9 + 0.1 * settle) * (1 - scrolled * 0.05);

    // The still follows the rig's drift and scale.
    const transform = `translate3d(0,${(-frame.offsetY * globeRadiusPx).toFixed(1)}px,0) scale(${frame.scale.toFixed(4)})`;
    if (transform !== stillTransform) {
      stillTransform = transform;
      still.style.transform = transform;
    }

    // Ripples leave one market after another once the globe has settled.
    if (frame.intro >= 1 && !reduced) {
      for (let i = 0; i < 2; i++) {
        const before = rippleProgress[i];
        let next = before + dt / RIPPLE_SECONDS;
        if (next >= 1) next = -0.1;
        if (before < 0 && next >= 0) {
          const market = RIPPLE_ORDER[rippleIndex++ % RIPPLE_ORDER.length];
          frame.rippleOrigin[i] = MARKET_VECTORS[market];
          frame.ping[market] = 1;
        }
        rippleProgress[i] = next;

        // Shape of the travelling band, in cosine space (no acos per dot).
        const shape = frame.ripple[i];
        if (next < 0) shape[2] = 0;
        else {
          const radius = next * RIPPLE_REACH;
          shape[0] = Math.cos(radius);
          shape[1] = 1 / ((0.05 + 0.07 * next) * Math.max(Math.sin(radius), 0.12));
          shape[2] = Math.pow(1 - next, 1.4);
        }
      }
    }
    const decay = Math.exp(-dt * 1.4);
    for (let i = 0; i < frame.ping.length; i++) frame.ping[i] *= decay;

    ORBITS.forEach((orbit, i) => {
      const state = frame.orbits[i];
      state.roll = orbit.roll + Math.sin(time * 0.12 + orbit.radius * 3) * 0.045;
      orbit.nodes.forEach((start, j) => (state.heads[j] = fract(start + time * orbit.speed)));
    });
    frame.dustSpin = time * 0.018;
    frame.dustTip = Math.sin(time * 0.05) * 0.08;

    renderer.render(frame);
    if (!announced) {
      announced = true;
      onReady();
    }
  };

  const start = () => {
    if (running || !inView || document.hidden || disposed) return;
    running = true;
    previous = performance.now();
    frameId = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  const viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) start();
    else stop();
  });
  viewObserver.observe(wrap);
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  // Pick the renderer. three.js is only downloaded when a GPU will use it.
  if (hardware) {
    import("./renderWebGL")
      .then((module) => module.createWebGLRenderer())
      .catch(() => {
        hardware = false;
        return createCanvasRenderer();
      })
      .then((next) => {
        if (disposed) return next.dispose();
        mount(next);
        start();
      });
  } else {
    mount(createCanvasRenderer());
    start();
  }

  return () => {
    disposed = true;
    stop();
    viewObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pointermove", onWindowPointer);
    wrap.removeEventListener("pointerdown", onPointerDown);
    wrap.removeEventListener("pointermove", onPointerMove);
    wrap.removeEventListener("pointerup", onPointerUp);
    wrap.removeEventListener("pointercancel", onPointerUp);
    wrap.style.cursor = "";
    renderer?.canvas.remove();
    renderer?.dispose();
    still.remove();
  };
}

export default function GlobeCanvas({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    return createGlobe(wrap, () => setReady(true));
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      data-status={ready ? "ready" : "loading"}
      className={`globe-stage ${className}`}
    />
  );
}
