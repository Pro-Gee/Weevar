import type { ReactNode } from "react";

type IconProps = { className?: string };

function AlignmentIcon({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={`wv-alignment-icon${className ? ` ${className}` : ""}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function AlignTopLeftIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <mask id="wv_align_tl_mask" fill="white">
        <path d="M1.66992 2H10.6699V11H1.66992V2Z" />
      </mask>
      <path
        d="M1.66992 2V1H0.669922V2H1.66992ZM1.66992 2V3H10.6699V2V1H1.66992V2ZM1.66992 11H2.66992V2H1.66992H0.669922V11H1.66992Z"
        fill="currentColor"
        mask="url(#wv_align_tl_mask)"
      />
    </AlignmentIcon>
  );
}

export function AlignTopCenterIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <path d="M11 1.66992L1 1.66992" stroke="currentColor" />
      <path d="M6.00977 10L6.00977 2" stroke="currentColor" />
    </AlignmentIcon>
  );
}

export function AlignTopRightIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <mask id="wv_align_tr_mask" fill="white">
        <path d="M10.3301 2H1.33008V11H10.3301V2Z" />
      </mask>
      <path
        d="M10.3301 2V1H11.3301V2H10.3301ZM10.3301 2V3H1.33008V2V1H10.3301V2ZM10.3301 11H9.33008V2H10.3301H11.3301V11H10.3301Z"
        fill="currentColor"
        mask="url(#wv_align_tr_mask)"
      />
    </AlignmentIcon>
  );
}

export function AlignCenterLeftIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <path d="M1.66992 1L1.66992 11" stroke="currentColor" />
      <path d="M9.66992 6L1.66992 6" stroke="currentColor" />
    </AlignmentIcon>
  );
}

export function AlignCenterCenterIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <path d="M6.00977 1L6.00977 11" stroke="currentColor" />
      <path d="M10.0098 6L2.00977 6" stroke="currentColor" />
    </AlignmentIcon>
  );
}

export function AlignCenterRightIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <path d="M10.3301 1L10.3301 11" stroke="currentColor" />
      <path d="M2.34961 6L10.3496 6" stroke="currentColor" />
    </AlignmentIcon>
  );
}

export function AlignBottomLeftIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <mask id="wv_align_bl_mask" fill="white">
        <path d="M1.66992 10H10.6699V1H1.66992V10Z" />
      </mask>
      <path
        d="M1.66992 10V11H0.669922V10H1.66992ZM1.66992 10V9H10.6699V10V11H1.66992V10ZM1.66992 1H2.66992V10H1.66992H0.669922V1H1.66992Z"
        fill="currentColor"
        mask="url(#wv_align_bl_mask)"
      />
    </AlignmentIcon>
  );
}

export function AlignBottomCenterIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <path d="M11 10.3301L1 10.3301" stroke="currentColor" />
      <path d="M6.00977 2L6.00977 10" stroke="currentColor" />
    </AlignmentIcon>
  );
}

export function AlignBottomRightIcon(props: IconProps) {
  return (
    <AlignmentIcon {...props}>
      <mask id="wv_align_br_mask" fill="white">
        <path d="M10.3301 10H1.33008V1H10.3301V10Z" />
      </mask>
      <path
        d="M10.3301 10V11H11.3301V10H10.3301ZM10.3301 10V9H1.33008V10V11H10.3301V10ZM10.3301 1H9.33008V10H10.3301H11.3301V1H10.3301Z"
        fill="currentColor"
        mask="url(#wv_align_br_mask)"
      />
    </AlignmentIcon>
  );
}

export const ALIGNMENT_GRID_ICONS = [
  AlignTopLeftIcon,
  AlignTopCenterIcon,
  AlignTopRightIcon,
  AlignCenterLeftIcon,
  AlignCenterCenterIcon,
  AlignCenterRightIcon,
  AlignBottomLeftIcon,
  AlignBottomCenterIcon,
  AlignBottomRightIcon,
] as const;

export function AlignCellDot() {
  return <span className="wv-alignment-dot" aria-hidden />;
}
