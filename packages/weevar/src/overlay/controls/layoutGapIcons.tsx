import type { ReactNode } from "react";

type IconProps = { className?: string };

function LayoutGapIcon({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={`wv-typo-field-icon${className ? ` ${className}` : ""}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function LayoutHorizontalGapIcon(props: IconProps) {
  return (
    <LayoutGapIcon {...props}>
      <path
        d="M14 14L12.0541 14C11.3376 14 10.7568 13.4112 10.7568 12.6849L10.7568 3.31507C10.7568 2.58878 11.3376 2 12.0541 2L14 2M2 14L3.94595 14C4.66242 14 5.24324 13.4112 5.24324 12.6849L5.24324 3.31507C5.24324 2.58878 4.66242 2 3.94595 2L2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </LayoutGapIcon>
  );
}

export function LayoutVerticalGapIcon(props: IconProps) {
  return (
    <LayoutGapIcon {...props}>
      <path
        d="M2 14L2 12.0541C2 11.3376 2.58878 10.7568 3.31507 10.7568L12.6849 10.7568C13.4112 10.7568 14 11.3376 14 12.0541V14M2 2L2 3.94595C2 4.66242 2.58878 5.24324 3.31507 5.24324L12.6849 5.24324C13.4112 5.24324 14 4.66242 14 3.94595V2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </LayoutGapIcon>
  );
}
