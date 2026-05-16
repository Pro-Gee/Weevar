import { useEffect, useState, type ChangeEvent } from "react";

const PRESET_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

type WeightSelectProps = {
  value: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  onFocus?: () => void;
  /** Revert live font-weight preview (Escape in custom field). */
  onCancel?: () => void;
};

/**
 * Preset weights use a native `<select>` so the OS draws the menu. A custom in-shadow
 * popover + `document` capture was unreliable: Weevar’s global `pointerdown` capture
 * calls `stopPropagation()` when it thinks the hit is "host page", and closed shadow
 * hit-testing / `composedPath` can mis-classify tray UI — native `<select>` menus are
 * not subject to that path. Custom values still use the text field + the same commit path.
 */
export function WeightSelect({ value, onChange, onCommit, onFocus, onCancel }: WeightSelectProps) {
  const [customRaw, setCustomRaw] = useState("");

  const inPreset = PRESET_WEIGHTS.includes(value);

  useEffect(() => {
    if (!inPreset) setCustomRaw(String(value));
    else setCustomRaw("");
  }, [value, inPreset]);

  const commitCustom = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 1000) {
      if (n !== value) {
        onChange(n);
        onCommit(n);
      }
      setCustomRaw(PRESET_WEIGHTS.includes(n) ? "" : String(n));
    } else {
      setCustomRaw(String(value));
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const n = parseInt(e.target.value, 10);
    if (!Number.isFinite(n)) return;
    if (n === value) return;
    onFocus?.();
    onChange(n);
    onCommit(n);
    if (PRESET_WEIGHTS.includes(n)) setCustomRaw("");
  };

  return (
    <div className="wv-weight-wrap wv-pe">
      <div className="wv-weight-row">
        <select
          className="wv-weight-native wv-pe"
          aria-label="Font weight"
          value={String(value)}
          onPointerDown={() => onFocus?.()}
          onChange={handleSelectChange}
        >
          {!inPreset && (
            <option value={String(value)}>{String(value)}</option>
          )}
          {PRESET_WEIGHTS.map((w) => (
            <option key={w} value={String(w)}>
              {w}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="wv-weight-custom-input wv-pe"
          placeholder="Custom…"
          value={customRaw}
          onFocus={() => onFocus?.()}
          onChange={(e) => {
            setCustomRaw(e.target.value);
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(n);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitCustom(customRaw);
            }
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel?.();
          setCustomRaw(PRESET_WEIGHTS.includes(value) ? "" : String(value));
        }
          }}
          onBlur={() => {
            if (customRaw.trim()) commitCustom(customRaw);
          }}
        />
      </div>
    </div>
  );
}
