import type { ReactNode } from "react";

type IconProps = { className?: string };

function BoxSpacingIcon({
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

export function MarginHorizontalIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_h_clip)">
        <path
          d="M2.66675 2.6665V13.3332"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 2.6665V13.3332"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 5.33333C6 4.97971 6.14048 4.64057 6.39052 4.39052C6.64057 4.14048 6.97971 4 7.33333 4H8.66667C9.02029 4 9.35943 4.14048 9.60948 4.39052C9.85952 4.64057 10 4.97971 10 5.33333V10.6667C10 11.0203 9.85952 11.3594 9.60948 11.6095C9.35943 11.8595 9.02029 12 8.66667 12H7.33333C6.97971 12 6.64057 11.8595 6.39052 11.6095C6.14048 11.3594 6 11.0203 6 10.6667V5.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_h_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function MarginVerticalIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_v_clip)">
        <path
          d="M2.66663 2.6665H13.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.66663 13.3335H13.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7.33333C4 6.97971 4.14048 6.64057 4.39052 6.39052C4.64057 6.14048 4.97971 6 5.33333 6H10.6667C11.0203 6 11.3594 6.14048 11.6095 6.39052C11.8595 6.64057 12 6.97971 12 7.33333V8.66667C12 9.02029 11.8595 9.35943 11.6095 9.60948C11.3594 9.85952 11.0203 10 10.6667 10H5.33333C4.97971 10 4.64057 9.85952 4.39052 9.60948C4.14048 9.35943 4 9.02029 4 8.66667V7.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_v_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function PaddingHorizontalIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_padding_h_clip)">
        <path
          d="M2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H12.5C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72064 14 3.10218 14 3.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V3.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 10V6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 6V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="wv_padding_h_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function PaddingVerticalIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <path
        d="M12.5 2C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72065 14 3.10218 14 3.5L14 12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14L3.5 14C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5L2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72065 2.15804 3.10218 2 3.5 2L12.5 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 11L10 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 5L6 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </BoxSpacingIcon>
  );
}

