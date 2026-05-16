import { useState } from "react";
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

const CornerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 10V4a2 2 0 012-2h6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CORNERS: Array<{ key: CornerKey; label: string }> = [
  { key: "tl", label: "TL" },
  { key: "tr", label: "TR" },
  { key: "br", label: "BR" },
  { key: "bl", label: "BL" },
];

const CORNER_CSS: Record<CornerKey, string> = {
  tl: "border-top-left-radius",
  tr: "border-top-right-radius",
  br: "border-bottom-right-radius",
  bl: "border-bottom-left-radius",
};

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

  // In single mode display the average of all four corners
  const avgRadius = Math.round((values.tl + values.tr + values.br + values.bl) / 4);

  return (
    <div className="wv-radius-control">
      <div className="wv-box-header">
        <span className="wv-section-label">Radius</span>
        <button
          type="button"
          className={`wv-box-toggle wv-pe${mode === "corners" ? " wv-box-toggle--active" : ""}`}
          title="Toggle per-corner mode"
          onClick={() => setMode((m) => (m === "single" ? "corners" : "single"))}
        >
          <CornerIcon />
        </button>
      </div>

      {mode === "single" ? (
        <div className="wv-box-input-group" style={{ paddingLeft: 0 }}>
          <NumberInput
            cssProperty="border-radius"
            displayLabel="Radius"
            value={avgRadius}
            unit="px"
            min={0}
            onChange={onSingleChange}
            onCommit={onSingleCommit}
            onFocus={() => onFocus?.("all")}
            onCancel={() => onDeferCancel?.("all")}
          />
        </div>
      ) : (
        <div className="wv-box-sides-grid">
          {CORNERS.map(({ key, label }) => (
            <div key={key} className="wv-box-input-group">
              <span className="wv-box-axis-label">{label}</span>
              <NumberInput
                cssProperty={CORNER_CSS[key]}
                displayLabel={`Radius ${label}`}
                value={values[key]}
                unit="px"
                min={0}
                onChange={(v) => onCornerChange(key, v)}
                onCommit={(v) => onCornerCommit(key, v)}
                onFocus={() => onFocus?.(key)}
                onCancel={() => onDeferCancel?.(key)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
