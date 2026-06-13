import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { TypoChevronIcon } from "./typographyIcons";

const PRESET_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

type WeightSelectProps = {
  value: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  onFocus?: () => void;
  /** Revert live font-weight preview (Escape in custom field). */
  onCancel?: () => void;
  /** Card row styling for typography fields (Figma tray). */
  variant?: "default" | "card";
};

/**
 * Preset weights use a native `<select>` so the OS draws the menu. A custom in-shadow
 * popover + `document` capture was unreliable: Weevar’s global `pointerdown` capture
 * calls `stopPropagation()` when it thinks the hit is "host page", and closed shadow
 * hit-testing / `composedPath` can mis-classify tray UI — native `<select>` menus are
 * not subject to that path. Custom values still use the text field + the same commit path.
 */
export function WeightSelect({
  value,
  onChange,
  onCommit,
  onFocus,
  onCancel,
  variant = "default",
}: WeightSelectProps) {
  const [customRaw, setCustomRaw] = useState("");
  const [customFocused, setCustomFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inPreset = PRESET_WEIGHTS.includes(value);

  useEffect(() => {
    if (!inPreset) setCustomRaw(String(value));
    else if (!customFocused) setCustomRaw("");
  }, [value, inPreset, customFocused]);

  const commitCustom = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 1000) {
      if (n !== value) {
        onChange(n);
        onCommit(n);
      }
      setCustomRaw(PRESET_WEIGHTS.includes(n) ? "" : String(n));
    } else {
      setCustomRaw(inPreset ? "" : String(value));
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
    setCustomFocused(false);
  };

  const presetOptions = (
    <>
      {!inPreset && <option value={String(value)}>{String(value)}</option>}
      {PRESET_WEIGHTS.map((w) => (
        <option key={w} value={String(w)}>
          {w}
        </option>
      ))}
    </>
  );

  const customInputHandlers = {
    onFocus: () => {
      setCustomFocused(true);
      onFocus?.();
      if (inPreset && customRaw.trim() === "") {
        setCustomRaw(String(value));
      }
      requestAnimationFrame(() => inputRef.current?.select());
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setCustomRaw(e.target.value);
      const n = parseInt(e.target.value, 10);
      if (!isNaN(n)) onChange(n);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitCustom(customRaw);
        setCustomFocused(false);
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel?.();
        setCustomRaw(inPreset ? "" : String(value));
        setCustomFocused(false);
        inputRef.current?.blur();
      }
    },
    onBlur: () => {
      setCustomFocused(false);
      if (customRaw.trim()) {
        commitCustom(customRaw);
      } else {
        setCustomRaw(inPreset ? "" : String(value));
      }
    },
  };

  const displayValue = customFocused ? customRaw : customRaw || String(value);

  if (variant === "card") {
    return (
      <div className="wv-weight-wrap wv-pe wv-weight-wrap--card">
        <div className="wv-weight-row">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className="wv-weight-custom-input wv-weight-custom-input--card wv-pe"
            value={displayValue}
            aria-label="Font weight"
            {...customInputHandlers}
          />
          <label className="wv-weight-card-chevron wv-pe">
            <select
              className="wv-weight-native wv-weight-native--card-menu wv-pe"
              aria-label="Font weight presets"
              value={String(value)}
              onPointerDown={() => onFocus?.()}
              onChange={handleSelectChange}
            >
              {presetOptions}
            </select>
            <TypoChevronIcon />
          </label>
        </div>
      </div>
    );
  }

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
          {presetOptions}
        </select>
        <input
          ref={inputRef}
          type="text"
          className="wv-weight-custom-input wv-pe"
          placeholder="Custom…"
          value={customRaw}
          aria-label="Custom font weight"
          {...customInputHandlers}
        />
      </div>
    </div>
  );
}
