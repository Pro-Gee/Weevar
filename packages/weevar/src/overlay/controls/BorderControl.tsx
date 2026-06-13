import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { NumberInput } from "./NumberInput";
import { BorderTypeIcon, BoxSidesToggleIcon } from "./boxSpacingIcons";
import { TrayDropdown } from "./TrayDropdown";

const BORDER_STYLE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
] as const;

type BorderSide = "top" | "right" | "bottom" | "left";
type BorderWidthAxis = "all" | BorderSide;

type BorderWidthValues = { top: number; right: number; bottom: number; left: number };

type BorderControlProps = {
  style: string;
  color: string;
  widths: BorderWidthValues;
  onStyleChange: (v: string) => void;
  onStyleCommit: (v: string) => void;
  onColorChange: (v: string, styleTarget: Element) => void;
  onColorCommit: (v: string, commitTarget: Element, fromSnapshotHex?: string) => void;
  onWidthChange: (axis: BorderWidthAxis, value: number) => void;
  onWidthCommit: (axis: BorderWidthAxis, value: number) => void;
  onFocusStyle?: () => void;
  onFocusWidth?: (axis: BorderWidthAxis) => void;
  onCancelWidth?: (axis: BorderWidthAxis) => void;
  onFocusColor?: () => void;
  styleCommitTarget: Element;
  selectionDismissSignal?: unknown;
};

const SIDE_ROWS: Array<[BorderSide, BorderSide]> = [
  ["left", "top"],
  ["right", "bottom"],
];

const SIDE_LABELS: Record<BorderSide, string> = {
  left: "L",
  top: "T",
  right: "R",
  bottom: "B",
};

function sideCssProperty(side: BorderSide): string {
  return `border-${side}-width`;
}

function sideDisplayLabel(side: BorderSide): string {
  const names: Record<BorderSide, string> = {
    left: "Left",
    top: "Top",
    right: "Right",
    bottom: "Bottom",
  };
  return `Border Weight ${names[side]}`;
}

export function BorderControl({
  style,
  color,
  widths,
  onStyleChange,
  onStyleCommit,
  onColorChange,
  onColorCommit,
  onWidthChange,
  onWidthCommit,
  onFocusStyle,
  onFocusWidth,
  onCancelWidth,
  onFocusColor,
  styleCommitTarget,
  selectionDismissSignal,
}: BorderControlProps) {
  const [weightMode, setWeightMode] = useState<"all" | "sides">("all");
  const borderFieldsDisabled = style === "none";

  const unifiedWeight = Math.round(
    (widths.top + widths.right + widths.bottom + widths.left) / 4,
  );

  const handleStyleSelect = (next: string) => {
    onFocusStyle?.();
    onStyleChange(next);
    onStyleCommit(next);
  };

  const renderWeightField = (
    axis: BorderWidthAxis,
    label: string,
    value: number,
    cssProperty: string,
    displayLabel: string,
  ) => (
    <div
      className={`wv-typo-card wv-border-weight-card${borderFieldsDisabled ? " wv-border-weight-card--disabled" : ""}`}
    >
      <span className="wv-typo-card-label">{label}</span>
      <NumberInput
        cssProperty={cssProperty}
        displayLabel={displayLabel}
        value={value}
        unit="px"
        min={0}
        max={99}
        variant="card"
        disabled={borderFieldsDisabled}
        onChange={(v) => onWidthChange(axis, parseFloat(v))}
        onCommit={(v) => onWidthCommit(axis, parseFloat(v))}
        onFocus={() => onFocusWidth?.(axis)}
        onCancel={() => onCancelWidth?.(axis)}
      />
    </div>
  );

  const weightRow = (
    <div className="wv-box-spacing-row">
      {weightMode === "all" ? (
        <div className="wv-box-spacing-cards">
          {renderWeightField(
            "all",
            "Weight",
            unifiedWeight,
            "border-width",
            "Border Weight",
          )}
        </div>
      ) : (
        <div className="wv-box-spacing-sides">
          {SIDE_ROWS.map(([a, b]) => (
            <div key={`${a}-${b}`} className="wv-box-spacing-sides-row">
              {renderWeightField(a, SIDE_LABELS[a], widths[a], sideCssProperty(a), sideDisplayLabel(a))}
              {renderWeightField(b, SIDE_LABELS[b], widths[b], sideCssProperty(b), sideDisplayLabel(b))}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`wv-box-spacing-toggle wv-pe${weightMode === "sides" ? " wv-box-spacing-toggle--active" : ""}`}
        title={weightMode === "sides" ? "Use unified weight" : "Edit each side"}
        aria-label={weightMode === "sides" ? "Use unified weight" : "Edit each side"}
        aria-pressed={weightMode === "sides"}
        disabled={borderFieldsDisabled}
        onClick={() => setWeightMode((m) => (m === "all" ? "sides" : "all"))}
      >
        <BoxSidesToggleIcon />
      </button>
    </div>
  );

  return (
    <div className="wv-box-subsection wv-border-section">
      <span className="wv-box-subsection-title">Box Border</span>

      <TrayDropdown
        value={style}
        options={BORDER_STYLE_OPTIONS}
        leadingIcon={<BorderTypeIcon />}
        ariaLabel="Border style"
        onOpen={onFocusStyle}
        onSelect={handleStyleSelect}
      />

      <ColorPicker
        variant="card"
        cardLabel="Border Colour"
        opacityLabel="Border Opacity"
        value={color}
        onChange={onColorChange}
        onCommit={onColorCommit}
        onFocus={onFocusColor}
        styleCommitTarget={styleCommitTarget}
        selectionDismissSignal={selectionDismissSignal}
        disabled={borderFieldsDisabled}
      />

      {weightRow}
    </div>
  );
}
