import { useCallback, useRef, useState } from "react";
import { roundTo2 } from "../../engine/roundNumber";
import { AspectRatioLockIcon } from "./boxSpacingIcons";
import { NumberInput } from "./NumberInput";

type DimensionProp = "width" | "height";

export type DimensionControlProps = {
  width: number;
  height: number;
  widthDisplayLabel: string;
  heightDisplayLabel: string;
  onDimensionChange: (prop: DimensionProp, value: string) => void;
  onDimensionCommit: (prop: DimensionProp, value: string) => void;
  onDimensionFocus: (prop: DimensionProp) => void;
  onDimensionCancel: (prop: DimensionProp) => void;
};

function pairedDimension(
  prop: DimensionProp,
  value: number,
  ratio: number,
): { width: string; height: string } {
  if (prop === "width") {
    const h = Math.max(1, roundTo2(value / ratio));
    return { width: String(roundTo2(value)), height: String(h) };
  }
  const w = Math.max(1, roundTo2(value * ratio));
  return { width: String(w), height: String(roundTo2(value)) };
}

export function DimensionControl({
  width,
  height,
  widthDisplayLabel,
  heightDisplayLabel,
  onDimensionChange,
  onDimensionCommit,
  onDimensionFocus,
  onDimensionCancel,
}: DimensionControlProps) {
  const [aspectLocked, setAspectLocked] = useState(true);
  const aspectRatioRef = useRef(width / height || 1);

  const syncAspectRatio = useCallback(() => {
    aspectRatioRef.current = height > 0 ? width / height : 1;
  }, [width, height]);

  const handleFocus = (prop: DimensionProp) => {
    syncAspectRatio();
    onDimensionFocus(prop);
    if (aspectLocked) {
      onDimensionFocus(prop === "width" ? "height" : "width");
    }
  };

  const handleChange = (prop: DimensionProp, value: string) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num <= 0) return;

    if (!aspectLocked) {
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

    if (!aspectLocked) {
      onDimensionCommit(prop, value);
      return;
    }

    const paired = pairedDimension(prop, num, aspectRatioRef.current);
    onDimensionCommit("width", paired.width);
    onDimensionCommit("height", paired.height);
  };

  const handleCancel = (prop: DimensionProp) => {
    onDimensionCancel(prop);
    if (aspectLocked) {
      onDimensionCancel(prop === "width" ? "height" : "width");
    }
  };

  return (
    <div className="wv-dimension-row">
      <div className="wv-typo-card">
        <span className="wv-typo-card-label">W</span>
        <NumberInput
          cssProperty="width"
          displayLabel={widthDisplayLabel}
          value={width}
          unit="px"
          min={1}
          variant="card"
          onChange={(v) => handleChange("width", v)}
          onCommit={(v) => handleCommit("width", v)}
          onFocus={() => handleFocus("width")}
          onCancel={() => handleCancel("width")}
        />
      </div>
      <div className="wv-typo-card">
        <span className="wv-typo-card-label">H</span>
        <NumberInput
          cssProperty="height"
          displayLabel={heightDisplayLabel}
          value={height}
          unit="px"
          min={1}
          variant="card"
          onChange={(v) => handleChange("height", v)}
          onCommit={(v) => handleCommit("height", v)}
          onFocus={() => handleFocus("height")}
          onCancel={() => handleCancel("height")}
        />
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