export function BoxSidesToggleIcon(props: IconProps) {
  return (
    <svg
      className={`wv-box-spacing-toggle-icon${props.className ? ` ${props.className}` : ""}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <g clipPath="url(#wv_box_sides_toggle_clip)">
        <path
          d="M2.66666 5.3335V10.6668"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3333 10.6668V5.3335"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.33334 2.6665H10.6667"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.33334 13.3335H10.6667"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_box_sides_toggle_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function MarginLeftIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_l_clip)">
        <path
          d="M2.66669 2.6665V13.3332"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 5.33333C6 4.97971 6.14048 4.64057 6.39052 4.39052C6.64057 4.14048 6.97971 4 7.33333 4H8.66667C9.02029 4 9.35943 4.14048 9.60948 4.39052C9.85952 4.64057 10 4.97971 10 5.33333V10.6667C10 11.0203 9.85952 11.3594 9.60948 11.6095C9.35943 11.8595 9.02029 12 8.66667 12H7.33333C6.97971 12 6.64057 11.8595 6.39052 11.6095C6.14048 11.3594 6 11.0203 6 10.6667V5.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_l_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function MarginTopIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_t_clip)">
        <path
          d="M2.66666 2.6665H13.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7.33333C4 6.97971 4.14048 6.64057 4.39052 6.39052C4.64057 6.14048 4.97971 6 5.33333 6H10.6667C11.0203 6 11.3594 6.14048 11.6095 6.39052C11.8595 6.64057 12 6.97971 12 7.33333V8.66667C12 9.02029 11.8595 9.35943 11.6095 9.60948C11.3594 9.85952 11.0203 10 10.6667 10H5.33333C4.97971 10 4.64057 9.85952 4.39052 9.60948C4.14048 9.35943 4 9.02029 4 8.66667V7.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_t_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function MarginRightIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_r_clip)">
        <path
          d="M13.3333 2.6665V13.3332"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 5.33333C6 4.97971 6.14048 4.64057 6.39052 4.39052C6.64057 4.14048 6.97971 4 7.33333 4H8.66667C9.02029 4 9.35943 4.14048 9.60948 4.39052C9.85952 4.64057 10 4.97971 10 5.33333V10.6667C10 11.0203 9.85952 11.3594 9.60948 11.6095C9.35943 11.8595 9.02029 12 8.66667 12H7.33333C6.97971 12 6.64057 11.8595 6.39052 11.6095C6.14048 11.3594 6 11.0203 6 10.6667V5.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_r_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function MarginBottomIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_margin_b_clip)">
        <path
          d="M2.66666 13.3335H13.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 7.33333C4 6.97971 4.14048 6.64057 4.39052 6.39052C4.64057 6.14048 4.97971 6 5.33333 6H10.6667C11.0203 6 11.3594 6.14048 11.6095 6.39052C11.8595 6.64057 12 6.97971 12 7.33333V8.66667C12 9.02029 11.8595 9.35943 11.6095 9.60948C11.3594 9.85952 11.0203 10 10.6667 10H5.33333C4.97971 10 4.64057 9.85952 4.39052 9.60948C4.14048 9.35943 4 9.02029 4 8.66667V7.33333Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_margin_b_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function PaddingLeftIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_padding_l_clip)">
        <path
          d="M2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H12.5C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72064 14 3.10218 14 3.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V3.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 6V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="wv_padding_l_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function PaddingTopIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <path
        d="M12.5 2C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72065 14 3.10218 14 3.5L14 12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14L3.5 14C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5L2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72065 2.15804 3.10218 2 3.5 2L12.5 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 5L6 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </BoxSpacingIcon>
  );
}

export function PaddingRightIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_padding_r_clip)">
        <path
          d="M2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H12.5C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72064 14 3.10218 14 3.5V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V3.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 10V6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <defs>
        <clipPath id="wv_padding_r_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function PaddingBottomIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <path
        d="M12.5 2C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72065 14 3.10218 14 3.5L14 12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14L3.5 14C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5L2 3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72065 2.15804 3.10218 2 3.5 2L12.5 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 11L10 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </BoxSpacingIcon>
  );
}

export function BorderTypeIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_border_type_clip)">
        <path
          d="M2 13.3332C7.33333 13.3332 8.66667 2.6665 14 2.6665"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_border_type_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function RadiusAllCornersIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_radius_all_clip)">
        <path
          d="M11 2H12.5C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72064 14 3.10218 14 3.5V5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 11V12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14H11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 14H3.5C3.10218 14 2.72064 13.842 2.43934 13.5607C2.15804 13.2794 2 12.8978 2 12.5V11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 5V3.5C2 3.10218 2.15804 2.72064 2.43934 2.43934C2.72064 2.15804 3.10218 2 3.5 2H5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_radius_all_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function RadiusTopLeftIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_radius_tl_clip)">
        <path
          d="M3 13V8C3 6.67392 3.52678 5.40215 4.46447 4.46447C5.40215 3.52678 6.67392 3 8 3H13"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_radius_tl_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function RadiusTopRightIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <path
        d="M3 3L8 3C9.32608 3 10.5979 3.52678 11.5355 4.46447C12.4732 5.40215 13 6.67392 13 8L13 13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BoxSpacingIcon>
  );
}

export function RadiusBottomLeftIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_radius_bl_clip)">
        <path
          d="M3 3V8C3 9.32608 3.52678 10.5979 4.46447 11.5355C5.40215 12.4732 6.67392 13 8 13H13"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_radius_bl_clip">
          <rect width="16" height="16" fill="white" transform="matrix(1 0 0 -1 0 16)" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function RadiusBottomRightIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_radius_br_clip)">
        <path
          d="M13 3L13 8C13 9.32608 12.4732 10.5979 11.5355 11.5355C10.5979 12.4732 9.32608 13 8 13L3 13"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_radius_br_clip">
          <rect width="16" height="16" fill="white" transform="translate(16 16) rotate(180)" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}

export function AspectRatioLockIcon(props: IconProps) {
  return (
    <BoxSpacingIcon {...props}>
      <g clipPath="url(#wv_aspect_ratio_clip)">
        <path
          d="M2 3.73311C2 3.27618 2.14048 2.83797 2.39052 2.51487C2.64057 2.19177 2.97971 2.01025 3.33333 2.01025H12.6667C13.0203 2.01025 13.3594 2.19177 13.6095 2.51487C13.8595 2.83797 14 3.27618 14 3.73311V12.3474C14 12.8043 13.8595 13.2425 13.6095 13.5656C13.3594 13.8887 13.0203 14.0703 12.6667 14.0703H3.33333C2.97971 14.0703 2.64057 13.8887 2.39052 13.5656C2.14048 13.2425 2 12.8043 2 12.3474V3.73311Z"
          stroke="currentColor"
          strokeWidth="1.005"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.66675 6.6665V4.6665H6.66675"
          stroke="currentColor"
          strokeWidth="1.005"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.3334 9.3335V11.3335H9.33337"
          stroke="currentColor"
          strokeWidth="1.005"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_aspect_ratio_clip">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </BoxSpacingIcon>
  );
}
