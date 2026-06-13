import {
  TypoAlignCenterIcon,
  TypoAlignLeftIcon,
  TypoAlignRightIcon,
} from "./typographyIcons";

type Alignment = "left" | "center" | "right";

type SegmentedControlProps = {
  value: Alignment;
  /** Called immediately on click — commits on selection, no blur needed. */
  onCommit: (value: Alignment) => void;
  /** Card styling for typography alignment row (Figma tray). */
  variant?: "default" | "card";
};

const OPTIONS: Array<{ value: Alignment; icon: React.ReactNode; label: string }> = [
  { value: "left", icon: <TypoAlignLeftIcon />, label: "Align left" },
  { value: "center", icon: <TypoAlignCenterIcon />, label: "Align center" },
  { value: "right", icon: <TypoAlignRightIcon />, label: "Align right" },
];

export function SegmentedControl({ value, onCommit, variant = "default" }: SegmentedControlProps) {
  const rootClass =
    variant === "card" ? "wv-segmented wv-segmented--typo wv-pe" : "wv-segmented wv-pe";

  return (
    <div className={rootClass} role="group" aria-label="Text alignment">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className="wv-segmented-btn wv-pe"
          data-active={value === o.value ? "true" : "false"}
          aria-label={o.label}
          aria-pressed={value === o.value}
          onClick={() => onCommit(o.value)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}
