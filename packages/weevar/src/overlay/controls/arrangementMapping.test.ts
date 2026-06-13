import { describe, expect, it } from "vitest";
import {
  arrangementCssFromVisual,
  findActiveArrangementIndex,
  visualFromArrangementCss,
} from "./arrangementMapping";

describe("arrangementMapping", () => {
  it("maps row top-left from flex-start / flex-start", () => {
    expect(findActiveArrangementIndex("flex-start", "flex-start", "row")).toBe(0);
  });

  it("maps row top-right from flex-end / flex-start", () => {
    expect(findActiveArrangementIndex("flex-end", "flex-start", "row")).toBe(2);
  });

  it("maps column top-right from flex-start / flex-end", () => {
    expect(findActiveArrangementIndex("flex-start", "flex-end", "column")).toBe(2);
  });

  it("maps row-reverse top-left from flex-end / flex-start", () => {
    expect(findActiveArrangementIndex("flex-end", "flex-start", "row-reverse")).toBe(0);
  });

  it("treats stretch align-items as flex-start for selection", () => {
    expect(findActiveArrangementIndex("flex-start", "stretch", "row")).toBe(0);
  });

  it("normalizes modern start/end keywords", () => {
    expect(findActiveArrangementIndex("start", "end", "row")).toBe(6);
  });

  it("round-trips visual positions through css for column", () => {
    const css = arrangementCssFromVisual("end", "start", "column");
    expect(visualFromArrangementCss(css.justifyContent, css.alignItems, "column")).toEqual({
      vx: "end",
      vy: "start",
    });
  });

  it("returns null when justify-content is not representable", () => {
    expect(findActiveArrangementIndex("space-between", "flex-start", "row")).toBeNull();
  });
});
