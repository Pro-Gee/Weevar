import { describe, expect, it } from "vitest";
import { computeSpacingSegments } from "./elementSpacing";

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("computeSpacingSegments", () => {
  it("returns vertical and horizontal segments when target is below-right", () => {
    const from = rect(0, 0, 100, 50);
    const to = rect(200, 132, 80, 40);
    const segments = computeSpacingSegments(from, to);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ axis: "vertical", distance: 82, x1: 100 });
    expect(segments[1]).toMatchObject({ axis: "horizontal", distance: 100, y1: 132 });
  });

  it("returns a single vertical segment when horizontally overlapping", () => {
    const from = rect(0, 0, 100, 50);
    const to = rect(20, 80, 60, 40);
    const segments = computeSpacingSegments(from, to);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ axis: "vertical", distance: 30 });
  });

  it("returns a single horizontal segment when vertically overlapping", () => {
    const from = rect(0, 0, 100, 50);
    const to = rect(140, 10, 60, 30);
    const segments = computeSpacingSegments(from, to);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ axis: "horizontal", distance: 40 });
  });

  it("returns nothing when rects overlap on both axes", () => {
    const from = rect(0, 0, 100, 100);
    const to = rect(20, 20, 40, 40);
    expect(computeSpacingSegments(from, to)).toEqual([]);
  });
});
