"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Pencil, People, TrendUp } from "./Icons";
import Reveal from "./Reveal";

/* ------------------------------------------------------------------ */
/* The three little 3D scenes. They are plain DOM: every part sits on  */
/* an isometric ground plane (.hiw-iso) and is raised with translateZ, */
/* so tilting a card reveals real depth between the layers.            */
/* Styles live in src/app/how-it-works.css.                            */
/* ------------------------------------------------------------------ */

const vars = (values: Record<string, string | number>) => values as React.CSSProperties;

/** Step 1 – a stack of survey sheets; the top one writes its question. */
function QuestionsScene() {
  return (
    <div className="hiw-iso">
      <div className="hiw-cast" style={{ left: -74, top: -40, width: 164, height: 116 }} />
      <div
        className="hiw-sheet hiw-sheet-under"
        style={vars({ left: -78, top: -54, "--z": "10px", "--dx": "-12px", "--dy": "12px", "--d": "0.05s" })}
      />
      <div
        className="hiw-sheet hiw-sheet-under"
        style={vars({ left: -78, top: -54, "--z": "34px", "--dx": "0px", "--dy": "0px", "--d": "0.15s" })}
      />
      <div
        className="hiw-sheet"
        style={vars({ left: -78, top: -54, "--z": "58px", "--dx": "12px", "--dy": "-12px", "--d": "0.25s" })}
      >
        <span className="hiw-q-tag">Q1</span>
        <span className="hiw-q-line hiw-q-line-a" />
        <span className="hiw-q-line hiw-q-line-b" />
        <span className="hiw-q-option" style={{ top: 68 }} />
        <span className="hiw-q-option hiw-q-option-on" style={{ top: 85 }} />
      </div>
      <div
        className="hiw-3d hiw-rise hiw-rise-with-stack"
        style={vars({ left: 58, top: -38, "--z": "58px", "--d": "0.55s" })}
      >
        <div className="hiw-up">
          <span className="hiw-badge hiw-float">
            <Pencil size={22} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </div>
  );
}

const PINS = [
  { x: 28, y: 34, h: 26 },
  { x: 76, y: 22, h: 40 },
  { x: 122, y: 44, h: 24 },
  { x: 50, y: 78, h: 34 },
  { x: 100, y: 84, h: 46 },
  { x: 30, y: 122, h: 22 },
  { x: 116, y: 124, h: 30 },
];

/** Step 2 – respondents rising from a dot-matrix platform. */
function FieldworkScene() {
  return (
    <div className="hiw-iso">
      <div className="hiw-tile hiw-tile-ink" style={{ left: -76, top: -76 }}>
        <span className="hiw-ripple" />
        <span className="hiw-ripple" style={{ animationDelay: "-1.4s" }} />
      </div>
      {PINS.map((pin, index) => (
        <div
          key={index}
          className="hiw-3d hiw-pin"
          style={vars({
            left: pin.x - 76,
            top: pin.y - 76,
            "--h": pin.h,
            "--d": `${0.35 + index * 0.09}s`,
            "--beat": `${index * -0.5}s`,
          })}
        >
          <div className="hiw-up">
            <i className="hiw-pin-stem" />
            <i className="hiw-pin-head" />
          </div>
        </div>
      ))}
      <div className="hiw-3d hiw-rise" style={vars({ left: -6, top: -26, "--z": "92px", "--d": "1s" })}>
        <div className="hiw-up">
          <span className="hiw-chip hiw-float">
            <People size={15} strokeWidth={2} />
            1,000 interviews
          </span>
        </div>
      </div>
    </div>
  );
}

const BARS = [
  { x: 14, y: 20, h: 30 },
  { x: 46, y: 47, h: 52 },
  { x: 78, y: 74, h: 40 },
  { x: 110, y: 101, h: 84, hot: true },
];

