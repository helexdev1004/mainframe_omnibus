type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, strokeWidth = 1.9, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Icon>
);

export const Globe = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z" />
  </Icon>
);

export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7.5h16M4 12h16M4 16.5h16" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const People = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.2" r="3" />
    <path d="M6.5 20v-.8a5.5 5.5 0 0 1 11 0V20" />
    <circle cx="4.6" cy="10.6" r="2" />
    <circle cx="19.4" cy="10.6" r="2" />
    <path d="M1.5 18.6v-.3a3.3 3.3 0 0 1 3.3-3.3M22.5 18.6v-.3a3.3 3.3 0 0 0-3.3-3.3" />
  </Icon>
);

export const Rosette = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="9" r="5.6" />
    <circle cx="12" cy="9" r="2.1" />
    <path d="M8.6 13.6 7 21l5-2.6 5 2.6-1.6-7.4" />
  </Icon>
);

export const Pencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20l1.1-4.3L16.6 4.2a2.05 2.05 0 0 1 2.9 0l.3.3a2.05 2.05 0 0 1 0 2.9L8.3 18.9 4 20z" />
    <path d="m14.6 6.2 3.2 3.2" />
  </Icon>
);

export const Bars = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 20v-5.5M12 20V9.5M19 20V4" />
    <path d="M3.5 9.5C7 9 10 7 12 3.5" opacity="0.55" />
  </Icon>
);

export const Bolt = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.2 2.5 5 13.6h6l-1 7.9 8.2-11.1h-6l1-7.9z" />
  </Icon>
);

export const Layers = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5z" />
    <path d="m3.5 12.2 8.5 4.5 8.5-4.5M3.5 16.2l8.5 4.5 8.5-4.5" />
  </Icon>
);

export const ShieldCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 4.8 5.9v5.7c0 4.5 3 8 7.2 9.4 4.2-1.4 7.2-4.9 7.2-9.4V5.9L12 3z" />
    <path d="m8.9 12 2.2 2.2 4.1-4.5" />
  </Icon>
);

export const DragArrows = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 8 3.5 12l4 4M16.5 8l4 4-4 4M3.5 12h17" />
  </Icon>
);
