import { useId } from "react";

export type FlagCode = "fr" | "de" | "it" | "es" | "pl" | "tr" | "gb";

const FLAGS: Record<FlagCode, React.ReactNode> = {
  fr: (
    <>
      <rect width="8" height="24" fill="#1f47a8" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#e8343f" />
    </>
  ),
  de: (
    <>
      <rect width="24" height="8" fill="#141414" />
      <rect y="8" width="24" height="8" fill="#dd1f26" />
      <rect y="16" width="24" height="8" fill="#ffce00" />
    </>
  ),
  it: (
    <>
      <rect width="8" height="24" fill="#149954" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#d8323f" />
    </>
  ),
  es: (
    <>
      <rect width="24" height="24" fill="#c8102e" />
      <rect y="6" width="24" height="12" fill="#ffc400" />
      <rect x="6.2" y="9.4" width="3.4" height="5.2" rx="1" fill="#c8102e" opacity="0.85" />
    </>
  ),
  pl: (
    <>
      <rect width="24" height="12" fill="#fff" />
      <rect y="12" width="24" height="12" fill="#dc2540" />
    </>
  ),
  tr: (
    <>
      <rect width="24" height="24" fill="#e30a17" />
      <circle cx="10" cy="12" r="5.6" fill="#fff" />
      <circle cx="11.5" cy="12" r="4.5" fill="#e30a17" />
      <path
        fill="#fff"
        d="m16.6 9.3.75 1.84 1.98.15-1.52 1.28.48 1.93-1.69-1.05-1.69 1.05.48-1.93-1.52-1.28 1.98-.15z"
      />
    </>
  ),
  gb: (
    <>
      <rect width="24" height="24" fill="#1a2f77" />
      <path stroke="#fff" strokeWidth="4.4" d="M-2 -2 26 26M26 -2-2 26" />
      <path stroke="#d21f34" strokeWidth="1.7" d="M-2 -2 26 26M26 -2-2 26" />
      <path stroke="#fff" strokeWidth="7" d="M12 0v24M0 12h24" />
      <path stroke="#d21f34" strokeWidth="4" d="M12 0v24M0 12h24" />
    </>
  ),
};

export default function Flag({
  code,
  size = 24,
  className = "",
}: {
  code: FlagCode;
  size?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 rounded-full ring-1 ring-black/10 ${className}`}
    >
      <clipPath id={id}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${id})`}>{FLAGS[code]}</g>
    </svg>
  );
}
