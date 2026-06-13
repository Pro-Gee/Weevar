import { TrayDropdown } from "./TrayDropdown";

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
  return (
    <TrayDropdown
      label={label}
      value={value}
      options={options}
      ariaLabel={ariaLabel ?? label}
      onOpen={onFocus}
      onSelect={onCommit}
    />
  );
}
