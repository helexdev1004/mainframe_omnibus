import { ArrowRight } from "./Icons";
import Reveal from "./Reveal";

export default function CallToAction() {
  return (
    <section id="cta" className="relative bg-paper">
      <div className="relative isolate overflow-hidden rounded-t-[36px] bg-sun sm:rounded-t-[44px]">
        {/* layered light, echoing the hero ribbons */}
        <svg
          aria-hidden
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        >
          <defs>
            <linearGradient id="cta-base" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0" stopColor="#fff6a6" />
              <stop offset="0.55" stopColor="#ffec3d" />
              <stop offset="1" stopColor="#ffe500" />
            </linearGradient>
            <linearGradient id="cta-light" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fffde8" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff38c" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cta-deep" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#ffd500" stopOpacity="0" />
              <stop offset="1" stopColor="#f5c800" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <rect width="1440" height="320" fill="url(#cta-base)" />
          <path
            d="M-60 0 H760 C640 90 470 150 250 190 C140 210 20 250 -60 320 Z"
            fill="url(#cta-light)"
          />
          <path
            d="M620 320 C820 250 1010 150 1180 70 C1290 20 1390 0 1500 0 V320 Z"
            fill="url(#cta-deep)"
          />
          <path
            d="M560 340 C780 262 990 156 1170 76 C1290 24 1400 6 1500 4"
            fill="none"
            stroke="#fffbe0"
            strokeOpacity="0.8"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:px-10 lg:py-[76px]">
          <Reveal>
            <h2 className="display text-[clamp(2.4rem,4vw,3.75rem)] text-[#111]">
              Ready to run your research?
            </h2>
            <p className="mt-4 max-w-[520px] text-[18.5px] leading-[1.5] text-[#2b2700]">
              Book a meeting with our team or request access to start using
              mainframe.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="flex flex-wrap gap-4 lg:gap-6">
            <a href="#" className="btn btn-ink h-[58px] px-8 text-[16.5px]">
              Book a meeting
              <ArrowRight size={18} />
            </a>
            <a href="#" className="btn btn-outline-ink h-[58px] px-8 text-[16.5px]">
              Request access
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
