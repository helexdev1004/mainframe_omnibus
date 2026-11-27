import Flag, { type FlagCode } from "./Flag";
import { ChevronDown, Globe } from "./Icons";

const LANGUAGES: { label: string; flag: FlagCode }[] = [
  { label: "English", flag: "gb" },
  { label: "Français", flag: "fr" },
  { label: "Italiano", flag: "it" },
  { label: "Español", flag: "es" },
  { label: "Deutsch", flag: "de" },
  { label: "Polski", flag: "pl" },
  { label: "Türkçe", flag: "tr" },
];

/**
 * Presentational language switcher – the list opens on hover / focus,
 * but choosing a language is intentionally not wired up yet.
 */
export default function LanguagePill({
  placement = "bottom",
}: {
  placement?: "bottom" | "top";
}) {
  const panelPosition =
    placement === "bottom"
      ? "top-full pt-2 origin-top"
      : "bottom-full pb-2 origin-bottom";

  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="listbox"
        className="flex h-10 items-center gap-2 rounded-full border border-white/25 pl-3 pr-2.5 text-[14px] font-semibold text-white/90 transition-colors duration-300 hover:border-white/60 group-focus-within:border-white/60"
      >
        <Globe size={17} />
        English
        <ChevronDown
          size={15}
          className="transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
        />
      </button>

      <div
        className={`invisible absolute right-0 z-50 w-48 scale-95 opacity-0 transition-all duration-300 ease-out group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100 ${panelPosition}`}
      >
        <ul
          role="listbox"
          aria-label="Language"
          className="rounded-2xl border border-white/10 bg-[#19191b] p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]"
        >
          {LANGUAGES.map((language, index) => (
            <li
              key={language.label}
              role="option"
              aria-selected={index === 0}
              className={`flex cursor-default items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors duration-200 hover:bg-white/10 hover:text-white ${
                index === 0 ? "bg-white/[0.07] text-white" : "text-white/70"
              }`}
            >
              <Flag code={language.flag} size={20} />
              {language.label}
              {index === 0 && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sun" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