/** Step 3 – a bar chart that grows; the insight stands out in yellow. */
function InsightsScene() {
  return (
    <div className="hiw-iso">
      <div className="hiw-tile hiw-tile-paper" style={{ left: -76, top: -76 }} />
      {BARS.map((bar, index) => (
        <div
          key={index}
          className="hiw-3d hiw-bar"
          data-hot={bar.hot || undefined}
          style={vars({
            left: bar.x - 76,
            top: bar.y - 76,
            "--h": bar.h,
            "--d": `${0.3 + index * 0.12}s`,
          })}
        >
          <i className="hiw-bar-top" />
          <i className="hiw-bar-left" />
          <i className="hiw-bar-right" />
        </div>
      ))}
      <div className="hiw-3d hiw-rise" style={vars({ left: 47, top: 38, "--z": "104px", "--d": "1.1s" })}>
        <div className="hiw-up">
          <span className="hiw-chip hiw-chip-ink hiw-float">
            <TrendUp size={15} strokeWidth={2.2} />
            Key insight
          </span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Write your questions",
    body: "Tell us what you want to learn from consumers.",
    Scene: QuestionsScene,
  },
  {
    title: "We do the fieldwork",
    body: "We run your questions in our omnibus, with 1,000 interviews per market.",
    Scene: FieldworkScene,
  },
  {
    title: "Get actionable insights",
    body: "Receive reliable, nationally representative results, fast.",
    Scene: InsightsScene,
  },
];

const clamp = (value: number) => Math.min(Math.max(value, -1), 1);

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list) return;

    // "seen" plays the entrance once; "live" lets idle animations run only
    // while the section is actually on screen.
    // "settled" follows shortly after and drops the entrance stagger, so
    // hover changes are not held back by it.
    let settle = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        section.dataset.live = String(entry.isIntersecting);
        if (entry.intersectionRatio >= 0.3 && section.dataset.seen !== "true") {
          section.dataset.seen = "true";
          settle = window.setTimeout(() => (section.dataset.settled = "true"), 2600);
        }
      },
      { threshold: [0, 0.3] },
    );
    observer.observe(list);

    // All three cards lean toward the pointer, like looking around a model.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduced) {
      return () => {
        observer.disconnect();
        window.clearTimeout(settle);
      };
    }

    const cards = Array.from(list.querySelectorAll<HTMLElement>(".hiw-card"));
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const lean = () => {
      frame = 0;
      for (const card of cards) {
        const box = card.getBoundingClientRect();
        const x = clamp((pointerX - (box.left + box.width / 2)) / (box.width * 0.95));
        const y = clamp((pointerY - (box.top + box.height / 2)) / (box.height * 0.95));
        card.style.setProperty("--ry", (x * 10).toFixed(2));
        card.style.setProperty("--rx", (y * -8).toFixed(2));
        card.style.setProperty("--gx", `${(((pointerX - box.left) / box.width) * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${(((pointerY - box.top) / box.height) * 100).toFixed(1)}%`);
      }
    };
    const onMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(lean);
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const card of cards) {
        card.style.setProperty("--rx", "0");
        card.style.setProperty("--ry", "0");
      }
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="hiw">
      <div aria-hidden className="hiw-glow" />
      <div aria-hidden className="hiw-floor" />

      <div className="relative mx-auto max-w-[1320px] px-5 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-44 lg:pt-8">
        <Reveal>
          <p className="eyebrow text-[#141414]">How it works</p>
          <h2 className="display mt-5 text-[clamp(2.2rem,3.6vw,3.3rem)]">
            From question to insight, in a few simple steps.
          </h2>
        </Reveal>

        <ol ref={listRef} className="hiw-list mt-12 grid gap-10 md:grid-cols-3 md:gap-6 lg:mt-14 lg:gap-9">
          {STEPS.map((step, index) => (
            <li key={step.title} className="hiw-card" style={vars({ "--i": index })}>
              <article className="hiw-tilt">
                <span aria-hidden className="hiw-spot" />

                <div aria-hidden className="hiw-stage">
                  <div className="hiw-window" />
                  <span className="hiw-numeral">{index + 1}</span>
                  <step.Scene />
                </div>

                <div className="hiw-body">
                  <p className="hiw-step">Step {String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-[21px] font-bold leading-tight tracking-[-0.015em]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[16px] leading-[1.5] text-stone">{step.body}</p>
                </div>
              </article>

              <span aria-hidden className="hiw-ground" />
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
