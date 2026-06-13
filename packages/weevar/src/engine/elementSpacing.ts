export type SpacingSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  axis: "horizontal" | "vertical";
};

function horizontalGap(a: DOMRect, b: DOMRect): number {
  if (b.left >= a.right) return b.left - a.right;
  if (a.left >= b.right) return a.left - b.right;
  return 0;
}

function verticalGap(a: DOMRect, b: DOMRect): number {
  if (b.top >= a.bottom) return b.top - a.bottom;
  if (a.top >= b.bottom) return a.top - b.bottom;
  return 0;
}

function overlapCenter(a0: number, a1: number, b0: number, b1: number): number {
  const start = Math.max(a0, b0);
  const end = Math.min(a1, b1);
  return (start + end) / 2;
}

function verticalSegment(x: number, y1: number, y2: number): SpacingSegment {
  const top = Math.min(y1, y2);
  const bottom = Math.max(y1, y2);
  return {
    x1: x,
    y1: top,
    x2: x,
    y2: bottom,
    distance: bottom - top,
    axis: "vertical",
  };
}

function horizontalSegment(x1: number, x2: number, y: number): SpacingSegment {
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  return {
    x1: left,
    y1: y,
    x2: right,
    y2: y,
    distance: right - left,
    axis: "horizontal",
  };
}

/** Figma-style spacing guides between two axis-aligned bounding boxes. */
export function computeSpacingSegments(from: DOMRect, to: DOMRect): SpacingSegment[] {
  const dx = horizontalGap(from, to);
  const dy = verticalGap(from, to);
  if (dx === 0 && dy === 0) return [];

  const toBelow = to.top >= from.bottom;
  const toAbove = from.top >= to.bottom;
  const toRight = to.left >= from.right;
  const toLeft = from.left >= to.right;

  if (dx > 0 && dy > 0) {
    if (toBelow && toRight) {
      return [
        verticalSegment(from.right, from.bottom, to.top),
        horizontalSegment(from.right, to.left, to.top),
      ];
    }
    if (toBelow && toLeft) {
      return [
        verticalSegment(from.left, from.bottom, to.top),
        horizontalSegment(to.right, from.left, to.top),
      ];
    }
    if (toAbove && toRight) {
      return [
        verticalSegment(from.right, to.bottom, from.top),
        horizontalSegment(from.right, to.left, to.bottom),
      ];
    }
    if (toAbove && toLeft) {
      return [
        verticalSegment(from.left, to.bottom, from.top),
        horizontalSegment(to.right, from.left, to.bottom),
      ];
    }
  }

  if (dy > 0) {
    const x = overlapCenter(from.left, from.right, to.left, to.right);
    if (toBelow) return [verticalSegment(x, from.bottom, to.top)];
    if (toAbove) return [verticalSegment(x, to.bottom, from.top)];
  }

  if (dx > 0) {
    const y = overlapCenter(from.top, from.bottom, to.top, to.bottom);
    if (toRight) return [horizontalSegment(from.right, to.left, y)];
    if (toLeft) return [horizontalSegment(to.right, from.left, y)];
  }

  return [];
}
