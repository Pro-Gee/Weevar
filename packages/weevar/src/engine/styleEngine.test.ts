import { beforeEach, describe, expect, it } from "vitest";
import {
  areStyleCommitValuesEquivalent,
  classifyElement,
  cssPaintValuesEqual,
  elementTypeLabel,
  readLineHeightAsPixelNumber,
  rgbToHex,
  supportsCssBackgroundColor,
  supportsCssTextColor,
  isTransparentPickerColor,
  combineOpaqueHexAndAlphaPercent,
} from "./styleEngine";

// Helper: create a DOM element with optional children and text
function el(
  tag: string,
  opts: {
    text?: string;
    children?: Element[];
    style?: string;
  } = {},
): Element {
  const e = document.createElement(tag);
  if (opts.style) e.setAttribute("style", opts.style);
  if (opts.text) e.appendChild(document.createTextNode(opts.text));
  if (opts.children) opts.children.forEach((c) => e.appendChild(c));
  document.body.appendChild(e);
  return e;
}

describe("classifyElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("classifies <svg> as svg", () => {
    expect(classifyElement(el("svg"))).toBe("svg");
  });

  it("classifies <img> as image", () => {
    expect(classifyElement(el("img"))).toBe("image");
  });

  it("classifies <p> as text", () => {
    expect(classifyElement(el("p", { text: "hello" }))).toBe("text");
  });

  it("classifies <button> as text", () => {
    expect(classifyElement(el("button", { text: "Click me" }))).toBe("text");
  });

  it("classifies <h1> as text", () => {
    expect(classifyElement(el("h1", { text: "Title" }))).toBe("text");
  });

  it("classifies <span> as text", () => {
    expect(classifyElement(el("span", { text: "word" }))).toBe("text");
  });

  it("classifies a <div> with direct text and no element children as text", () => {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode("just text"));
    document.body.appendChild(d);
    expect(classifyElement(d)).toBe("text");
  });

  it("classifies a <div> with 3 child elements as stack", () => {
    const children = [
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ];
    expect(classifyElement(el("div", { children }))).toBe("stack");
  });

  it("classifies a <div> with no children and no text as generic", () => {
    expect(classifyElement(el("div"))).toBe("generic");
  });

  it("classifies a <div> with one element child and no flex/grid as generic", () => {
    const child = document.createElement("span");
    expect(classifyElement(el("div", { children: [child] }))).toBe("generic");
  });
});

describe("elementTypeLabel", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("labels <p> as Paragraph", () => {
    expect(elementTypeLabel(el("p", { text: "hello" }), "text")).toBe("Paragraph");
  });

  it("labels <button> as Button", () => {
    expect(elementTypeLabel(el("button", { text: "Click" }), "text")).toBe("Button");
  });

  it("labels headings as Heading", () => {
    expect(elementTypeLabel(el("h1", { text: "Title" }), "text")).toBe("Heading");
    expect(elementTypeLabel(el("h2", { text: "Title" }), "text")).toBe("Heading");
  });

  it("labels stack and svg categories", () => {
    expect(elementTypeLabel(el("div"), "stack")).toBe("Stack");
    expect(elementTypeLabel(el("svg"), "svg")).toBe("SVG");
  });

  it("labels text-only div as Text", () => {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode("hello"));
    document.body.appendChild(d);
    expect(elementTypeLabel(d, "text")).toBe("Text");
  });
});

describe("supportsCssTextColor", () => {
  it("enables font colour for text, stack, and generic categories", () => {
    expect(supportsCssTextColor("text")).toBe(true);
    expect(supportsCssTextColor("stack")).toBe(true);
    expect(supportsCssTextColor("generic")).toBe(true);
  });

  it("disables font colour for svg and image categories", () => {
    expect(supportsCssTextColor("svg")).toBe(false);
    expect(supportsCssTextColor("image")).toBe(false);
  });
});

describe("supportsCssBackgroundColor", () => {
  it("enables background colour for text, stack, and generic categories", () => {
    expect(supportsCssBackgroundColor("text")).toBe(true);
    expect(supportsCssBackgroundColor("stack")).toBe(true);
    expect(supportsCssBackgroundColor("generic")).toBe(true);
  });

  it("disables background colour for svg and image categories", () => {
    expect(supportsCssBackgroundColor("svg")).toBe(false);
    expect(supportsCssBackgroundColor("image")).toBe(false);
  });
});

describe("isTransparentPickerColor", () => {
  it("detects fully transparent values", () => {
    expect(isTransparentPickerColor("transparent")).toBe(true);
    expect(isTransparentPickerColor("#00000000")).toBe(true);
    expect(isTransparentPickerColor("rgba(255, 255, 255, 0)")).toBe(true);
  });

  it("detects opaque values", () => {
    expect(isTransparentPickerColor("#ff0000")).toBe(false);
    expect(isTransparentPickerColor("#ff000080")).toBe(false);
  });
});

