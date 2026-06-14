import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import {
  alphaPercentFromPickerColor,
  combineOpaqueHexAndAlphaPercent,
  cssPaintValuesEqual,
  opaqueHexFromPickerColor,
  parsePickerColorValue,
} from "../../engine/styleEngine";

type ColorPickerProps = {
  /** Full picker value: `#rrggbb` or `#rrggbbaa` (from readCssColorForPicker). */
  value: string;
  /** Live preview; `styleTarget` keeps preview on the node that opened the native picker after selection moves. */
  onChange: (hex: string, styleTarget: Element) => void;
  /**
   * Called when a colour choice is finalized: once per native picker session when the OS modal
   * goes away for any reason (OK, outside click, focus elsewhere, tray unmount), or when the hex
   * field blurs / Enter. Dragging inside the system picker only updates preview via onChange.
   */
  onCommit: (hex: string, commitTarget: Element, fromSnapshotHex?: string) => void;
  styleCommitTarget: Element;
  selectionDismissSignal?: unknown;
  onFocus?: () => void;
  disabled?: boolean;
  variant?: "default" | "card";
  /** First-row label when `variant="card"` (e.g. Font, Colour). */
  cardLabel?: string;
  /** Second-row label when `variant="card"` (default Fill Opacity). */
  opacityLabel?: string;
};

function isValidOpaqueHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

function isValidFullHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s);
}

function formatAlphaPercent(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
}

