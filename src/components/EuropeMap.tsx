"use client";

import { useEffect, useRef } from "react";
import europe from "@/data/europe.json";

type Dot = { x: number; y: number; kind: string; seed: number; level: number };

const TAU = Math.PI * 2;

/**
 * Dot-matrix map of Europe. The active market lights up and sends a ripple
 * out from its capital – the 2D sibling of the hero globe.
 */
export default function EuropeMap({
  active,
  children,
}: {
  /** key of the highlighted market: F D I E P T */
  active: string;
  /** label rendered above the active capital */
  children?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const changedAt = useRef(0);

  useEffect(() => {
    activeRef.current = active;
    changedAt.current = performance.now();
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { w, rows, cities } = europe;

    const dots: Dot[] = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const kind = row[x];
        if (kind !== ".") {
          dots.push({ x: x + 0.5, y: y + 0.5, kind, seed: Math.random(), level: 0 });
        }
      }
    });

    let width = 0;
    let height = 0;
    let cell = 1;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cell = width / w;
    };

    const draw = (now: number) => {
      const t = reduced ? 0 : now / 1000;
      const key = activeRef.current;
      const capital = cities.find((city) => city.key === key);
      const front = reduced ? 1e6 : ((now - changedAt.current) / 1000) * 24;
      const frontFade = Math.max(0, 1 - front / 64);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (capital) {
        const cx = capital.x * cell;
        const cy = capital.y * cell;
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 17);
        halo.addColorStop(0, "rgba(255,229,0,0.26)");
        halo.addColorStop(1, "rgba(255,229,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(cx - cell * 17, cy - cell * 17, cell * 34, cell * 34);
      }

      for (const dot of dots) {
        dot.level += ((dot.kind === key ? 1 : 0) - dot.level) * 0.09;

        let alpha = dot.kind === "," ? 0.09 : dot.kind === "o" ? 0.34 : 0.82;
        const shimmer =
          0.5 + 0.5 * Math.sin(dot.x * 0.21 + dot.y * 0.13 - t * 1.15 + dot.seed * 0.7);
        alpha *= 0.76 + 0.36 * shimmer;

        let ripple = 0;
        if (capital && frontFade > 0) {
          const distance = Math.hypot(dot.x - capital.x, dot.y - capital.y);
          const x = (distance - front) / 2.4;
          ripple = Math.exp(-x * x) * frontFade;
        }

        const light = Math.min(1, dot.level * 0.55 + ripple * 0.85);
        const a = Math.min(1, alpha + dot.level * 0.5 + ripple * 0.5);
        const radius = cell * (0.28 + dot.level * 0.07 + ripple * 0.1);

        ctx.fillStyle = `rgba(255,${(229 + 22 * light) | 0},${(light * 150) | 0},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x * cell, dot.y * cell, radius, 0, TAU);
        ctx.fill();
      }

      cities.forEach((city, index) => {
        const cx = city.x * cell;
        const cy = city.y * cell;
        const isActive = city.key === key;
        const phase = (t * 0.45 + index * 0.17) % 1;

        ctx.lineWidth = isActive ? 1.6 : 1.1;
        ctx.strokeStyle = `rgba(255,240,130,${((1 - phase) * (isActive ? 0.85 : 0.45)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * (0.9 + phase * (isActive ? 4.4 : 2.6)), 0, TAU);
        ctx.stroke();

        ctx.fillStyle = isActive ? "#fffbe0" : "rgba(255,246,170,0.95)";
        ctx.shadowColor = "rgba(255,229,0,0.9)";
        ctx.shadowBlur = cell * (isActive ? 3.2 : 1.6);
        ctx.beginPath();
        ctx.arc(cx, cy, cell * (isActive ? 0.72 : 0.5), 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    // The shimmer is slow, so ~30 fps is plenty and halves the canvas work.
    let frame = 0;
    let running = false;
    let lastDraw = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - lastDraw < 30) return;
      lastDraw = now;
      draw(now);
    };
    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    resizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "120px" },
    );
    viewObserver.observe(canvas);

    return () => {
      stop();
      resizeObserver.disconnect();
      viewObserver.disconnect();
    };
  }, []);

  const capital = europe.cities.find((city) => city.key === active);

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${europe.w} / ${europe.h}` }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_78%_80%_at_50%_50%,#000_58%,transparent_100%)]"
      />
      {capital && children && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+18px)] transition-[left,top] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: `${(capital.x / europe.w) * 100}%`,
            top: `${(capital.y / europe.h) * 100}%`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
