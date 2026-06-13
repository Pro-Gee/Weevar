import { useState, type ReactNode } from "react";
import { NumberInput } from "./NumberInput";
import {
  BoxSidesToggleIcon,
  MarginBottomIcon,
  MarginHorizontalIcon,
  MarginLeftIcon,
  MarginRightIcon,
  MarginTopIcon,
  MarginVerticalIcon,
  PaddingBottomIcon,
  PaddingHorizontalIcon,
  PaddingLeftIcon,
  PaddingRightIcon,
  PaddingTopIcon,
  PaddingVerticalIcon,
} from "./boxSpacingIcons";

type BoxSide = "top" | "right" | "bottom" | "left";
type BoxAxis = "v" | "h";

type BoxValues = { top: number; right: number; bottom: number; left: number };

type BoxControlProps = {
  property: "margin" | "padding";
  values: BoxValues;
  /**
   * Receives axis ("v" | "h") in V/H mode, or a side name in 4-side mode.
   * "v" means top + bottom together. "h" means left + right together.
   */
  onChange: (axis: BoxAxis | BoxSide, value: number) => void;
  onCommit: (axis: BoxAxis | BoxSide, value: number) => void;
  onFocus?: (axis: BoxAxis | BoxSide) => void;
  /** Escape on a number field: revert live preview for the affected side(s). */
  onDeferCancel?: (axis: BoxAxis | BoxSide) => void;
};

const SIDE_ROWS: Array<[BoxSide, BoxSide]> = [
  ["left", "top"],
  ["right", "bottom"],
];

function sideIcon(property: "margin" | "padding", side: BoxSide): ReactNode {
  if (property === "margin") {
    const icons = {
      left: <MarginLeftIcon />,
      top: <MarginTopIcon />,
      right: <MarginRightIcon />,
      bottom: <MarginBottomIcon />,
    };
    return icons[side];
  }
  const icons = {
    left: <PaddingLeftIcon />,
    top: <PaddingTopIcon />,
    right: <PaddingRightIcon />,
    bottom: <PaddingBottomIcon />,
  };
  return icons[side];
}

function sideLabel(property: "margin" | "padding", side: BoxSide): string {
  const name = property === "margin" ? "Margin" : "Padding";
  return `${name} ${side}`;
}

export function BoxControl({
  property,
  values,
  onChange,
  onCommit,
  onFocus,
  onDeferCancel,
}: BoxControlProps) {
  const [mode, setMode] = useState<"vh" | "sides">("vh");

  const vValue = Math.round((values.top + values.bottom) / 2);
  const hValue = Math.round((values.left + values.right) / 2);

  const label = property === "margin" ? "Margin" : "Padding";
  const minVal = property === "padding" ? 0 : -999;

  const hIcon =
    property === "margin" ? <MarginHorizontalIcon /> : <PaddingHorizontalIcon />;
  const vIcon =
    property === "margin" ? <MarginVerticalIcon /> : <PaddingVerticalIcon />;

  const renderField = (icon: ReactNode, axis: BoxAxis | BoxSide, value: number) => (
    <div className="wv-typo-icon-card wv-box-spacing-card">
      {icon}
      <NumberInput
        cssProperty={
          axis === "h"
            ? `${property}-left`
            : axis === "v"
              ? `${property}-top`
              : `${property}-${axis}`
        }
        displayLabel={
          axis === "h"
            ? `${label} horizontal`
            : axis === "v"
              ? `${label} vertical`
              : sideLabel(property, axis)
        }
        value={value}
        unit="px"
        min={minVal}
        variant="card"
        onChange={(v) => onChange(axis, parseFloat(v))}
        onCommit={(v) => onCommit(axis, parseFloat(v))}
        onFocus={() => onFocus?.(axis)}
        onCancel={() => onDeferCancel?.(axis)}
      />
    </div>
  );

  return (
    <div className="wv-box-spacing-row">
      {mode === "vh" ? (
        <div className="wv-box-spacing-cards">
          {renderField(hIcon, "h", hValue)}
          {renderField(vIcon, "v", vValue)}
        </div>
      ) : (
        <div className="wv-box-spacing-sides">
          {SIDE_ROWS.map(([a, b]) => (
            <div key={`${a}-${b}`} className="wv-box-spacing-sides-row">
              {renderField(sideIcon(property, a), a, values[a])}
              {renderField(sideIcon(property, b), b, values[b])}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`wv-box-spacing-toggle wv-pe${mode === "sides" ? " wv-box-spacing-toggle--active" : ""}`}
        title={mode === "sides" ? "Use vertical / horizontal inputs" : "Edit each side"}
        aria-label={mode === "sides" ? "Use vertical / horizontal inputs" : "Edit each side"}
        aria-pressed={mode === "sides"}
        onClick={() => setMode((m) => (m === "vh" ? "sides" : "vh"))}
      >
        <BoxSidesToggleIcon />
      </button>
    </div>
  );
}
