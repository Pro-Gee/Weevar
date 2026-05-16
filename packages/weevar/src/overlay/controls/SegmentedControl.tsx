type Alignment = "left" | "center" | "right";

type SegmentedControlProps = {
  value: Alignment;
  /** Called immediately on click — commits on selection, no blur needed. */
  onCommit: (value: Alignment) => void;
};

const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="1" y="6"  width="8"  height="1.5" rx="0.75" fill="currentColor" />
    <rect x="1" y="10" width="10" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="3" y="6"  width="8"  height="1.5" rx="0.75" fill="currentColor" />
    <rect x="2" y="10" width="10" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="5" y="6"  width="8"  height="1.5" rx="0.75" fill="currentColor" />
    <rect x="3" y="10" width="10" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);

const OPTIONS: Array<{ value: Alignment; icon: React.ReactNode; label: string }> = [
  { value: "left",   icon: <AlignLeftIcon />,   label: "Align left" },
  { value: "center", icon: <AlignCenterIcon />, label: "Align center" },
  { value: "right",  icon: <AlignRightIcon />,  label: "Align right" },
];

export function SegmentedControl({ value, onCommit }: SegmentedControlProps) {
  return (
    <div className="wv-segmented wv-pe" role="group" aria-label="Text alignment">
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
