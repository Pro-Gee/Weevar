import { NumberInput } from "./NumberInput";

type LayoutColumnsControlProps = {
  value: number;
  onChange: (formatted: string) => void;
  onCommit: (formatted: string) => void;
  onFocus: () => void;
  onCancel: () => void;
};

export function LayoutColumnsControl({
  value,
  onChange,
  onCommit,
  onFocus,
  onCancel,
}: LayoutColumnsControlProps) {
  return (
    <div className="wv-typo-card wv-layout-columns-card">
      <span className="wv-typo-card-label">Columns</span>
      <NumberInput
        cssProperty="grid-template-columns"
        displayLabel="Columns"
        value={value}
        unit=""
        min={1}
        max={24}
        variant="card"
        onChange={onChange}
        onCommit={onCommit}
        onFocus={onFocus}
        onCancel={onCancel}
      />
    </div>
  );
}
