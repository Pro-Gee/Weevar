import { useState, type ReactNode } from "react";
import {
  BoxSidesToggleIcon,
  RadiusAllCornersIcon,
  RadiusBottomLeftIcon,
  RadiusBottomRightIcon,
  RadiusTopLeftIcon,
  RadiusTopRightIcon,
} from "./boxSpacingIcons";
import { NumberInput } from "./NumberInput";

type CornerKey = "tl" | "tr" | "br" | "bl";
type RadiusValues = { tl: number; tr: number; br: number; bl: number };

type RadiusControlProps = {
  values: RadiusValues;
  onSingleChange: (v: string) => void;
  onSingleCommit: (v: string) => void;
  onCornerChange: (corner: CornerKey, v: string) => void;
  onCornerCommit: (corner: CornerKey, v: string) => void;
  onFocus?: (corner: "all" | CornerKey) => void;
  onDeferCancel?: (corner: "all" | CornerKey) => void;
};

const CORNER_ROWS: Array<[CornerKey, CornerKey]> = [
  ["tl", "tr"],
  ["bl", "br"],
];

const CORNER_CSS: Record<CornerKey, string> = {
  tl: "border-top-left-radius",
  tr: "border-top-right-radius",
  br: "border-bottom-right-radius",
  bl: "border-bottom-left-radius",
};

const CORNER_LABELS: Record<CornerKey, string> = {
  tl: "Top Left",
  tr: "Top Right",
  br: "Bottom Right",
  bl: "Bottom Left",
};

function cornerIcon(key: CornerKey): ReactNode {
  const icons = {
    tl: <RadiusTopLeftIcon />,
    tr: <RadiusTopRightIcon />,
    br: <RadiusBottomRightIcon />,
    bl: <RadiusBottomLeftIcon />,
  };
  return icons[key];
}

export function RadiusControl({
  values,
  onSingleChange,
  onSingleCommit,
  onCornerChange,
  onCornerCommit,
  onFocus,
  onDeferCancel,
}: RadiusControlProps) {
  const [mode, setMode] = useState<"single" | "corners">("single");

  const avgRadius = Math.round((values.tl + values.tr + values.br + values.bl) / 4);

  const renderRadiusField = (
    corner: "all" | CornerKey,
    icon: ReactNode,
    value: number,
    cssProperty: string,
    displayLabel: string,
    onChange: (v: string) => void,
    onCommit: (v: string) => void,
  ) => (
    <div className="wv-typo-icon-card wv-box-spacing-card">
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
        onFocus={() => onFocus?.(corner)}
        onCancel={() => onDeferCancel?.(corner)}
      />
    </div>
  );

  return (
    <div className="wv-box-subsection wv-radius-section">
      <span className="wv-box-subsection-title">Corner Radius</span>

      <div className="wv-box-spacing-row">
        {mode === "single" ? (
          <div className="wv-box-spacing-cards">
            {renderRadiusField(
              "all",
              <RadiusAllCornersIcon />,
              avgRadius,
              "border-radius",
              "Corner Radius",
              onSingleChange,
              onSingleCommit,
            )}
          </div>
        ) : (
          <div className="wv-box-spacing-sides">
            {CORNER_ROWS.map(([a, b]) => (
              <div key={`${a}-${b}`} className="wv-box-spacing-sides-row">
                {renderRadiusField(
                  a,
                  cornerIcon(a),
                  values[a],
                  CORNER_CSS[a],
                  `Corner Radius ${CORNER_LABELS[a]}`,
                  (v) => onCornerChange(a, v),
                  (v) => onCornerCommit(a, v),
                )}
                {renderRadiusField(
                  b,
                  cornerIcon(b),
                  values[b],
                  CORNER_CSS[b],
                  `Corner Radius ${CORNER_LABELS[b]}`,
                  (v) => onCornerChange(b, v),
                  (v) => onCornerCommit(b, v),
                )}
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className={`wv-box-spacing-toggle wv-pe${mode === "corners" ? " wv-box-spacing-toggle--active" : ""}`}
          title={mode === "corners" ? "Use unified radius" : "Edit each corner"}
          aria-label={mode === "corners" ? "Use unified radius" : "Edit each corner"}
          aria-pressed={mode === "corners"}
          onClick={() => setMode((m) => (m === "single" ? "corners" : "single"))}
        >
          <BoxSidesToggleIcon />
        </button>
      </div>
    </div>
  );
}
