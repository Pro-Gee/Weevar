import { useEffect, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react";

type NumberInputProps = {
  cssProperty: string;
  displayLabel: string;
  /** Parsed numeric value — no unit string. */
  value: number;
  /** Unit appended for display e.g. "px" or "%". Pass "" for unitless values. */
  unit?: string;
  min?: number;
  max?: number;
  /** Increment for arrow-key nudge. Default: 1. */
  step?: number;
  /** Called on every keystroke for live DOM preview. Receives formatted value e.g. "18px". */
  onChange: (formatted: string) => void;
  /** Called on Enter or blur with the final committed formatted value. */
  onCommit: (formatted: string) => void;
  /** Called on focus so the parent can record the "from" value before editing begins. */
  onFocus?: () => void;
  /** Called on Escape so the parent can revert live preview without logging history. */
  onCancel?: () => void;
  disabled?: boolean;
};

export function NumberInput({
  value,
  unit = "px",
  min,
  max,
  step = 1,
  displayLabel,
  onChange,
  onCommit,
  onFocus,
  onCancel,
  disabled = false,
}: NumberInputProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));
  const fromRef = useRef<string>(`${value}${unit}`);

  // Keep display in sync when value changes externally (e.g. undo)
  useEffect(() => {
    if (!editing) setRaw(String(value));
  }, [value, editing]);

  const format = (n: number): string => (unit ? `${n}${unit}` : String(n));

  const hasUnit = unit !== "";

  const parseAndClamp = (input: string): number | null => {
    const n = parseFloat(input);
    if (isNaN(n)) return null;
    let clamped = n;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return parseFloat(clamped.toFixed(2));
  };

  const commit = (inputRaw: string) => {
    setEditing(false);
    const n = parseAndClamp(inputRaw);
    if (n === null) {
      setRaw(String(value)); // revert display to last known good value
      return;
    }
    const formatted = format(n);
    if (formatted === fromRef.current) {
      return;
    }
    onCommit(formatted);
  };

  const sharedHandlers = {
    onFocus: () => {
      fromRef.current = format(value);
      setEditing(true);
      setRaw(String(value));
      onFocus?.();
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setRaw(e.target.value);
      const n = parseAndClamp(e.target.value);
      if (n !== null) onChange(format(n));
    },
    onBlur: (e: FocusEvent<HTMLInputElement>) => {
      commit(e.target.value);
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commit(raw);
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel?.();
        setRaw(hasUnit ? fromRef.current.replace(unit, "") : fromRef.current);
        setEditing(false);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const current = parseFloat(raw) || value;
        const delta = e.key === "ArrowUp" ? step : -step;
        const next = parseAndClamp(String(current + delta));
        if (next !== null) {
          setRaw(String(next));
          onChange(format(next));
        }
      }
    },
  };

  if (!hasUnit) {
    return (
      <input
        type="text"
        className="wv-number-input wv-pe"
        value={editing ? raw : format(value)}
        aria-label={displayLabel}
        disabled={disabled}
        {...sharedHandlers}
      />
    );
  }

  return (
    <div className="wv-number-input-wrap wv-pe">
      <input
        type="text"
        className="wv-number-input wv-pe"
        value={editing ? raw : String(value)}
        aria-label={displayLabel}
        disabled={disabled}
        {...sharedHandlers}
      />
      <span className="wv-number-input-unit" aria-hidden="true">
        {unit}
      </span>
    </div>
  );
}
