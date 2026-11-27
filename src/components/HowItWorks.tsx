import { Bars, Pencil, People } from "./Icons";
import Reveal from "./Reveal";

const STEPS = [
  {
    icon: Pencil,
    title: "Write your questions",
    body: "Tell us what you want to learn from consumers.",
  },
  {
    icon: People,
    title: "We do the fieldwork",
    body: "We run your questions in our omnibus, with 1,000 interviews per market.",
  },
  {
    icon: Bars,
    title: "Get actionable insights",
    body: "Receive reliable, nationally representative results, fast.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-gradient-to-b from-cream to-paper"
    >
      <div className="mx-auto max-w-[1320px] px-5 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-28 lg:pt-8">
        <Reveal>
          <p className="eyebrow text-[#141414]">How it works</p>
          <h2 className="display mt-5 text-[clamp(2.2rem,3.6vw,3.3rem)]">
            From question to insight, in a few simple steps.
          </h2>
        </Reveal>

        <div className="relative mt-12">
          {/* dotted thread tying the three steps together */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-[8%] right-[8%] top-[58px] hidden border-t-2 border-dotted border-black/15 md:block"
          />
          <ol className="relative grid gap-5 md:grid-cols-3 lg:gap-7">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <Reveal delay={0.1 + index * 0.12} className="h-full">
                <article className="surface lift flex h-full gap-5 rounded-[24px] p-6 lg:p-7">
                  <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff7b3] to-sun-soft text-[#141414] shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]">
                    <step.icon size={30} strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="text-[19px] font-bold leading-tight tracking-[-0.01em]">
                      <span className="text-[#141414]/45">{index + 1}.</span>{" "}
                      {step.title}
                    </h3>
                    <p className="mt-2.5 text-[16px] leading-[1.5] text-stone">
                      {step.body}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
