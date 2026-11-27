import Flag, { type FlagCode } from "./Flag";
import { ArrowRight } from "./Icons";
import Reveal from "./Reveal";

type Wave = {
  month: string;
  country: string;
  flag: FlagCode;
  type: "Free" | "Standard";
};

const WAVES: Wave[] = [
  { month: "Dec 2026", country: "France", flag: "fr", type: "Free" },
  { month: "Jan 2027", country: "Germany", flag: "de", type: "Standard" },
  { month: "Jan 2027", country: "Italy", flag: "it", type: "Free" },
  { month: "Feb 2027", country: "Spain", flag: "es", type: "Standard" },
  { month: "Feb 2027", country: "Poland", flag: "pl", type: "Free" },
];

const COLUMNS =
  "sm:grid-cols-[1fr_1.35fr_1fr_1fr_auto] sm:items-center sm:gap-x-4";

function TypeBadge({ type }: { type: Wave["type"] }) {
  return (
    <span
      className={`inline-flex h-8 min-w-[78px] items-center justify-center rounded-full px-4 text-[13.5px] font-bold ${
        type === "Standard"
          ? "bg-sun/35 text-[#3d3400] ring-1 ring-inset ring-sun-deep/40"
          : "bg-[#ecebe6] text-[#2a2a28]"
      }`}
    >
      {type}
    </span>
  );
}

export default function UpcomingWaves() {
  return (
    <section
      id="waves"
      className="relative z-20 -mt-10 overflow-hidden rounded-t-[36px] bg-cream sm:rounded-t-[44px]"
    >
      {/* soft sun rising from the lower-left corner, as in the reference */}
      <svg
        aria-hidden
        viewBox="0 0 600 360"
        preserveAspectRatio="none"
        className="pointer-events-none absolute bottom-0 left-0 h-[46%] w-[min(60%,720px)]"
      >
        <defs>
          <linearGradient id="uw-sun" x1="0" y1="1" x2="0.8" y2="0">
            <stop offset="0" stopColor="#ffe500" stopOpacity="0.95" />
            <stop offset="0.55" stopColor="#fff27a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff9c9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 120 C120 100 260 150 380 250 C440 300 500 340 600 360 L0 360 Z"
          fill="url(#uw-sun)"
        />
        <path
          d="M0 200 C110 190 220 230 320 300 C360 328 400 348 450 360 L0 360 Z"
          fill="#ffe500"
          opacity="0.5"
        />
      </svg>

      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-24">
        <Reveal>
          <span className="block h-1.5 w-9 rounded-full bg-sun" />
          <h2 className="display mt-6 text-[clamp(2.4rem,3.7vw,3.5rem)]">
            Upcoming
            <br />
            omnibus waves
          </h2>
          <p className="mt-5 max-w-[320px] text-[17.5px] leading-[1.55] text-stone">
            Join our next waves to get fast, reliable consumer insights in your
            target markets.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="surface overflow-hidden rounded-[28px]">
            <div
              className={`hidden border-b border-black/[0.06] bg-[#f3f1ea]/80 px-8 py-4 text-[13.5px] font-semibold text-stone sm:grid ${COLUMNS}`}
            >
              <span>Month</span>
              <span>Country</span>
              <span>Sample size</span>
              <span>Wave type</span>
              <span className="w-[124px]">Action</span>
            </div>

            <ul>
              {WAVES.map((wave) => (
                <li
                  key={`${wave.month}-${wave.country}`}
                  className={`group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-b border-black/[0.055] px-5 py-4 transition-colors duration-300 last:border-b-0 hover:bg-sun/[0.09] sm:px-8 sm:py-[13px] ${COLUMNS}`}
                >
                  <span className="order-3 text-[15px] font-semibold text-stone sm:order-none sm:text-[16.5px] sm:font-bold sm:text-[#141414]">
                    {wave.month}
                    <span className="sm:hidden"> · 1,000 interviews</span>
                  </span>
                  <span className="order-1 flex items-center gap-3.5 text-[17px] font-bold sm:order-none sm:text-[16.5px]">
                    <Flag code={wave.flag} size={26} />
                    {wave.country}
                  </span>
                  <span className="hidden text-[16.5px] font-bold sm:block">
                    1,000
                    <span className="ml-2 text-[12.5px] font-semibold text-stone/80">
                      nat. rep.
                    </span>
                  </span>
                  <span className="order-2 justify-self-end sm:order-none sm:justify-self-start">
                    <TypeBadge type={wave.type} />
                  </span>
                  <a
                    href="#"
                    className="btn btn-sun order-4 h-10 w-[124px] justify-self-end px-0 text-[14.5px] sm:order-none"
                  >
                    Book now
                    <ArrowRight size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href="#"
              className="group inline-flex items-center gap-3 text-[16px] font-bold text-[#141414]"
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
      </div>
    </section>
  );
}
