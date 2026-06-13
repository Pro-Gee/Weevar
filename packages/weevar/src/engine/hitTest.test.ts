import { describe, expect, it } from "vitest";
import { domRectsOverlap, placeCursorHoverLabel } from "./hitTest";

describe("placeCursorHoverLabel", () => {
  const viewport = { width: 1440, height: 900 };

  it("uses the default above-right placement when nothing blocks it", () => {
    const placement = placeCursorHoverLabel(400, 300, "p", [], viewport);
    expect(placement).toEqual({ left: 412, top: 274 });
  });

  it("flips left of the cursor when the default would overlap the tray", () => {
    const tray = new DOMRect(900, 100, 250, 800);
    const text = "div.playground-root";
    const placement = placeCursorHoverLabel(895, 400, text, [tray], viewport);
    expect(placement).not.toBeNull();
    const label = new DOMRect(placement!.left, placement!.top, 153, 24);
    expect(domRectsOverlap(label, tray)).toBe(false);
  });

  it("returns null when every candidate overlaps blocked regions", () => {
    const tray = new DOMRect(0, 0, 1440, 900);
    expect(placeCursorHoverLabel(720, 450, "div", [tray], viewport)).toBeNull();
  });
});
