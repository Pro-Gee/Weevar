import { useEffect, useRef, useState } from "react";

type ColorPickerProps = {
  /** Current colour as a hex string e.g. "#ff0000". Always pass hex — use rgbToHex from styleEngine before passing. */
  value: string;
  /** Live preview; `styleTarget` keeps preview on the node that opened the native picker after selection moves. */
  onChange: (hex: string, styleTarget: Element) => void;
  /**
   * Called when a colour choice is finalized: once per native picker session when the OS modal
   * goes away for any reason (OK, outside click, focus elsewhere, tray unmount), or when the hex
   * field blurs / Enter. Dragging inside the system picker only updates preview via onChange.
   * `commitTarget` is the DOM node that received the edit (snapshotted when the native picker opens
   * so commits still attribute to that node after pointer selection moves to another element).
   * `fromSnapshotHex` is the tray colour when the native session started — use as the "from" baseline
   * so commits still log after preview (computed style on the target would otherwise match the new value).
   */
  onCommit: (hex: string, commitTarget: Element, fromSnapshotHex?: string) => void;
  /** Element whose styles this row edits (same as EditTray `element`). */
  styleCommitTarget: Element;
  /** When this value changes (e.g. EditTray `element` / new pointer selection), finalize any open native colour session. */
  selectionDismissSignal?: unknown;
  /** Called on first interaction so the parent can record the "from" value. */
  onFocus?: () => void;
  /** When true, swatch and hex field are inert (e.g. border style is "none"). */
  disabled?: boolean;
};

function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
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
}: ColorPickerProps) {
  const [hexRaw, setHexRaw] = useState(value);
  const [editingHex, setEditingHex] = useState(false);
  /** While true, the native `<input type="color">` is driven only by this state — not by `value` from the tray — so changing selection cannot push another element's colour through React into the picker. */
  const [nativePickerOpen, setNativePickerOpen] = useState(false);
  const [nativeSessionHex, setNativeSessionHex] = useState(() =>
    isValidHex(value) ? value : "#000000",
  );

  const rowRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const didFocusRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const styleCommitTargetRef = useRef(styleCommitTarget);
  styleCommitTargetRef.current = styleCommitTarget;
  /** Node that opened the native picker; used when selection moves before finalize. */
  const sessionCommitTargetRef = useRef<Element | null>(null);
  /** Colour at native session start (`safeValue` on swatch click) for commit diff vs live preview. */
  const sessionFromHexRef = useRef<string | null>(null);
  /** Hex when the text field gained focus — blur/Enter without change must not commit. */
  const hexFieldBaselineRef = useRef<string>("");

  const sessionRef = useRef<NativeSession>({ active: false, finalized: true });
  const lastPreviewHexRef = useRef("#000000");
  const sawWindowBlurDuringPickerRef = useRef(false);
  const removeDismissListenersRef = useRef<(() => void) | null>(null);
  const endNativePickerSessionRef = useRef<() => void>(() => {});

  const safeValue = isValidHex(value) ? value : "#000000";
  const nativeInputValue = nativePickerOpen ? nativeSessionHex : safeValue;

  useEffect(() => {
    if (nativePickerOpen || sessionRef.current.active) return;
    lastPreviewHexRef.current = safeValue;
  }, [safeValue, nativePickerOpen]);

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
    const el = nativeInputRef.current;
    let hex = lastPreviewHexRef.current;
    if (el?.value && isValidHex(el.value)) hex = el.value;
    if (!isValidHex(hex)) hex = "#000000";
    const target = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
    sessionCommitTargetRef.current = null;
    const fromSnap = sessionFromHexRef.current;
    sessionFromHexRef.current = null;
    if (fromSnap != null && hex.toLowerCase() === fromSnap.toLowerCase()) {
      setNativePickerOpen(false);
      didFocusRef.current = false;
      return;
    }
    onCommitRef.current(hex, target, fromSnap ?? undefined);
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

  // Sync display when value changes externally (e.g. undo)
  if (!editingHex && hexRaw !== value) setHexRaw(value);

  const triggerFocus = () => {
    if (!didFocusRef.current) {
      didFocusRef.current = true;
      onFocus?.();
    }
  };

  return (
    <div ref={rowRef} className={`wv-color-row wv-pe${disabled ? " wv-color-row--disabled" : ""}`}>
      {/* Colour swatch — clicking opens the native colour picker */}
      <div
        className="wv-color-swatch wv-pe"
        style={{ background: nativePickerOpen ? nativeSessionHex : safeValue }}
        onClick={() => {
          if (disabled) return;
          triggerFocus();
          sawWindowBlurDuringPickerRef.current = false;
          sessionRef.current = { active: true, finalized: false };
          sessionCommitTargetRef.current = styleCommitTargetRef.current;
          sessionFromHexRef.current = safeValue;
          lastPreviewHexRef.current = safeValue;
          setNativeSessionHex(safeValue);
          setNativePickerOpen(true);
          queueMicrotask(() => {
            if (sessionRef.current.active && !sessionRef.current.finalized) {
              attachDismissListeners();
              nativeInputRef.current?.click();
            }
          });
        }}
      />

      {/* Native colour input — while the OS modal is open, `value` is session-only (not tray `value`). */}
      <input
        ref={nativeInputRef}
        type="color"
        className="wv-color-native wv-pe"
        value={nativeInputValue}
        disabled={disabled}
        onChange={(e) => {
          if (!nativePickerOpen) return;
          const hex = e.target.value;
          setNativeSessionHex(hex);
          setHexRaw(hex);
          lastPreviewHexRef.current = hex;
          const previewEl = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
          onChange(hex, previewEl);
        }}
        onBlur={() => {
          endNativePickerSession();
        }}
      />

      {/* Hex text input — clicking lets the user type a hex value directly */}
      <input
        type="text"
        className="wv-color-hex wv-pe"
        value={editingHex ? hexRaw : value}
        disabled={disabled}
        onFocus={() => {
          triggerFocus();
          setEditingHex(true);
          setHexRaw(value);
          hexFieldBaselineRef.current = (isValidHex(value) ? value : safeValue).toLowerCase();
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setHexRaw(raw);
          if (isValidHex(raw)) {
            const previewEl = sessionCommitTargetRef.current ?? styleCommitTargetRef.current;
            onChange(raw, previewEl);
          }
        }}
        onBlur={(e) => {
          setEditingHex(false);
          const raw = e.target.value.trim();
          if (isValidHex(raw)) {
            if (raw.toLowerCase() !== hexFieldBaselineRef.current) {
              onCommitRef.current(raw, styleCommitTargetRef.current);
            }
          } else {
            setHexRaw(value); // revert invalid input
          }
          didFocusRef.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setEditingHex(false);
            if (isValidHex(hexRaw)) {
              if (hexRaw.trim().toLowerCase() !== hexFieldBaselineRef.current) {
                onCommitRef.current(hexRaw.trim(), styleCommitTargetRef.current);
              }
            } else {
              setHexRaw(value);
            }
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            setEditingHex(false);
            setHexRaw(value);
          }
        }}
        maxLength={7}
        spellCheck={false}
      />
    </div>
  );
}
