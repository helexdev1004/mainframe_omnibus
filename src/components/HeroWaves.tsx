/**
 * The silk ribbons at the foot of the hero; the globe sinks behind them.
 *
 * Each ribbon is its own SVG layer so that, on machines with a GPU, the
 * stylesheet can drift them with compositor-only transforms. Nothing in
 * here repaints per frame.
 */

const BOX = "0 0 1440 640";

const EDGE = {
  back: "M200 640 C540 548 770 452 950 350 C1110 260 1290 172 1560 138",
  main: "M470 640 C730 566 900 470 1070 390 C1210 324 1350 302 1560 316",
  front: "M770 640 C955 588 1110 520 1250 468 C1340 436 1420 418 1560 416",
  hairline: "M-80 540 C330 484 640 388 900 256 C1090 160 1280 72 1560 36",
};

export default function HeroWaves() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[27%] sm:h-[42%] lg:h-[62%]"
    >
      {/* back ribbon + the light it throws onto the dark */}
      <svg viewBox={BOX} preserveAspectRatio="none" className="wave-layer wave-layer-a">
        <defs>
          <radialGradient id="hw-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe500" stopOpacity="0.46" />
            <stop offset="1" stopColor="#ffe500" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hw-back" x1="0.05" y1="1" x2="0.95" y2="0">
            <stop offset="0" stopColor="#ffe500" stopOpacity="0" />
            <stop offset="0.3" stopColor="#f2c500" stopOpacity="0.4" />
            <stop offset="0.68" stopColor="#a88700" stopOpacity="0.5" />
            <stop offset="1" stopColor="#5a4800" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="hw-edge-a" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff27a" stopOpacity="0" />
            <stop offset="0.4" stopColor="#fff6a0" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <ellipse cx="1100" cy="500" rx="640" ry="310" fill="url(#hw-glow)" />
        <path d={`${EDGE.back} L1560 700 L200 700 Z`} fill="url(#hw-back)" />
        <path
          d={EDGE.back}
          fill="none"
          stroke="url(#hw-edge-a)"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
          opacity="0.55"
        />
        <path
          d={EDGE.hairline}
          fill="none"
          stroke="url(#hw-edge-a)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity="0.26"
        />
      </svg>

      {/* main ribbon */}
      <svg viewBox={BOX} preserveAspectRatio="none" className="wave-layer wave-layer-b">
        <defs>
          <linearGradient id="hw-main" x1="0.05" y1="1" x2="0.9" y2="0.05">
            <stop offset="0" stopColor="#ffe500" stopOpacity="0" />
            <stop offset="0.24" stopColor="#ffe500" stopOpacity="0.9" />
            <stop offset="0.62" stopColor="#ffe81f" />
            <stop offset="0.86" stopColor="#f6cf00" />
            <stop offset="1" stopColor="#d9ad00" />
          </linearGradient>
          <linearGradient id="hw-sheen" x1="0.35" y1="0.1" x2="0.75" y2="1">
            <stop offset="0" stopColor="#fffbd6" stopOpacity="0" />
            <stop offset="0.45" stopColor="#fff9c2" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff9c2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hw-edge-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff27a" stopOpacity="0" />
            <stop offset="0.35" stopColor="#fff6a0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d={`${EDGE.main} L1560 700 L470 700 Z`} fill="url(#hw-main)" />
        <path d={`${EDGE.main} L1560 700 L470 700 Z`} fill="url(#hw-sheen)" />
        <path
          d={EDGE.main}
          fill="none"
          stroke="url(#hw-edge-b)"
          strokeWidth="1.6"
          vectorEffect="non-scaling-stroke"
          opacity="0.9"
        />
      </svg>

      {/* front fold: a soft, pale highlight */}
      <svg viewBox={BOX} preserveAspectRatio="none" className="wave-layer wave-layer-c">
        <defs>
          <linearGradient id="hw-front" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#fff27a" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff7b0" stopOpacity="0.72" />
            <stop offset="1" stopColor="#fffbe0" stopOpacity="0.85" />
          </linearGradient>
          <filter id="hw-soft" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <path
          d={`${EDGE.front} L1560 700 L770 700 Z`}
          fill="url(#hw-front)"
          filter="url(#hw-soft)"
        />
      </svg>
    </div>
  );
}
