import { useMemo } from "react";
import { computeSpacingSegments } from "../engine/elementSpacing";

type SpacingMeasureOverlayProps = {
  from: DOMRect;
  to: DOMRect;
};

export function SpacingMeasureOverlay({ from, to }: SpacingMeasureOverlayProps) {
  const segments = useMemo(() => computeSpacingSegments(from, to), [from, to]);

  if (!segments.length) return null;

  return (
    <div className="wv-spacing-measure" aria-hidden>
      {segments.map((segment, index) => {
        const labelX = (segment.x1 + segment.x2) / 2;
        const labelY = (segment.y1 + segment.y2) / 2;
        const distance = Math.round(segment.distance);

        if (segment.axis === "horizontal") {
          const left = Math.min(segment.x1, segment.x2);
          const width = Math.abs(segment.x2 - segment.x1);
          return (
            <div key={`${segment.axis}-${index}`}>
              <div
                className="wv-spacing-line wv-spacing-line--horizontal"
                style={{ left, top: segment.y1, width }}
              />
              <div className="wv-spacing-label" style={{ left: labelX, top: labelY }}>
                {distance}
              </div>
            </div>
          );
        }

        const top = Math.min(segment.y1, segment.y2);
        const height = Math.abs(segment.y2 - segment.y1);
        return (
          <div key={`${segment.axis}-${index}`}>
            <div
              className="wv-spacing-line wv-spacing-line--vertical"
              style={{ left: segment.x1, top, height }}
            />
            <div className="wv-spacing-label" style={{ left: labelX, top: labelY }}>
              {distance}
            </div>
          </div>
        );
      })}
    </div>
  );
}
