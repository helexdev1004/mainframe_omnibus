import europe from "@/data/europe.json";
import Flag, { type FlagCode } from "./Flag";
import { ArrowRight, People, Rosette } from "./Icons";
import Reveal from "./Reveal";

type Wave = {
  country: string;
  flag: FlagCode;
  /** the country's letter in src/data/europe.json */
  map: string;
  type: "Free" | "Standard";
};

// The schedule, grouped by month. The very first wave is shown as "next".
const SCHEDULE: { month: string; year: string; waves: Wave[] }[] = [
  {
    month: "December",
    year: "2026",
    waves: [{ country: "France", flag: "fr", map: "F", type: "Free" }],
  },
  {
    month: "January",
    year: "2027",
    waves: [
      { country: "Germany", flag: "de", map: "D", type: "Standard" },
      { country: "Italy", flag: "it", map: "I", type: "Free" },
    ],
  },
  {
    month: "February",
    year: "2027",
    waves: [
      { country: "Spain", flag: "es", map: "E", type: "Standard" },
      { country: "Poland", flag: "pl", map: "P", type: "Free" },
    ],
  },
];

/** The cells of the Europe dot grid that belong to one country. */
function countryShape(letter: string) {
  const cells: [number, number][] = [];
  europe.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === letter) cells.push([x, y]);
  });
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const capital = europe.cities.find((city) => city.key === letter);
  return {
    cells: cells.map(([x, y]) => [x - minX, y - minY]),
    width: Math.max(...cells.map(([x]) => x)) - minX + 1,
    height: Math.max(...cells.map(([, y]) => y)) - minY + 1,
    capital: capital ? { x: capital.x - minX, y: capital.y - minY } : null,
  };
}

/**
 * A country drawn in the site's dot-matrix language. Each dot gets a darker
 * copy just below it, which reads as a raised stud; the capital is marked.
 * Vector, so it is sharp at any size.
 */
function CountryDots({ letter, tone }: { letter: string; tone: "ink" | "sun" }) {
  const shape = countryShape(letter);
  const dot = tone === "sun" ? "#ffe500" : "#1b1b1b";
  const under = tone === "sun" ? "#7a6700" : "rgb(27 27 27 / 0.22)";

  return (
    <svg
      viewBox={`-1 -1 ${shape.width + 2} ${shape.height + 2.4}`}
      className="wave-dots"
      aria-hidden
    >
      <g fill={under}>
        {shape.cells.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x + 0.6} cy={y + 0.82} r={0.36} />
        ))}
      </g>
      <g fill={dot}>
        {shape.cells.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x + 0.5} cy={y + 0.5} r={0.36} />
        ))}
      </g>
      {shape.capital && (
        <g>
          <circle
            cx={shape.capital.x}
            cy={shape.capital.y}
            r={2.1}
            fill={tone === "sun" ? "rgb(255 255 255 / 0.2)" : "rgb(255 229 0 / 0.55)"}
          />
          <circle
            cx={shape.capital.x}
            cy={shape.capital.y}
            r={0.9}
            fill={tone === "sun" ? "#fff" : "#ffe500"}
            stroke={tone === "sun" ? "none" : "#141414"}
            strokeWidth={0.3}
          />
        </g>
      )}
    </svg>
  );
}

function Facts() {
  return (
    <ul className="wave-facts">
      <li>
        <People size={17} strokeWidth={1.9} />
        1,000 interviews
      </li>
      <li>
        <Rosette size={17} strokeWidth={1.9} />
        Nationally representative
      </li>
    </ul>
  );
}

