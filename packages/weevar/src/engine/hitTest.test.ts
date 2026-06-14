import { describe, expect, it } from "vitest";
import {
  domRectsOverlap,
  getDeepActiveElement,
  isEditableElement,
  placeCursorHoverLabel,
  setWeevarClosedShadowRoot,
  shouldIgnoreWeevarShortcut,
  WEEVAR_HOST_ID,
} from "./hitTest";

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

describe("shouldIgnoreWeevarShortcut", () => {
  it("ignores shortcuts when focus is inside closed Weevar shadow DOM", () => {
    const host = document.createElement("div");
    host.id = WEEVAR_HOST_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "closed" });
    setWeevarClosedShadowRoot(shadow);
    const input = document.createElement("input");
    shadow.appendChild(input);
    input.focus();

    expect(document.activeElement).toBe(host);
    expect(getDeepActiveElement()).toBe(input);
    expect(isEditableElement(getDeepActiveElement())).toBe(true);

    const event = new KeyboardEvent("keydown", { key: "w", bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: host });
    expect(shouldIgnoreWeevarShortcut(event)).toBe(true);

    setWeevarClosedShadowRoot(null);
    host.remove();
  });
});
