import { TypoChevronIcon } from "./typographyIcons";

type Option = { value: string; label: string };

type CardSelectControlProps = {
  label: string;
  value: string;
  options: Option[];
  ariaLabel?: string;
  onFocus?: () => void;
  onCommit: (value: string) => void;
};

export function CardSelectControl({
  label,
  value,
  options,
  ariaLabel,
  onFocus,
  onCommit,
}: CardSelectControlProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <label className="wv-typo-card wv-card-select wv-pe">
      <span className="wv-typo-card-label">{label}</span>
      <span className="wv-card-select-trailing">
        <span className="wv-card-select-value">{selected?.label ?? value}</span>
        <TypoChevronIcon />
      </span>
      <select
        className="wv-card-select-native wv-pe"
        aria-label={ariaLabel ?? label}
        value={value}
        onPointerDown={() => onFocus?.()}
        onChange={(e) => onCommit(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