function parseAlphaPercentInput(raw: string): number | null {
  const t = raw.trim().replace(/%$/, "");
  if (t === "") return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

// Figma-style alpha grid: light squares on a slightly darker base.
const SWATCH_CHECKER_LIGHT = "#dcdcdc";
const SWATCH_CHECKER_DARK = "#a8a8a8";

function alphaGridLayers(swatchPx: number): Pick<
  CSSProperties,
  "backgroundColor" | "backgroundImage" | "backgroundSize" | "backgroundPosition" | "backgroundRepeat"
> {
  // Right half = 2 columns; full height = 4 rows (see Figma 16×16 swatch).
  const cell = swatchPx / 4;
  const tile = `${cell}px ${cell}px`;
  const offset = `${cell / 2}px ${cell / 2}px`;
  return {
    backgroundColor: SWATCH_CHECKER_LIGHT,
    backgroundImage: [
      `linear-gradient(45deg, ${SWATCH_CHECKER_DARK} 25%, transparent 25%, transparent 75%, ${SWATCH_CHECKER_DARK} 75%, ${SWATCH_CHECKER_DARK})`,
      `linear-gradient(45deg, ${SWATCH_CHECKER_DARK} 25%, transparent 25%, transparent 75%, ${SWATCH_CHECKER_DARK} 75%, ${SWATCH_CHECKER_DARK})`,
    ].join(", "),
    backgroundSize: `${tile}, ${tile}`,
    backgroundPosition: `0 0, ${offset}`,
    backgroundRepeat: "repeat, repeat",
  };
}

function swatchStyle(value: string, swatchPx: number): CSSProperties {
  const { r, g, b, alpha } = parsePickerColorValue(value);
  const opaque = `rgb(${r}, ${g}, ${b})`;

  if (alpha >= 1) {
    return { backgroundColor: opaque };
  }

  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  const split = `linear-gradient(to right, ${opaque} 50%, ${rgba} 50%)`;
  const divider =
    "linear-gradient(to right, transparent calc(50% - 0.5px), rgba(235, 235, 235, 0.12) calc(50% - 0.5px), " +
    "rgba(235, 235, 235, 0.12) calc(50% + 0.5px), transparent calc(50% + 0.5px))";
  const grid = alphaGridLayers(swatchPx);

  return {
    ...grid,
    backgroundImage: [divider, split, ...(grid.backgroundImage as string).split(", ")].join(", "),
    backgroundSize: `100% 100%, 100% 100%, ${grid.backgroundSize}`,
    backgroundPosition: `0 0, 0 0, ${grid.backgroundPosition}`,
    backgroundRepeat: `no-repeat, no-repeat, ${grid.backgroundRepeat}`,
  };
}

type NativeSession = { active: boolean; finalized: boolean };

export function ColorPicker({
  value,
  onChange,
  onCommit,
  onFocus,
  selectionDismissSignal,
  styleCommitTarget,
  disabled = false,
  variant = "default",
  cardLabel = "Colour",
  opacityLabel = "Fill Opacity",
}: ColorPickerProps) {
  const fullValue = isValidFullHex(value) ? value.toLowerCase() : "#000000";
  const displayOpaqueHex = opaqueHexFromPickerColor(fullValue).toLowerCase();
  const displayAlphaPercent = alphaPercentFromPickerColor(fullValue);

  const [hexRaw, setHexRaw] = useState(displayOpaqueHex);
  const [alphaRaw, setAlphaRaw] = useState(formatAlphaPercent(displayAlphaPercent));
  const [editingHex, setEditingHex] = useState(false);
  const [editingAlpha, setEditingAlpha] = useState(false);
  const [nativePickerOpen, setNativePickerOpen] = useState(false);
  const [nativeSessionHex, setNativeSessionHex] = useState(displayOpaqueHex);

  const rowRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const didFocusRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const styleCommitTargetRef = useRef(styleCommitTarget);
  styleCommitTargetRef.current = styleCommitTarget;
  const sessionCommitTargetRef = useRef<Element | null>(null);
  const sessionFromHexRef = useRef<string | null>(null);
  const sessionOpaqueBaselineRef = useRef("#000000");
  const sessionAlphaPercentRef = useRef(100);
  const userDidChangeNativeRef = useRef(false);
  const hexFieldBaselineRef = useRef("");
  const alphaFieldBaselineRef = useRef("");

  function revertNativePreview() {
    const fromSnap = sessionFromHexRef.current;
    const target = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
    if (fromSnap != null) {
      onChangeRef.current(fromSnap, target);
    }
  }

  function finishNativeSessionWithoutCommit() {
    revertNativePreview();
    sessionCommitTargetRef.current = null;
    sessionFromHexRef.current = null;
    userDidChangeNativeRef.current = false;
    setNativePickerOpen(false);
    didFocusRef.current = false;
  }

  const sessionRef = useRef<NativeSession>({ active: false, finalized: true });
  const lastPreviewHexRef = useRef(fullValue);
  const sawWindowBlurDuringPickerRef = useRef(false);
  const removeDismissListenersRef = useRef<(() => void) | null>(null);
  const endNativePickerSessionRef = useRef<() => void>(() => {});

  const nativeInputValue = nativePickerOpen ? nativeSessionHex : displayOpaqueHex;
  const previewFullValue = combineOpaqueHexAndAlphaPercent(
    nativePickerOpen ? nativeSessionHex : displayOpaqueHex,
    nativePickerOpen ? sessionAlphaPercentRef.current : displayAlphaPercent,
  );

  useEffect(() => {
    if (nativePickerOpen || sessionRef.current.active) return;
    lastPreviewHexRef.current = fullValue;
  }, [fullValue, nativePickerOpen]);

  function detachDismissListeners() {
    removeDismissListenersRef.current?.();
    removeDismissListenersRef.current = null;
  }

  function endNativePickerSession() {
    const s = sessionRef.current;
    if (!s.active || s.finalized) return;
    s.finalized = true;
    s.active = false;
    detachDismissListeners();
    const target = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
    const fromSnap = sessionFromHexRef.current;

    if (!userDidChangeNativeRef.current) {
      finishNativeSessionWithoutCommit();
      return;
    }

    const el = nativeInputRef.current;
    let combined = lastPreviewHexRef.current;
    if (el?.value && isValidOpaqueHex(el.value)) {
      combined = combineOpaqueHexAndAlphaPercent(el.value, sessionAlphaPercentRef.current);
    } else if (!isValidFullHex(combined)) {
      combined = combineOpaqueHexAndAlphaPercent("#000000", sessionAlphaPercentRef.current);
    }

    sessionCommitTargetRef.current = null;
    sessionFromHexRef.current = null;
    userDidChangeNativeRef.current = false;
    if (fromSnap != null && cssPaintValuesEqual(combined, fromSnap)) {
      revertNativePreview();
      setNativePickerOpen(false);
      didFocusRef.current = false;
      return;
    }
    onCommitRef.current(combined, target, fromSnap ?? undefined);
    setNativePickerOpen(false);
    didFocusRef.current = false;
  }

  endNativePickerSessionRef.current = endNativePickerSession;

  function attachDismissListeners() {
    const s = sessionRef.current;
    if (!s.active || s.finalized) return;

    const onNativeChange = () => {
      endNativePickerSessionRef.current();
    };

    const onDocPointerDown = (ev: PointerEvent) => {
      const s2 = sessionRef.current;
      if (!s2.active || s2.finalized) return;
      if (rowRef.current?.contains(ev.target as Node)) return;
      endNativePickerSessionRef.current();
    };

    const onFocusIn = (ev: FocusEvent) => {
      const s2 = sessionRef.current;
      if (!s2.active || s2.finalized) return;
      const t = ev.target as Node | null;
      if (t && rowRef.current?.contains(t)) return;
      endNativePickerSessionRef.current();
    };

    const onWindowBlur = () => {
      if (sessionRef.current.active && !sessionRef.current.finalized) {
        sawWindowBlurDuringPickerRef.current = true;
      }
    };

    const onWindowFocus = () => {
      const s2 = sessionRef.current;
      if (!s2.active || s2.finalized) return;
      if (!sawWindowBlurDuringPickerRef.current) return;
      sawWindowBlurDuringPickerRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          endNativePickerSessionRef.current();
        });
      });
    };

    const input = nativeInputRef.current;
    input?.addEventListener("change", onNativeChange);
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    removeDismissListenersRef.current = () => {
      input?.removeEventListener("change", onNativeChange);
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
    };
  }

  useEffect(() => {
    if (!sessionRef.current.active || sessionRef.current.finalized) return;
    endNativePickerSessionRef.current();
  }, [selectionDismissSignal]);

  useEffect(() => {
    if (!disabled) return;
    if (!sessionRef.current.active || sessionRef.current.finalized) return;
    endNativePickerSessionRef.current();
  }, [disabled]);

  useEffect(
    () => () => {
      if (sessionRef.current.active && !sessionRef.current.finalized) {
        endNativePickerSessionRef.current();
      } else {
        detachDismissListeners();
      }
    },
    [],
  );

  if (!editingHex && hexRaw !== displayOpaqueHex) setHexRaw(displayOpaqueHex);
  if (!editingAlpha && alphaRaw !== formatAlphaPercent(displayAlphaPercent)) {
    setAlphaRaw(formatAlphaPercent(displayAlphaPercent));
  }

  const triggerFocus = () => {
    if (!didFocusRef.current) {
      didFocusRef.current = true;
      onFocus?.();
    }
  };

  const previewWithOpaqueAndAlpha = (opaque: string, alphaPercent: number) =>
    combineOpaqueHexAndAlphaPercent(opaque, alphaPercent);

  const openNativePicker = () => {
    if (disabled) return;
    triggerFocus();
    sawWindowBlurDuringPickerRef.current = false;
    userDidChangeNativeRef.current = false;
    sessionOpaqueBaselineRef.current = displayOpaqueHex;
    sessionAlphaPercentRef.current = displayAlphaPercent;
    sessionRef.current = { active: true, finalized: false };
    sessionCommitTargetRef.current = styleCommitTargetRef.current;
    sessionFromHexRef.current = fullValue;
    lastPreviewHexRef.current = fullValue;
    setNativeSessionHex(displayOpaqueHex);
    setNativePickerOpen(true);
    queueMicrotask(() => {
      if (sessionRef.current.active && !sessionRef.current.finalized) {
        attachDismissListeners();
        nativeInputRef.current?.click();
      }
    });
  };

  const onNativeInputChange = (hex: string) => {
    if (!nativePickerOpen) return;
    if (hex.toLowerCase() === sessionOpaqueBaselineRef.current.toLowerCase()) return;
    userDidChangeNativeRef.current = true;
    setNativeSessionHex(hex);
    setHexRaw(hex);
    const combined = previewWithOpaqueAndAlpha(hex, sessionAlphaPercentRef.current);
    lastPreviewHexRef.current = combined;
    const previewEl = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
    onChange(combined, previewEl);
  };

  const hexInputProps = {
    value: editingHex ? hexRaw : displayOpaqueHex,
    disabled,
    maxLength: 7,
    spellCheck: false as const,
    onFocus: () => {
      triggerFocus();
      setEditingHex(true);
      setHexRaw(displayOpaqueHex);
      hexFieldBaselineRef.current = displayOpaqueHex.toLowerCase();
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setHexRaw(raw);
      if (isValidOpaqueHex(raw)) {
        onChange(
          previewWithOpaqueAndAlpha(raw, displayAlphaPercent),
          styleCommitTargetRef.current,
        );
      }
    },
    onBlur: () => {
      setEditingHex(false);
      const raw = hexRaw.trim();
      if (isValidOpaqueHex(raw)) {
        const combined = previewWithOpaqueAndAlpha(raw, displayAlphaPercent);
        if (raw.toLowerCase() !== hexFieldBaselineRef.current) {
          onCommitRef.current(combined, styleCommitTargetRef.current);
        }
      } else {
        setHexRaw(displayOpaqueHex);
      }
      didFocusRef.current = false;
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setEditingHex(false);
        if (isValidOpaqueHex(hexRaw.trim())) {
          const raw = hexRaw.trim();
          const combined = previewWithOpaqueAndAlpha(raw, displayAlphaPercent);
          if (raw.toLowerCase() !== hexFieldBaselineRef.current) {
            onCommitRef.current(combined, styleCommitTargetRef.current);
          }
        } else {
          setHexRaw(displayOpaqueHex);
        }
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setEditingHex(false);
        setHexRaw(displayOpaqueHex);
      }
    },
  };

  const alphaInputProps = {
    inputMode: "decimal" as const,
    value: editingAlpha ? alphaRaw : formatAlphaPercent(displayAlphaPercent),
    disabled,
    maxLength: 6,
    spellCheck: false as const,
    onFocus: () => {
      triggerFocus();
      setEditingAlpha(true);
      setAlphaRaw(formatAlphaPercent(displayAlphaPercent));
      alphaFieldBaselineRef.current = formatAlphaPercent(displayAlphaPercent);
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setAlphaRaw(raw);
      const pct = parseAlphaPercentInput(raw);
      if (pct != null) {
        onChange(
          previewWithOpaqueAndAlpha(displayOpaqueHex, pct),
          styleCommitTargetRef.current,
        );
      }
    },
    onBlur: () => {
      setEditingAlpha(false);
      const pct = parseAlphaPercentInput(alphaRaw);
      if (pct != null) {
        const combined = previewWithOpaqueAndAlpha(displayOpaqueHex, pct);
        if (formatAlphaPercent(pct) !== alphaFieldBaselineRef.current) {
          onCommitRef.current(combined, styleCommitTargetRef.current);
        }
      } else {
        setAlphaRaw(formatAlphaPercent(displayAlphaPercent));
      }
      didFocusRef.current = false;
    },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        setEditingAlpha(false);
        const pct = parseAlphaPercentInput(alphaRaw);
        if (pct != null) {
          const combined = previewWithOpaqueAndAlpha(displayOpaqueHex, pct);
          if (formatAlphaPercent(pct) !== alphaFieldBaselineRef.current) {
            onCommitRef.current(combined, styleCommitTargetRef.current);
          }
        } else {
          setAlphaRaw(formatAlphaPercent(displayAlphaPercent));
        }
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        setEditingAlpha(false);
        setAlphaRaw(formatAlphaPercent(displayAlphaPercent));
      }
    },
  };

  const nativeColorInput = (
    <input
      ref={nativeInputRef}
      type="color"
      className="wv-color-native wv-pe"
      value={nativeInputValue}
      disabled={disabled}
      onChange={(e) => onNativeInputChange(e.target.value)}
      onBlur={() => endNativePickerSession()}
    />
  );

  const swatchPx = variant === "card" ? 16 : 20;
  const swatchEl = (
    <div
      className={`wv-color-swatch wv-pe${variant === "card" ? " wv-color-swatch--card" : ""}`}
      style={swatchStyle(nativePickerOpen ? previewFullValue : fullValue, swatchPx)}
      onClick={openNativePicker}
    />
  );

  if (variant === "card") {
    return (
      <div
        ref={rowRef}
        className={`wv-color-card wv-pe${disabled ? " wv-color-card--disabled" : ""}`}
      >
        <div className="wv-color-card-row">
          <span className="wv-color-card-label">{cardLabel}</span>
          <div className="wv-color-card-value">
            <input type="text" className="wv-color-card-hex wv-pe" {...hexInputProps} />
            {swatchEl}
          </div>
        </div>
        <div className="wv-color-card-divider" aria-hidden />
        <div className="wv-color-card-row">
          <span className="wv-color-card-label">{opacityLabel}</span>
          <div className="wv-color-card-value">
            <input type="text" className="wv-color-card-alpha wv-pe" {...alphaInputProps} />
            <span className="wv-color-card-alpha-unit">%</span>
          </div>
        </div>
        {nativeColorInput}
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className={`wv-color-row wv-pe${disabled ? " wv-color-row--disabled" : ""}`}
    >
      <input type="text" className="wv-color-hex wv-pe" {...hexInputProps} />
      <div className="wv-color-alpha-wrap wv-pe">
        <input type="text" className="wv-color-alpha wv-pe" {...alphaInputProps} />
        <span className="wv-color-alpha-unit">%</span>
      </div>
      {swatchEl}
      {nativeColorInput}
    </div>
  );
}
