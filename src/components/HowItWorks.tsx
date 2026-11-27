import { ArrowRight } from "./Icons";
import { Box, Plane, Slab, project } from "./iso";
import Reveal from "./Reveal";

/* ------------------------------------------------------------------ */
/* Three isometric illustrations, drawn as inline SVG so they stay      */
/* sharp at any size. Classes such as hiw-lift-2 only add a small hover */
/* movement (see src/app/how-it-works.css).                             */
/* ------------------------------------------------------------------ */

const INK = "#141414";
const SUN = "#ffe500";
const VIEW = "-140 -124 280 216";

function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={VIEW} className="hiw-art" aria-hidden>
      <defs>
        <linearGradient id="hiw-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7b3" />
          <stop offset="1" stopColor={SUN} />
        </linearGradient>
        <linearGradient id="hiw-ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#29292c" />
          <stop offset="1" stopColor="#0d0d0e" />
        </linearGradient>
        <radialGradient id="hiw-pin" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fffbe0" />
          <stop offset="0.5" stopColor={SUN} />
          <stop offset="1" stopColor="#c9a100" />
        </radialGradient>
        <radialGradient id="hiw-halo">
          <stop offset="0" stopColor={SUN} stopOpacity="0.55" />
          <stop offset="1" stopColor={SUN} stopOpacity="0" />
        </radialGradient>
        <pattern id="hiw-dots" width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="7.5" cy="7.5" r="1.7" fill={SUN} />
        </pattern>
        <pattern id="hiw-grid" width="21" height="21" patternUnits="userSpaceOnUse">
          <path d="M21 0H0V21" fill="none" stroke="rgb(17 17 17 / 0.1)" />
        </pattern>
      </defs>
      {children}
    </svg>
  );
}

// 24×24 line icons, drawn inside the artwork
const ICON = {
  people:
    "M9 8.2a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6.5 20v-.8a5.5 5.5 0 0 1 11 0V20M2.6 10.6a2 2 0 1 0 4 0a2 2 0 1 0-4 0M17.4 10.6a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  trend: "M4 16.5 9.5 11l3.5 3.5 7-7M14.5 7.5H20V13",
  pencil:
    "M4 20l1.1-4.3L16.6 4.2a2.05 2.05 0 0 1 2.9 0l.3.3a2.05 2.05 0 0 1 0 2.9L8.3 18.9 4 20zM14.6 6.2l3.2 3.2",
};

