import type { ReactNode } from "react";
import { NumberInput } from "./NumberInput";
import { LayoutHorizontalGapIcon, LayoutVerticalGapIcon } from "./layoutGapIcons";

type GapFieldProps = {
  icon: ReactNode;
  cssProperty: string;
  displayLabel: string;
  value: number;
  onChange: (formatted: string) => void;
  onCommit: (formatted: string) => void;
  onFocus: () => void;
  onCancel: () => void;
};

function GapField({
  icon,
  cssProperty,
  displayLabel,
  value,
  onChange,
  onCommit,
  onFocus,
  onCancel,
}: GapFieldProps) {
  return (
    <div className="wv-typo-icon-card wv-layout-gap-card">
      {icon}
      <NumberInput
        cssProperty={cssProperty}
        displayLabel={displayLabel}
        value={value}
        unit="px"
        min={0}
        variant="card"
        onChange={onChange}
        onCommit={onCommit}
        onFocus={onFocus}
        onCancel={onCancel}
      />
    </div>
  );
}

type LayoutGapControlProps = {
  mode: "flex" | "grid";
  /** Main-axis direction when mode is flex — drives the single gap icon. */
  flexDirection?: "row" | "column";
  gap: number;
  rowGap: number;
  colGap: number;
  onGapChange: (formatted: string) => void;
  onGapCommit: (formatted: string) => void;
  onGapFocus: () => void;
  onGapCancel: () => void;
  onRowGapChange: (formatted: string) => void;
  onRowGapCommit: (formatted: string) => void;
  onRowGapFocus: () => void;
  onRowGapCancel: () => void;
  onColGapChange: (formatted: string) => void;
  onColGapCommit: (formatted: string) => void;
  onColGapFocus: () => void;
  onColGapCancel: () => void;
};

export function LayoutGapControl({
  mode,
  flexDirection = "row",
  gap,
  rowGap,
  colGap,
  onGapChange,
  onGapCommit,
  onGapFocus,
  onGapCancel,
  onRowGapChange,
  onRowGapCommit,
  onRowGapFocus,
  onRowGapCancel,
  onColGapChange,
  onColGapCommit,
  onColGapFocus,
  onColGapCancel,
}: LayoutGapControlProps) {
  if (mode === "flex") {
    const gapIcon =
      flexDirection === "column" ? (
        <LayoutVerticalGapIcon />
      ) : (
        <LayoutHorizontalGapIcon />
      );

    return (
      <GapField
        icon={gapIcon}
        cssProperty="gap"
        displayLabel="Gap"
        value={gap}
        onChange={onGapChange}
        onCommit={onGapCommit}
        onFocus={onGapFocus}
        onCancel={onGapCancel}
      />
    );
  }

  return (
    <div className="wv-layout-gap-row">
      <GapField
        icon={<LayoutHorizontalGapIcon />}
        cssProperty="column-gap"
        displayLabel="Horizontal gap"
        value={colGap}
        onChange={onColGapChange}
        onCommit={onColGapCommit}
        onFocus={onColGapFocus}
        onCancel={onColGapCancel}
      />
      <GapField
        icon={<LayoutVerticalGapIcon />}
        cssProperty="row-gap"
        displayLabel="Vertical gap"
        value={rowGap}
        onChange={onRowGapChange}
        onCommit={onRowGapCommit}
        onFocus={onRowGapFocus}
        onCancel={onRowGapCancel}
      />
    </div>
  );
}
