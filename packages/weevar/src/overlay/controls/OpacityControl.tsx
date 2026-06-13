import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { formatNumberMax2, roundTo2 } from "../../engine/roundNumber";

const THUMB_WIDTH = 2;
const THUMB_INSET = 4;
const TICK_COUNT = 8;

type OpacityControlProps = {
  /** CSS opacity value: 0.0 to 1.0 */
  value: number;
  /** Called live during scrub drag. */
  onChange: (value: number) => void;
  /** Called when the user releases the scrub. */
  onCommit: (value: number) => void;
  /** Called on focus so the parent can record the "from" value. */
  onFocus?: () => void;
  /** Called on Escape so the parent can revert live preview. */
  onCancel?: () => void;
};

type TickClip = {
  left: number;
  right: number;
};

function rectsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aEnd > bStart && aStart < bEnd;
}

function OpacityTickLines({
  variant,
  clipPath,
}: {
  variant: "dim" | "bright";
  clipPath?: string;
}) {
  return (
    <div
      className={`wv-opacity-card-ticks wv-opacity-card-ticks--${variant}`}
      style={clipPath ? { clipPath } : undefined}
      aria-hidden
    >
      <span className="wv-opacity-card-tick-spacer" />
      {Array.from({ length: TICK_COUNT }, (_, index) => (
        <Fragment key={index}>
          <span className="wv-opacity-card-tick" />
          <span className="wv-opacity-card-tick-spacer" />
        </Fragment>
      ))}
    </div>
  );
}

function parsePercentInput(input: string): number | null {
  const n = parseFloat(input.replace(/%/g, "").trim());
  if (!Number.isFinite(n)) return null;
  return roundTo2(Math.max(0, Math.min(100, n)));
}

function percentToOpacity(pct: number): number {
  return roundTo2(pct / 100);
}

export function OpacityControl({
  value,
  onChange,
  onCommit,
  onFocus,
  onCancel,
}: OpacityControlProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueWrapRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const [tickClip, setTickClip] = useState<TickClip>({ left: 0, right: 0 });
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbDimmed, setThumbDimmed] = useState(false);

  const pct = Math.round(value * 100);
  const interactive = isHovered || isDragging;
  const fillPct = pct;

  useEffect(() => {
    if (!editing) setRaw(formatNumberMax2(pct));
  }, [pct, editing]);

  const getValueFromEvent = (clientX: number): number => {
    const card = cardRef.current;
    if (!card) return value;
    const rect = card.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const updateLayout = useCallback(() => {
    const card = cardRef.current;
    const fillEl = fillRef.current;
    const labelEl = labelRef.current;
    const valueEl = valueWrapRef.current;
    if (!card || !fillEl) return;

    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width;
    if (cardWidth <= 0) return;

    const fillRect = fillEl.getBoundingClientRect();
    const fillPx = fillRect.right - cardRect.left;
    const labelEndPx = labelEl
      ? labelEl.getBoundingClientRect().right - cardRect.left
      : 0;

    setTickClip({
      left: Math.max(0, labelEndPx),
      right: 0,
    });

    const thumbStart = fillPx - THUMB_INSET - THUMB_WIDTH;
    const thumbEnd = fillPx - THUMB_INSET;
    setThumbLeft(Math.max(0, thumbStart));

    let overlapsText = false;
    if (labelEl) {
      const labelRect = labelEl.getBoundingClientRect();
      const labelStart = labelRect.left - cardRect.left;
      const labelEnd = labelRect.right - cardRect.left;
      overlapsText = overlapsText || rectsOverlap(thumbStart, thumbEnd, labelStart, labelEnd);
    }
    if (valueEl) {
      const valueRect = valueEl.getBoundingClientRect();
      const valueStartPx = valueRect.left - cardRect.left;
      const valueEnd = valueRect.right - cardRect.left;
      overlapsText = overlapsText || rectsOverlap(thumbStart, thumbEnd, valueStartPx, valueEnd);
    }
    setThumbDimmed(overlapsText);
  }, [fillPct]);

  useLayoutEffect(() => {
    updateLayout();
    const card = cardRef.current;
    if (!card) return;

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    }

    const observer = new ResizeObserver(updateLayout);
    observer.observe(card);
    if (fillRef.current) observer.observe(fillRef.current);
    if (labelRef.current) observer.observe(labelRef.current);
    if (valueWrapRef.current) observer.observe(valueWrapRef.current);

    return () => observer.disconnect();
  }, [updateLayout, pct, interactive, editing]);

  const commitInput = (inputRaw: string) => {
    setEditing(false);
    const parsedPct = parsePercentInput(inputRaw);
    if (parsedPct === null) {
      setRaw(formatNumberMax2(pct));
      return;
    }
    onCommit(percentToOpacity(parsedPct));
  };

  const handleValueFocus = (e: FocusEvent<HTMLInputElement>) => {
    onFocus?.();
    setEditing(true);
    setRaw(formatNumberMax2(pct));
    e.target.select();
  };

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
    const parsedPct = parsePercentInput(e.target.value);
    if (parsedPct !== null) onChange(percentToOpacity(parsedPct));
  };

  const handleValueKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      commitInput(raw);
    }
    if (e.key === "Escape") {
      onCancel?.();
      setRaw(formatNumberMax2(pct));
      setEditing(false);
      e.currentTarget.blur();
    }
  };

  const handleValuePointerDown = (e: PointerEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    if (e.target instanceof HTMLElement && e.target.closest(".wv-opacity-card-value-wrap")) {
      return;
    }
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    onFocus?.();
    onChange(roundTo2(getValueFromEvent(e.clientX)));
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    onChange(roundTo2(getValueFromEvent(e.clientX)));
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    onCommit(roundTo2(getValueFromEvent(e.clientX)));
  };

  const brightTickClip =
    tickClip.left > 0 ? `inset(0 0px 0 ${tickClip.left}px)` : undefined;

  return (
    <div
      ref={cardRef}
      className={`wv-opacity-card wv-pe${interactive ? " wv-opacity-card--interactive" : ""}${editing ? " wv-opacity-card--editing-value" : ""}`}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {interactive && (
        <>
          <OpacityTickLines variant="dim" />
          <OpacityTickLines variant="bright" clipPath={brightTickClip} />
        </>
      )}
      <div
        ref={fillRef}
        className="wv-opacity-card-fill"
        style={{ width: `${fillPct}%` }}
        aria-hidden
      />
      {interactive && (
        <div
          className={`wv-opacity-card-thumb${thumbDimmed ? " wv-opacity-card-thumb--dim" : ""}`}
          style={{ left: `${thumbLeft}px` }}
          aria-hidden
        />
      )}
      <div className="wv-opacity-card-content">
        <span ref={labelRef} className="wv-opacity-card-label">
          Opacity
        </span>
        <div ref={valueWrapRef} className="wv-opacity-card-value-wrap wv-pe">
          <input
            type="text"
            inputMode="decimal"
            className="wv-opacity-card-value-input wv-pe"
            value={editing ? raw : formatNumberMax2(pct)}
            aria-label="Opacity"
            onFocus={handleValueFocus}
            onChange={handleValueChange}
            onBlur={(e) => commitInput(e.target.value)}
            onKeyDown={handleValueKeyDown}
            onPointerDown={handleValuePointerDown}
          />
          <span className="wv-opacity-card-value-unit" aria-hidden>
            %
          </span>
        </div>
      </div>
    </div>
  );
}
