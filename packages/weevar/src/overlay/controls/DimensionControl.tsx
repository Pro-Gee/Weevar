import { useCallback, useRef, useState } from "react";
import type { DimensionSizingMode } from "../../engine/dimensionSizing";
import { dimensionSizingLabel } from "../../engine/dimensionSizing";
import { roundTo2 } from "../../engine/roundNumber";
import { AspectRatioLockIcon } from "./boxSpacingIcons";
import { DimensionLabelSelect } from "./DimensionLabelSelect";
import { NumberInput } from "./NumberInput";

type DimensionProp = "width" | "height";

export type DimensionControlProps = {
  width: number;
  height: number;
  widthMode?: DimensionSizingMode;
  heightMode?: DimensionSizingMode;
  /** Show Fill / Hug sizing menu on W and H labels. Off for SVG. */
  sizingModes?: boolean;
  widthDisplayLabel: string;
  heightDisplayLabel: string;
  onDimensionChange: (prop: DimensionProp, value: string) => void;
  onDimensionCommit: (prop: DimensionProp, value: string) => void;
  onDimensionFocus: (prop: DimensionProp) => void;
  onDimensionCancel: (prop: DimensionProp) => void;
  onDimensionModeCommit?: (prop: DimensionProp, mode: "fill" | "hug") => void;
  onDimensionRestoreFixed?: (prop: DimensionProp) => void;
};

export function formatPx(n: number): string {
  return `${roundTo2(n)}px`;
}

export function pairedDimension(
  prop: DimensionProp,
  value: number,
  ratio: number,
): { width: string; height: string } {
  if (prop === "width") {
    const h = Math.max(1, roundTo2(value / ratio));
    return { width: formatPx(value), height: formatPx(h) };
  }
  const w = Math.max(1, roundTo2(value * ratio));
  return { width: formatPx(w), height: formatPx(value) };
}

export function DimensionControl({
  width,
  height,
  widthMode = "fixed",
  heightMode = "fixed",
  sizingModes = true,
  widthDisplayLabel,
  heightDisplayLabel,
  onDimensionChange,
  onDimensionCommit,
  onDimensionFocus,
  onDimensionCancel,
  onDimensionModeCommit,
  onDimensionRestoreFixed,
}: DimensionControlProps) {
  const [aspectLocked, setAspectLocked] = useState(true);
  const [focusAfterRestore, setFocusAfterRestore] = useState<DimensionProp | null>(
    null,
  );
  const aspectRatioRef = useRef(width / height || 1);

  const syncAspectRatio = useCallback(() => {
    aspectRatioRef.current = height > 0 ? width / height : 1;
  }, [width, height]);

  const canPair =
    aspectLocked && widthMode === "fixed" && heightMode === "fixed";

  const handleFocus = (prop: DimensionProp) => {
    syncAspectRatio();
    onDimensionFocus(prop);
    if (canPair) {
      onDimensionFocus(prop === "width" ? "height" : "width");
    }
  };

  const handleChange = (prop: DimensionProp, value: string) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) return;

    if (!canPair) {
      onDimensionChange(prop, value);
      return;
    }

    const paired = pairedDimension(prop, num, aspectRatioRef.current);
    onDimensionChange("width", paired.width);
    onDimensionChange("height", paired.height);
  };

  const handleCommit = (prop: DimensionProp, value: string) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) return;

    if (!canPair) {
      onDimensionCommit(prop, value);
      return;
    }

    const paired = pairedDimension(prop, num, aspectRatioRef.current);
    onDimensionCommit("width", paired.width);
    onDimensionCommit("height", paired.height);
  };

  const handleCancel = (prop: DimensionProp) => {
    onDimensionCancel(prop);
    if (canPair) {
      onDimensionCancel(prop === "width" ? "height" : "width");
    }
  };

  const renderLabel = (prop: DimensionProp, label: "W" | "H", displayLabel: string) => {
    if (!sizingModes) {
      return <span className="wv-typo-card-label">{label}</span>;
    }
    return (
      <DimensionLabelSelect
        label={label}
        ariaLabel={`${displayLabel} sizing`}
        onFocus={() => onDimensionFocus(prop)}
        onSelect={(mode) => onDimensionModeCommit?.(prop, mode)}
      />
    );
  };

  const renderValue = (
    prop: DimensionProp,
    mode: DimensionSizingMode,
    value: number,
    displayLabel: string,
  ) => {
    if (sizingModes && mode !== "fixed") {
      return (
        <button
          type="button"
          className="wv-dimension-mode-value wv-pe"
          aria-label={`${displayLabel}: ${dimensionSizingLabel(mode)}. Click to edit fixed size.`}
          onPointerDown={(e) => {
            e.preventDefault();
            setFocusAfterRestore(prop);
            onDimensionRestoreFixed?.(prop);
          }}
        >
          {dimensionSizingLabel(mode)}
        </button>
      );
    }

    return (
      <NumberInput
        cssProperty={prop}
        displayLabel={displayLabel}
        value={value}
        unit="px"
        min={1}
        variant="card"
        autoFocus={focusAfterRestore === prop}
        onChange={(v) => handleChange(prop, v)}
        onCommit={(v) => handleCommit(prop, v)}
        onFocus={() => {
          setFocusAfterRestore((current) => (current === prop ? null : current));
          handleFocus(prop);
        }}
        onCancel={() => handleCancel(prop)}
      />
    );
  };

  return (
    <div className="wv-dimension-row">
      <div className="wv-typo-card">
        {renderLabel("width", "W", widthDisplayLabel)}
        {renderValue("width", widthMode, width, widthDisplayLabel)}
      </div>
      <div className="wv-typo-card">
        {renderLabel("height", "H", heightDisplayLabel)}
        {renderValue("height", heightMode, height, heightDisplayLabel)}
      </div>
      <button
        type="button"
        className={`wv-box-spacing-toggle wv-pe${aspectLocked ? " wv-box-spacing-toggle--active" : ""}`}
        title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
        aria-label={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
        aria-pressed={aspectLocked}
        onClick={() => {
          syncAspectRatio();
          setAspectLocked((locked) => !locked);
        }}
      >
        <AspectRatioLockIcon />
      </button>
    </div>
  );
}
