import Flag, { type FlagCode } from "./Flag";
import { ArrowRight, People, Rosette } from "./Icons";
import Reveal from "./Reveal";

type Wave = {
  month: string;
  year: string;
  country: string;
  flag: FlagCode;
  type: "Free" | "Standard";
};

// In date order; the first one is presented as the next wave.
const WAVES: Wave[] = [
  { month: "Dec", year: "2026", country: "France", flag: "fr", type: "Free" },
  { month: "Jan", year: "2027", country: "Germany", flag: "de", type: "Standard" },
  { month: "Jan", year: "2027", country: "Italy", flag: "it", type: "Free" },
  { month: "Feb", year: "2027", country: "Spain", flag: "es", type: "Standard" },
  { month: "Feb", year: "2027", country: "Poland", flag: "pl", type: "Free" },
];

/** One wave as a ticket: date stub, perforation, then what you are booking. */
function Ticket({ wave, next }: { wave: Wave; next: boolean }) {
  return (
    <article className="wave-ticket" data-featured={next || undefined}>
      <div className="wave-ticket-face">
        <header className="wave-stub">
          <p>
            <span className="wave-month block">{wave.month}</span>
            <span className="wave-year block">{wave.year}</span>
          </p>
          <span className="wave-type" data-type={wave.type}>
            {wave.type}
          </span>
        </header>

        <div className="wave-body">
          <p className="wave-label">{next ? "Next wave" : "Omnibus wave"}</p>

          <div className="mt-5 flex items-center gap-4">
            <span className="wave-coin">
              <Flag code={wave.flag} size={54} />
            </span>
            <h3 className="text-[22px] font-bold leading-none tracking-[-0.015em]">
              {wave.country}
            </h3>
          </div>

          <ul className="wave-facts mt-6">
            <li>
              <People size={17} strokeWidth={1.9} />
              1,000 interviews
            </li>
            <li>
              <Rosette size={17} strokeWidth={1.9} />
              Nationally representative
            </li>
          </ul>

          <a
            href="#"
            aria-label={`Book the ${wave.month} ${wave.year} wave in ${wave.country}`}
            className="btn btn-sun mt-7 h-11 w-full text-[15px]"
          >
            Book now
            <ArrowRight size={17} />
          </a>
        </div>
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

      <div className="relative mx-auto max-w-[1320px] px-5 pb-10 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pb-8 lg:pt-24">
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

        {/* the padding gives the tickets' shadows and hover lift room inside the scroller */}
        <ul className="waves-row -mx-5 mt-8 px-5 pb-12 pt-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:mt-10 lg:px-10 min-[1180px]:mx-0 min-[1180px]:px-0 min-[1180px]:pb-8 min-[1180px]:pl-2">
          {WAVES.map((wave, index) => (
            <li key={`${wave.month}-${wave.country}`}>
              <Reveal delay={0.07 * index} className="h-full">
                <Ticket wave={wave} next={index === 0} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
