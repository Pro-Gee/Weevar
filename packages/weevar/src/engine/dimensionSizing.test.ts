import { describe, expect, it } from "vitest";
import { readDimensionSizingMode } from "./dimensionSizing";

function el(style: Record<string, string>): HTMLElement {
  const node = document.createElement("div");
  for (const [prop, value] of Object.entries(style)) {
    node.style.setProperty(prop, value);
  }
  return node;
}

describe("readDimensionSizingMode", () => {
  it("detects fill from 100% inline width", () => {
    expect(readDimensionSizingMode(el({ width: "100%" }), "width")).toBe("fill");
  });

  it("detects hug from auto inline height", () => {
    expect(readDimensionSizingMode(el({ height: "auto" }), "height")).toBe("hug");
  });

  it("detects fixed from px inline width", () => {
    expect(readDimensionSizingMode(el({ width: "240px" }), "width")).toBe("fixed");
  });

  it("defaults to hug when inline sizing is unset", () => {
    expect(readDimensionSizingMode(el({}), "width")).toBe("hug");
  });
});
