import {
  LayoutGridIcon,
  LayoutHorizontalIcon,
  LayoutVerticalIcon,
} from "./layoutTypeIcons";

export type LayoutType = "column" | "row" | "grid";

type LayoutTypeControlProps = {
  value: LayoutType;
  onSelect: (value: LayoutType) => void;
};

const OPTIONS: Array<{ value: LayoutType; icon: React.ReactNode; label: string }> = [
  { value: "column", icon: <LayoutVerticalIcon />, label: "Vertical stack" },
  { value: "row", icon: <LayoutHorizontalIcon />, label: "Horizontal stack" },
  { value: "grid", icon: <LayoutGridIcon />, label: "Grid" },
];

export function LayoutTypeControl({ value, onSelect }: LayoutTypeControlProps) {
  return (
    <div className="wv-segmented wv-segmented--typo wv-pe" role="group" aria-label="Layout type">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className="wv-segmented-btn wv-pe"
          data-active={value === option.value ? "true" : "false"}
          aria-label={option.label}
          aria-pressed={value === option.value}
          onPointerDown={(e) => {
            e.preventDefault();
            onSelect(option.value);
          }}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
