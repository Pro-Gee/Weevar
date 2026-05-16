import { useState } from "react";
import { NumberInput } from "./NumberInput";

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

const FourSidesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="0.5" y="0.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
    <rect x="7.5" y="0.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
    <rect x="0.5" y="7.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
    <rect x="7.5" y="7.5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export function BoxControl({
  property,
  values,
  onChange,
  onCommit,
  onFocus,
  onDeferCancel,
}: BoxControlProps) {
  const [mode, setMode] = useState<"vh" | "sides">("vh");

  // In V/H mode display the average of the paired sides
  const vValue = Math.round((values.top + values.bottom) / 2);
  const hValue = Math.round((values.left + values.right) / 2);

  const label = property === "margin" ? "Margin" : "Padding";
  const minVal = property === "padding" ? 0 : -999;

  return (
    <div className="wv-box-control">
      <div className="wv-box-header">
        <span className="wv-section-label">{label}</span>
        <button
          type="button"
          className={`wv-box-toggle wv-pe${mode === "sides" ? " wv-box-toggle--active" : ""}`}
          title="Toggle 4-side mode"
          onClick={() => setMode((m) => (m === "vh" ? "sides" : "vh"))}
        >
          <FourSidesIcon />
        </button>
      </div>

      {mode === "vh" ? (
        <div className="wv-box-vh-row">
          <div className="wv-box-input-group">
            <span className="wv-box-axis-label">↕</span>
            <NumberInput
              cssProperty={`${property}-top`}
              displayLabel={`${label} vertical`}
              value={vValue}
              unit="px"
              min={minVal}
              onChange={(v) => onChange("v", parseFloat(v))}
              onCommit={(v) => onCommit("v", parseFloat(v))}
              onFocus={() => onFocus?.("v")}
              onCancel={() => onDeferCancel?.("v")}
            />
          </div>
          <div className="wv-box-input-group">
            <span className="wv-box-axis-label">↔</span>
            <NumberInput
              cssProperty={`${property}-left`}
              displayLabel={`${label} horizontal`}
              value={hValue}
              unit="px"
              min={minVal}
              onChange={(v) => onChange("h", parseFloat(v))}
              onCommit={(v) => onCommit("h", parseFloat(v))}
              onFocus={() => onFocus?.("h")}
              onCancel={() => onDeferCancel?.("h")}
            />
          </div>
        </div>
      ) : (
        <div className="wv-box-sides-grid">
          {(["top", "right", "bottom", "left"] as BoxSide[]).map((side) => (
            <div key={side} className="wv-box-input-group">
              <span className="wv-box-axis-label">{side[0]?.toUpperCase()}</span>
              <NumberInput
                cssProperty={`${property}-${side}`}
                displayLabel={`${label} ${side}`}
                value={values[side]}
                unit="px"
                min={minVal}
                onChange={(v) => onChange(side, parseFloat(v))}
                onCommit={(v) => onCommit(side, parseFloat(v))}
                onFocus={() => onFocus?.(side)}
                onCancel={() => onDeferCancel?.(side)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
