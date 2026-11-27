"use client";

import { useEffect, useState } from "react";
import EuropeMap from "./EuropeMap";
import Flag, { type FlagCode } from "./Flag";
import Reveal from "./Reveal";

const MARKETS: { key: string; name: string; capital: string; flag: FlagCode }[] = [
  { key: "F", name: "France", capital: "Paris", flag: "fr" },
  { key: "D", name: "Germany", capital: "Berlin", flag: "de" },
  { key: "I", name: "Italy", capital: "Rome", flag: "it" },
  { key: "E", name: "Spain", capital: "Madrid", flag: "es" },
  { key: "P", name: "Poland", capital: "Warsaw", flag: "pl" },
  { key: "T", name: "Turkey", capital: "Ankara", flag: "tr" },
];

export default function Markets() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Tour the markets until someone points at one.
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % MARKETS.length),
      3000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const active = MARKETS[index];

  return (
    <section
      id="markets"
      className="markets-bg relative isolate overflow-hidden text-white"
    >
      <div className="mx-auto grid max-w-[1320px] items-center gap-6 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-4 lg:px-10 lg:py-24">
        <Reveal>
          <p className="eyebrow">Markets</p>
          <h2 className="display mt-5 text-[clamp(2.4rem,3.9vw,3.6rem)]">
            Consumer insights
            <br />
            <em className="text-sun">across key markets.</em>
          </h2>
          <p className="mt-6 max-w-[470px] text-[18px] leading-[1.55] text-white/75">
            Run the same questions across multiple countries to compare, track
            and uncover meaningful differences between consumers.
          </p>

          <ul
            className="mt-9 flex max-w-[560px] flex-wrap gap-3"
            onMouseLeave={() => setPaused(false)}
          >
            {MARKETS.map((market, i) => (
              <li key={market.key}>
                <button
                  type="button"
                  className="chip"
                  data-active={i === index}
                  onMouseEnter={() => {
                    setPaused(true);
                    setIndex(i);
                  }}
                  onFocus={() => {
                    setPaused(true);
                    setIndex(i);
                  }}
                  onBlur={() => setPaused(false)}
                >
                  <Flag code={market.flag} size={26} />
                  {market.name}
                </button>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15} className="lg:-mr-16 xl:-mr-24">
          <div>
            <EuropeMap active={active.key}>
              <div
                key={active.key}
                className="fade-up flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/15 bg-[#1b1b1d]/92 py-1.5 pl-1.5 pr-4 text-[13.5px] font-bold shadow-[0_18px_40px_-12px_rgb(0_0_0/0.9)]"
              >
                <Flag code={active.flag} size={24} />
                {active.name}
                <span className="font-semibold text-white/55">
                  · n = 1,000
                </span>
              </div>
            </EuropeMap>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
