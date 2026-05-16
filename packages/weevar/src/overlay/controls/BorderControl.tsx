import { ColorPicker } from "./ColorPicker";
import { NumberInput } from "./NumberInput";
import { SelectControl } from "./SelectControl";

const BORDER_STYLE_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "solid",  label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
];

type BorderControlProps = {
  width: number;
  style: string;
  color: string;
  onWidthChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  onColorChange: (v: string, styleTarget: Element) => void;
  onWidthCommit: (v: string) => void;
  onStyleCommit: (v: string) => void;
  onColorCommit: (v: string, commitTarget: Element, fromSnapshotHex?: string) => void;
  onFocusWidth?: () => void;
  onCancelWidth?: () => void;
  onFocusColor?: () => void;
  /** DOM node whose border colour is edited (EditTray `element`). */
  styleCommitTarget: Element;
  /** Passed to ColorPicker so a new pointer selection finalizes an open native colour dialog. */
  selectionDismissSignal?: unknown;
};

export function BorderControl({
  width,
  style,
  color,
  onWidthChange,
  onStyleChange,
  onColorChange,
  onWidthCommit,
  onStyleCommit,
  onColorCommit,
  onFocusWidth,
  onCancelWidth,
  onFocusColor,
  styleCommitTarget,
  selectionDismissSignal,
}: BorderControlProps) {
  const borderFieldsDisabled = style === "none";

  return (
    <div className="wv-border-row wv-pe">
      <NumberInput
        cssProperty="border-width"
        displayLabel="Border Width"
        value={width}
        unit="px"
        min={0}
        max={99}
        onChange={onWidthChange}
        onCommit={onWidthCommit}
        onFocus={onFocusWidth}
        onCancel={onCancelWidth}
        disabled={borderFieldsDisabled}
      />
      <SelectControl
        value={style}
        options={BORDER_STYLE_OPTIONS}
        onCommit={onStyleCommit}
        style={{ flex: 1 }}
      />
      <ColorPicker
        value={color}
        onChange={onColorChange}
        onCommit={onColorCommit}
        onFocus={onFocusColor}
        styleCommitTarget={styleCommitTarget}
        selectionDismissSignal={selectionDismissSignal}
        disabled={borderFieldsDisabled}
      />
    </div>
  );
}