/** The next wave: a tall dark card led by the country's dot map. */
function FeaturedWave({ wave, when }: { wave: Wave; when: string }) {
  return (
    <article className="wave-card wave-card-featured">
      <div className="flex items-center justify-between">
        <p className="wave-label">Next wave</p>
        <span className="wave-type" data-type={wave.type}>
          {wave.type}
        </span>
      </div>

      <div className="wave-feature-map">
        <CountryDots letter={wave.map} tone="sun" />
      </div>

      <div className="flex items-center gap-4">
        <span className="wave-coin">
          <Flag code={wave.flag} size={54} />
        </span>
        <div>
          <h3 className="text-[30px] font-bold leading-none tracking-[-0.02em]">
            {wave.country}
          </h3>
          <p className="mt-2 text-[14px] font-semibold text-white/60">{when}</p>
        </div>
      </div>

      <div className="mt-5">
        <Facts />
      </div>

      <a
        href="#"
        aria-label={`Book the ${when} wave in ${wave.country}`}
        className="btn btn-sun mt-6 h-12 w-full text-[15.5px]"
      >
        Book now
        <ArrowRight size={18} />
      </a>
    </article>
  );
}

function WaveCard({ wave, when }: { wave: Wave; when: string }) {
  return (
    <article className="wave-card">
      <div className="wave-card-main">
        <div className="flex items-center gap-3.5">
          <span className="wave-coin">
            <Flag code={wave.flag} size={46} />
          </span>
          <h3 className="text-[22px] font-bold leading-none tracking-[-0.015em]">
            {wave.country}
          </h3>
        </div>

        <div className="mt-5">
          <Facts />
        </div>

        <a
          href="#"
          aria-label={`Book the ${when} wave in ${wave.country}`}
          className="btn btn-sun mt-auto h-10 px-5 text-[14.5px]"
        >
          Book now
          <ArrowRight size={16} />
        </a>
      </div>

      <div className="wave-card-map">
        <span className="wave-type" data-type={wave.type}>
          {wave.type}
        </span>
        <CountryDots letter={wave.map} tone="ink" />
      </div>
    </article>
  );
}

export default function UpcomingWaves() {
  return (
    <section
      id="waves"
      className="relative z-20 -mt-10 overflow-hidden rounded-t-[36px] bg-cream sm:rounded-t-[44px]"
    >
      <div aria-hidden className="waves-glow" />

      <div className="relative mx-auto max-w-[1320px] px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pb-24 lg:pt-24">
        <Reveal className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-end lg:gap-16">
          <div>
            <span className="block h-1.5 w-9 rounded-full bg-sun" />
            <h2 className="display mt-6 text-[clamp(2.4rem,3.9vw,3.6rem)]">
              Upcoming omnibus waves
            </h2>
          </div>
          <div>
            <p className="text-[17.5px] leading-[1.55] text-stone">
              Join our next waves to get fast, reliable consumer insights in
              your target markets.
            </p>
            <a
              href="#"
              className="group mt-5 inline-flex items-center gap-3 text-[16px] font-bold text-[#141414]"
            >
              <span className="border-b-2 border-[#141414] pb-0.5 transition-colors duration-300 group-hover:border-sun-deep">
                View full omnibus schedule
              </span>
              <ArrowRight
                size={18}
                className="transition-transform duration-500 group-hover:translate-x-1.5"
              />
            </a>
          </div>
        </Reveal>

        {/* one column per month, read left to right */}
        <div className="mt-12 grid gap-12 lg:mt-14 lg:grid-cols-3 lg:gap-7">
          {SCHEDULE.map((group, index) => {
            const when = `${group.month} ${group.year}`;
            return (
              <Reveal key={when} delay={index * 0.1} className="waves-month">
                <header className="waves-month-head" data-next={index === 0 || undefined}>
                  <span className="waves-month-dot" />
                  <span className="waves-month-name">{group.month}</span>
                  <span className="waves-month-year">{group.year}</span>
                  <span className="waves-month-line" />
                </header>
                <ul className="waves-month-list">
                  {group.waves.map((wave, position) => {
                    const featured = index === 0 && position === 0;
                    return (
                      <li
                        key={wave.country}
                        className="wave-slot"
                        data-featured={featured || undefined}
                      >
                        {featured ? (
                          <FeaturedWave wave={wave} when={when} />
                        ) : (
                          <WaveCard wave={wave} when={when} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
