import { Bolt, Layers, ShieldCheck } from "./Icons";
import Reveal from "./Reveal";

const REASONS = [
  {
    icon: Bolt,
    title: "Fast and flexible",
    body: "Get consumer insights on a clearly defined omnibus schedule.",
  },
  {
    icon: Layers,
    title: "Consistent and comparable",
    body: "Use the same questions across markets to track real differences.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable and representative",
    body: "1,000 interviews per market, with nationally representative samples.",
  },
];

export default function WhyMainframe() {
  return (
    <section id="about" className="relative bg-paper">
      <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-20 sm:px-8 lg:px-10 lg:pb-24 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.6fr)] lg:gap-14">
          <Reveal>
            <p className="eyebrow text-[#141414]">Why teams choose mainframe</p>
            <h2 className="display mt-5 text-[clamp(2.1rem,3.1vw,2.85rem)] leading-[1.06]">
              A trusted partner for consumer research across Europe.
            </h2>
          </Reveal>

          <ul className="grid gap-9 sm:grid-cols-3 sm:gap-8 lg:border-l lg:border-black/10 lg:pl-12">
            {REASONS.map((reason, index) => (
              <li key={reason.title}>
                <Reveal delay={0.1 + index * 0.1}>
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff7b3] to-sun-soft text-[#141414] shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]">
                    <reason.icon size={26} strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 text-[18.5px] font-bold tracking-[-0.01em]">
                    {reason.title}
                  </h3>
                  <p className="mt-2 max-w-[250px] text-[16px] leading-[1.5] text-stone">
                    {reason.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <Reveal delay={0.1} className="mt-14 lg:mt-16">
          <figure className="surface relative grid items-center gap-8 overflow-hidden rounded-[28px] px-7 py-9 sm:px-10 md:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)] md:gap-10 lg:px-14 lg:py-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-sun/20 blur-3xl"
            />
            <blockquote className="relative flex gap-6">
              <span
                aria-hidden
                className="display -mt-1 select-none text-[84px] leading-[0.8] text-sun"
              >
                “
              </span>
              <p className="font-serif text-[clamp(1.2rem,1.75vw,1.5rem)] italic leading-[1.4] tracking-[-0.01em] text-[#1c1c1a]">
                “Mainframe makes it easy to run high-quality, comparable
                research across multiple markets. It’s fast, reliable and a
                great fit for our team.”
              </p>
            </blockquote>

            <span className="hidden h-20 w-px bg-black/10 md:block" />

            <figcaption className="flex items-center gap-5">
              <span className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[#141414] text-[21px] font-bold tracking-wide text-sun ring-4 ring-sun/40">
                CD
              </span>
              <span className="text-[15px] leading-[1.45] text-stone">
                <strong className="block text-[17px] font-bold text-[#141414]">
                  Clara Dubois
                </strong>
                Consumer Insights Lead
                <br />
                European FMCG Brand
              </span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
