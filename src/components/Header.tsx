"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Close, Menu } from "./Icons";
import LanguagePill from "./LanguagePill";

const NAV = [
  { label: "Omnibus Waves", href: "#waves" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Markets", href: "#markets" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        solid
          ? "header-solid border-b border-white/[0.07]"
          : "border-b border-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1320px] items-center px-5 transition-[height] duration-500 sm:px-8 lg:px-10 ${
          scrolled ? "h-[68px]" : "h-[84px]"
        }`}
      >
        <a href="#top" aria-label="mainframe — home" className="shrink-0">
          <Image
            src="/brand/mainframe-logo.png"
            alt="mainframe"
            width={1320}
            height={219}
            priority
            className="h-[22px] w-auto sm:h-[30px]"
          />
        </a>

        <span className="mx-7 hidden h-7 w-px bg-white/15 lg:block" />

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative py-2 text-[15px] font-semibold text-white/85 transition-colors duration-300 hover:text-white"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-sun transition-transform duration-500 ease-out group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:block">
            <LanguagePill />
          </div>
          <a
            href="#"
            className="hidden text-[15px] font-semibold text-white/90 transition-colors duration-300 hover:text-sun md:block"
          >
            Log in
          </a>
          <a href="#cta" className="btn btn-sun h-9 px-4 text-[13.5px] max-[359px]:hidden sm:h-10 sm:px-5 sm:text-[14.5px]">
            Book a meeting
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
          >
            {open ? <Close size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-out lg:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <nav className="flex flex-col gap-1 px-5 pb-6 pt-1 sm:px-8">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="display border-b border-white/[0.08] py-3.5 text-[26px] text-white"
              >
                {item.label}
              </a>
            ))}
            <a href="#" className="pt-4 text-[15px] font-semibold text-white/80">
              Log in
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
