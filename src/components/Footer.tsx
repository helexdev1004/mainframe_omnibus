import Image from "next/image";
import LanguagePill from "./LanguagePill";

const LINKS = [
  { label: "Omnibus Waves", href: "#waves" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Markets", href: "#markets" },
  { label: "About", href: "#about" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 py-10 lg:flex-row lg:items-center lg:gap-0 lg:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <a href="#top" aria-label="mainframe — back to top" className="shrink-0">
              <Image
                src="/brand/mainframe-logo.png"
                alt="mainframe"
                width={1320}
                height={219}
                className="h-[30px] w-auto"
              />
            </a>
            <span className="hidden h-9 w-px bg-white/15 sm:mx-7 sm:block" />
            <p className="max-w-[230px] text-[14px] font-medium leading-[1.45] text-white/75">
              The omnibus platform for consumer insights across markets.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-9 gap-y-3 lg:ml-auto">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14.5px] font-semibold text-white/85 transition-colors duration-300 hover:text-sun"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lg:ml-12">
            <LanguagePill placement="top" />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/[0.08] py-6 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 mainframe. All rights reserved.</p>
          <p className="flex gap-6">
            <a href="#" className="transition-colors hover:text-white/80">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white/80">
              Terms
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
