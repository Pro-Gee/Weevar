import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  TrayDropdownChevronTrigger,
  TrayDropdownMenu,
  type TrayDropdownOption,
  useTrayDropdown,
} from "./TrayDropdown";

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
  cardLabel?: string;
};

export function WeightSelect({
  value,
  onChange,
  onCommit,
  onFocus,
  onCancel,
  variant = "default",
  cardLabel,
}: WeightSelectProps) {
  const [customRaw, setCustomRaw] = useState("");
  const [customFocused, setCustomFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { open, toggle, close, rootRef, menuRef } = useTrayDropdown(onFocus);

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

  const presetOptions: TrayDropdownOption[] = [
    ...(!inPreset ? [{ value: String(value), label: String(value) }] : []),
    ...PRESET_WEIGHTS.map((weight) => ({
      value: String(weight),
      label: String(weight),
    })),
  ];

  const handlePresetSelect = (next: string) => {
    const n = parseInt(next, 10);
    if (!Number.isFinite(n) || n === value) return;
    onFocus?.();
    onChange(n);
    onCommit(n);
    if (PRESET_WEIGHTS.includes(n)) setCustomRaw("");
    setCustomFocused(false);
  };

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
      <div ref={rootRef} className="wv-tray-dropdown wv-weight-wrap--card wv-pe">
        <div className="wv-typo-card">
          {cardLabel ? (
            <span className="wv-typo-card-label">{cardLabel}</span>
          ) : null}
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
            <TrayDropdownChevronTrigger
              open={open}
              onClick={toggle}
              ariaLabel="Font weight presets"
            />
          </div>
        </div>
        {open ? (
          <TrayDropdownMenu
            menuRef={menuRef}
            value={String(value)}
            options={presetOptions}
            onSelect={(next) => {
              handlePresetSelect(next);
              close();
            }}
            ariaLabel="Font weight presets"
          />
        ) : null}
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
          onChange={(e) => handlePresetSelect(e.target.value)}
        >
          {!inPreset && <option value={String(value)}>{String(value)}</option>}
          {PRESET_WEIGHTS.map((weight) => (
            <option key={weight} value={String(weight)}>
              {weight}
            </option>
          ))}
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
