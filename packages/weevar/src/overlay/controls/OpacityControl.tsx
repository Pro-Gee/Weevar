import { useRef } from "react";

const round2 = (n: number) => Math.round(n * 100) / 100;

type OpacityControlProps = {
  /** CSS opacity value: 0.0 to 1.0 */
  value: number;
  /** Called live during scrub drag. */
  onChange: (value: number) => void;
  /** Called when the user releases the scrub. */
  onCommit: (value: number) => void;
  /** Called on pointer-down to let the parent record the "from" value. */
  onFocus?: () => void;
};

export function OpacityControl({ value, onChange, onCommit, onFocus }: OpacityControlProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const getValueFromEvent = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    onFocus?.();
    onChange(round2(getValueFromEvent(e.clientX)));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    onChange(round2(getValueFromEvent(e.clientX)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onCommit(round2(getValueFromEvent(e.clientX)));
  };

  const pct = Math.round(value * 100);

  return (
    <div className="wv-opacity-row wv-pe">
      <span className="wv-prop-label">Opacity</span>
      <div
        ref={trackRef}
        className="wv-opacity-track wv-pe"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="wv-opacity-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="wv-opacity-value">{pct}%</span>
    </div>
  );
}