describe("combineOpaqueHexAndAlphaPercent", () => {
  it("returns 6-digit hex when opacity is 100%", () => {
    expect(combineOpaqueHexAndAlphaPercent("#ff0000", 100)).toBe("#ff0000");
  });

  it("returns 8-digit hex when opacity is below 100%", () => {
    expect(combineOpaqueHexAndAlphaPercent("#ff0000", 50)).toBe("#ff000080");
  });

  it("returns transparent hex when opacity is 0%", () => {
    expect(combineOpaqueHexAndAlphaPercent("#ffffff", 0)).toBe("#ffffff00");
  });
});

describe("rgbToHex", () => {
  it("converts rgb() to hex", () => {
    expect(rgbToHex("rgb(255, 0, 0)")).toBe("#ff0000");
  });

  it("converts rgba() with partial alpha to 8-digit hex", () => {
    expect(rgbToHex("rgba(0, 0, 0, 0.8)")).toBe("#000000cc");
  });

  it("returns hex strings as-is", () => {
    expect(rgbToHex("#abc123")).toBe("#abc123");
  });

  it("returns #00000000 for transparent", () => {
    expect(rgbToHex("transparent")).toBe("#00000000");
  });

  it("preserves zero alpha on white rgba (not opaque white)", () => {
    expect(rgbToHex("rgba(255, 255, 255, 0)")).toBe("#ffffff00");
  });

  it("returns #000000 for empty string", () => {
    expect(rgbToHex("")).toBe("#000000");
  });

  it("converts rgb with spaces correctly", () => {
    expect(rgbToHex("rgb(16, 32, 64)")).toBe("#102040");
  });

  it("pads single-digit hex values", () => {
    expect(rgbToHex("rgb(0, 0, 15)")).toBe("#00000f");
  });

  it("reads 8-digit hex with alpha", () => {
    expect(rgbToHex("#ff000080")).toBe("#ff000080");
  });
});

describe("readLineHeightAsPixelNumber", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("maps unitless multiplier to px (font-size × multiplier)", () => {
    const p = el("p", { text: "x", style: "font-size: 20px; line-height: 1.5" });
    expect(readLineHeightAsPixelNumber(p)).toBe(30);
  });

  it("maps authored percentage to px", () => {
    const p = el("p", { text: "x", style: "font-size: 20px; line-height: 140%" });
    expect(readLineHeightAsPixelNumber(p)).toBe(28);
  });

  it("reads authored px line-height", () => {
    const p = el("p", { text: "x", style: "font-size: 20px; line-height: 30px" });
    expect(readLineHeightAsPixelNumber(p)).toBe(30);
  });
});

describe("areStyleCommitValuesEquivalent", () => {
  it("treats matching hex case variants as equal for colour props", () => {
    expect(areStyleCommitValuesEquivalent("color", "#aa00ff", "#AA00FF")).toBe(true);
  });

  it("treats rgb and hex as equal for colour props", () => {
    expect(areStyleCommitValuesEquivalent("color", "#ff0000", "rgb(255, 0, 0)")).toBe(true);
  });

  it("treats transparent and rgba(0,0,0,0) as equal", () => {
    expect(
      areStyleCommitValuesEquivalent("background-color", "transparent", "rgba(0, 0, 0, 0)"),
    ).toBe(true);
  });

  it("treats equivalent px lengths as equal", () => {
    expect(areStyleCommitValuesEquivalent("font-size", "18px", "18.0px")).toBe(true);
  });

  it("treats equivalent percentages as equal", () => {
    expect(areStyleCommitValuesEquivalent("line-height", "150%", "150.0%")).toBe(true);
  });

  it("treats equivalent opacity as equal", () => {
    expect(areStyleCommitValuesEquivalent("opacity", "1", "1.0")).toBe(true);
  });

  it("treats font-weight keywords as equal to numbers", () => {
    expect(areStyleCommitValuesEquivalent("font-weight", "700", "bold")).toBe(true);
  });

  it("distinguishes different colours", () => {
    expect(areStyleCommitValuesEquivalent("color", "#00ff00", "#ff0000")).toBe(false);
  });
});

describe("cssPaintValuesEqual", () => {
  it("treats rgb and hex as equal", () => {
    expect(cssPaintValuesEqual("rgb(255, 0, 0)", "#ff0000")).toBe(true);
  });

  it("treats hex case variants as equal", () => {
    expect(cssPaintValuesEqual("#Aa00Ff", "#aa00ff")).toBe(true);
  });

  it("distinguishes different colours", () => {
    expect(cssPaintValuesEqual("#00ff00", "#ff0000")).toBe(false);
  });
});
