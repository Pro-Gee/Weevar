type DimensionLabelSelectProps = {
  label: "W" | "H";
  ariaLabel: string;
  onFocus?: () => void;
  onSelect: (mode: "fill" | "hug") => void;
};

const OPTIONS = [
  { value: "fill", label: "Fill container" },
  { value: "hug", label: "Hug content" },
] as const;

export function DimensionLabelSelect({
  label,
  ariaLabel,
  onFocus,
  onSelect,
}: DimensionLabelSelectProps) {
  return (
    <label className="wv-dimension-label-select wv-pe">
      <span className="wv-typo-card-label">{label}</span>
      <select
        className="wv-dimension-label-native wv-pe"
        aria-label={ariaLabel}
        defaultValue=""
        onPointerDown={() => onFocus?.()}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "fill" || value === "hug") {
            onSelect(value);
          }
          e.target.value = "";
        }}
      >
        <option value="" disabled hidden>
          Sizing
        </option>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