/** A small label pill; `x` is its left edge, `y` its vertical centre. */
function Chip({
  x,
  y,
  width,
  dark,
  icon,
  children,
}: {
  x: number;
  y: number;
  width: number;
  dark?: boolean;
  icon: string;
  children: string;
}) {
  return (
    <g className="hiw-lift-2">
      <rect x={x} y={y - 11} width={width} height={28} rx={14} fill="rgb(60 48 0 / 0.16)" />
      <rect
        x={x}
        y={y - 14}
        width={width}
        height={28}
        rx={14}
        fill={dark ? INK : "#fff"}
        stroke={dark ? "none" : "rgb(17 17 17 / 0.1)"}
      />
      <path
        d={icon}
        transform={`translate(${x + 10} ${y - 8.4}) scale(0.7)`}
        fill="none"
        stroke={dark ? SUN : INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={x + 33} y={y + 4.4} className="hiw-chip-text" fill={dark ? SUN : INK}>
        {children}
      </text>
    </g>
  );
}

/** Step 1 – a stack of survey sheets; the top one carries the question. */
function QuestionsArt() {
  const sheet = { x: -65, y: -46, w: 130, d: 92, radius: 13, depth: 3.5, edge: "#d6cdac" };
  const ruled = (
    <g fill="rgb(17 17 17 / 0.09)">
      <rect x={-51} y={-24} width={84} height={3} rx={1.5} />
      <rect x={-51} y={-10} width={100} height={3} rx={1.5} />
      <rect x={-51} y={4} width={70} height={3} rx={1.5} />
    </g>
  );

  return (
    <Art>
      <Plane>
        <rect x={-50} y={-32} width={130} height={92} rx={13} fill="rgb(60 48 0 / 0.13)" />
      </Plane>
      <Slab {...sheet} z={4} turn={-6} fill="#f8f4e4" stroke="rgb(17 17 17 / 0.08)">
        {ruled}
      </Slab>
      <g className="hiw-lift-1">
        <Slab {...sheet} z={26} fill="#fbf8ec" stroke="rgb(17 17 17 / 0.08)">
          {ruled}
        </Slab>
      </g>
      <g className="hiw-lift-2">
        <Slab {...sheet} z={48} turn={6} fill="#fff" stroke="rgb(17 17 17 / 0.1)">
          <rect x={-53} y={-35} width={28} height={14} rx={7} fill={SUN} />
          <text x={-39} y={-24.8} textAnchor="middle" className="hiw-tag-text" fill={INK}>
            Q1
          </text>
          <rect x={-53} y={-11} width={100} height={6} rx={3} fill={INK} />
          <rect x={-53} y={1} width={66} height={6} rx={3} fill="rgb(17 17 17 / 0.3)" />
          <circle cx={-49} cy={20} r={4} fill="none" stroke="rgb(17 17 17 / 0.45)" strokeWidth={1.4} />
          <rect x={-40} y={17.5} width={50} height={5} rx={2.5} fill="rgb(17 17 17 / 0.16)" />
          <circle cx={-49} cy={34} r={4} fill={SUN} stroke={INK} strokeWidth={1.4} />
          <rect x={-40} y={31.5} width={62} height={5} rx={2.5} fill="rgb(17 17 17 / 0.5)" />
        </Slab>
      </g>
      <g className="hiw-lift-3">
        <rect x={68} y={-100} width={42} height={42} rx={13} fill="rgb(60 48 0 / 0.18)" />
        <rect x={66} y={-106} width={42} height={42} rx={13} fill="url(#hiw-sun)" />
        <path
          d={ICON.pencil}
          transform="translate(75 -97)"
          fill="none"
          stroke={INK}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </Art>
  );
}

const PINS = [
  { x: -48, y: -42, h: 26 },
  { x: 0, y: -54, h: 40 },
  { x: 46, y: -32, h: 24 },
  { x: -26, y: 2, h: 34 },
  { x: 24, y: 8, h: 46 },
  { x: -46, y: 46, h: 22 },
  { x: 40, y: 48, h: 30 },
].sort((a, b) => a.x + a.y - (b.x + b.y)); // far pins first, so near ones overlap them

/** Step 2 – respondents rising from a dot-matrix platform. */
function FieldworkArt() {
  return (
    <Art>
      <Plane z={-10}>
        <rect x={-61} y={-61} width={150} height={150} rx={22} fill="rgb(40 30 0 / 0.16)" />
      </Plane>
      <Slab x={-75} y={-75} w={150} d={150} depth={10} radius={22} fill="url(#hiw-ink)" edge="#000">
        <rect x={-75} y={-75} width={150} height={150} rx={22} fill="url(#hiw-dots)" />
        <circle r={30} fill="none" stroke={SUN} strokeWidth={1.4} opacity={0.9} />
        <circle r={56} fill="none" stroke={SUN} strokeWidth={1.2} opacity={0.4} />
      </Slab>
      <g className="hiw-lift-1">
        {PINS.map((pin) => {
          const [bx, by] = project(pin.x, pin.y);
          return (
            <g key={`${pin.x},${pin.y}`}>
              <line x1={bx} y1={by} x2={bx} y2={by - pin.h} stroke={SUN} strokeWidth={2} strokeLinecap="round" />
              <circle cx={bx} cy={by - pin.h - 4} r={13} fill="url(#hiw-halo)" />
              <circle cx={bx} cy={by - pin.h - 4} r={6.8} fill="url(#hiw-pin)" />
            </g>
          );
        })}
      </g>
      <Chip x={-88} y={-104} width={136} icon={ICON.people}>
        1,000 interviews
      </Chip>
    </Art>
  );
}

const BARS = [
  { at: -42, h: 28 },
  { at: -14, h: 50 },
  { at: 14, h: 38 },
  { at: 42, h: 84, hot: true },
];

/** Step 3 – a bar chart; the insight stands out in yellow. */
function InsightsArt() {
  const [hotX, hotY] = project(42, -42, 84);
  return (
    <Art>
      <Plane z={-9}>
        <rect x={-61} y={-61} width={150} height={150} rx={22} fill="rgb(60 48 0 / 0.14)" />
      </Plane>
      <Slab
        x={-75}
        y={-75}
        w={150}
        d={150}
        depth={9}
        radius={22}
        fill="#fffdf6"
        edge="#d6cdac"
        stroke="rgb(17 17 17 / 0.07)"
      >
        <rect x={-75} y={-75} width={150} height={150} rx={22} fill="url(#hiw-grid)" />
      </Slab>
      <circle cx={hotX} cy={hotY} r={40} fill="url(#hiw-halo)" />
      {BARS.map((bar) => (
        <Box
          key={bar.at}
          x={bar.at - 12}
          y={-bar.at - 12}
          w={24}
          d={24}
          h={bar.h}
          top={bar.hot ? "#fff38a" : "#47474b"}
          left={bar.hot ? SUN : "#242427"}
          right={bar.hot ? "#d9ae00" : "#0f0f10"}
        />
      ))}
      <Chip x={0} y={hotY - 22} width={112} dark icon={ICON.trend}>
        Key insight
      </Chip>
    </Art>
  );
}

const STEPS = [
  {
    title: "Write your questions",
    body: "Tell us what you want to learn from consumers.",
    Artwork: QuestionsArt,
  },
  {
    title: "We do the fieldwork",
    body: "We run your questions in our omnibus, with 1,000 interviews per market.",
    Artwork: FieldworkArt,
  },
  {
    title: "Get actionable insights",
    body: "Receive reliable, nationally representative results, fast.",
    Artwork: InsightsArt,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw">
      <div aria-hidden className="hiw-glow" />

      <div className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pb-32 lg:pt-14">
        <Reveal>
          <p className="eyebrow text-[#141414]">How it works</p>
          <h2 className="display mt-5 text-[clamp(2.2rem,3.6vw,3.3rem)]">
            From question to insight, in a few simple steps.
          </h2>
        </Reveal>

        <ol className="hiw-list mt-12 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-14 lg:gap-9">
          {STEPS.map((step, index) => (
            <li key={step.title} className="hiw-card">
              <Reveal delay={0.08 + index * 0.1} className="h-full">
                <article className="hiw-panel">
                  <div aria-hidden className="hiw-stage">
                    <span className="hiw-numeral">{index + 1}</span>
                    <step.Artwork />
                  </div>
                  <div className="px-3 pt-6">
                    <p className="hiw-step">Step {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 text-[21px] font-bold leading-tight tracking-[-0.015em]">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[16px] leading-[1.5] text-stone">{step.body}</p>
                  </div>
                </article>
              </Reveal>
              {index < STEPS.length - 1 && (
                <span aria-hidden className="hiw-link">
                  <ArrowRight size={17} strokeWidth={2.2} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
