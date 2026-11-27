import GlobeCanvas from "./globe/GlobeCanvas";
import HeroWaves from "./HeroWaves";
import { ArrowRight, DragArrows, People, Rosette } from "./Icons";

const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as React.CSSProperties;

export default function Hero() {
  return (
    <section
      id="top"
      className="hero-bg relative isolate overflow-hidden text-white lg:h-[clamp(760px,100svh,980px)]"
    >
      {/* Copy */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <div className="pointer-events-auto max-w-[660px] pt-[132px] lg:pt-[clamp(150px,19svh,196px)]">
          <a
            href="#waves"
            className="fade-up group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-3.5 pr-3 text-[13px] font-semibold text-white/85 transition-colors duration-300 hover:border-sun/60 hover:text-white"
            style={delay(0.1)}
          >
            <span className="pulse-dot" />
            Next wave · France · December 2026
            <ArrowRight
              size={14}
              className="text-sun transition-transform duration-500 group-hover:translate-x-1"
            />
          </a>

          <h1 className="display mt-7 text-[clamp(2.85rem,4.9vw,4.9rem)] lg:whitespace-nowrap">
            <span className="line-mask" style={delay(0.15)}>
              <span style={delay(0.15)}>You write the</span>
            </span>
            <span className="line-mask">
              <span style={delay(0.27)}>questions,</span>
            </span>
            <span className="line-mask">
              <span style={delay(0.39)}>
                <em className="text-sun">we do the fieldwork.</em>
              </span>
            </span>
          </h1>

          <p
            className="fade-up mt-7 max-w-[450px] text-[18px] leading-[1.5] text-white/80 sm:text-[19.5px]"
            style={delay(0.6)}
          >
            Gain valuable consumer insights across multiple markets through our
            omnibus platform.
          </p>

          <div className="fade-up mt-9 flex flex-wrap items-center gap-4" style={delay(0.72)}>
            <a href="#waves" className="btn btn-sun h-[54px] px-7 text-[16px]">
              Explore waves
              <ArrowRight size={18} />
            </a>
            <a href="#cta" className="btn btn-ghost h-[54px] px-7 text-[16px]">
              Book a meeting
            </a>
          </div>

          <dl
            className="fade-up mt-12 flex flex-wrap items-center gap-x-9 gap-y-5"
            style={delay(0.86)}
          >
            <div className="flex items-center gap-4">
              <People size={34} strokeWidth={1.6} className="text-sun" />
              <div className="text-[16px] font-semibold leading-[1.3]">
                <dt className="inline">1,000 interviews</dt>
                <dd className="block text-white/85">per market</dd>
              </div>
            </div>
            <span className="hidden h-11 w-px bg-white/15 sm:block" />
            <div className="flex items-center gap-4">
              <Rosette size={34} strokeWidth={1.6} className="text-sun" />
              <div className="text-[16px] font-semibold leading-[1.3]">
                <dt className="inline">Nationally</dt>
                <dd className="block text-white/85">representative</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {/* Globe: in flow on small screens, pinned right on desktop */}
      <div className="relative mt-8 h-[min(86vw,540px)] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
        <GlobeCanvas className="absolute left-1/2 top-1/2 aspect-square w-[min(128vw,800px)] -translate-x-1/2 -translate-y-[52%] lg:left-[73%] lg:top-[51%] lg:w-[clamp(650px,62vw,980px)] lg:-translate-y-1/2" />
      </div>

      <p
        className="fade-up pointer-events-none absolute right-10 top-[112px] z-10 hidden items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-white/40 lg:flex"
        style={delay(3.4)}
      >
        <DragArrows size={16} />
        Drag the globe to explore
      </p>

      <HeroWaves />

      {/* room for the next section's rounded top to slide over */}
      <div className="h-24 lg:hidden" />
    </section>
  );
}
