import type { CSSProperties } from "react";

type Option = { value: string; label: string };

type SelectControlProps = {
  value: string;
  options: Option[];
  /** Called immediately on selection — select commits on change, no separate blur needed. */
  onCommit: (value: string) => void;
  style?: CSSProperties;
};

export function SelectControl({ value, options, onCommit, style }: SelectControlProps) {
  return (
    <select
      className="wv-select wv-pe"
      value={value}
      style={style}
      onChange={(e) => onCommit(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
