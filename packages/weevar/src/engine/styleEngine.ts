import { elementChildren } from "./elementChildren";
import type { ElementCategory } from "./layoutTypes";

/**
 * Classify a DOM element into one of the V2 edit categories.
 *
 * Priority order:
 * 1. <svg> or element inside an SVG → "svg"
 * 2. <img> → "image"
 * 3. Known text tag, OR element with direct text content and no element children → "text"
 * 4. Element with multiple element children, OR flex/grid container → "stack"
 * 5. Everything else → "generic"
 */
export function classifyElement(el: Element): ElementCategory {
  const tag = el.tagName.toLowerCase();

  if (tag === "svg") return "svg";
  if (tag === "img") return "image";
  if (el.closest?.("svg")) return "svg";

  const kids = elementChildren(el);

  const hasDirectText = Array.from(el.childNodes).some(
    (n) =>
      n.nodeType === Node.TEXT_NODE &&
      (n.textContent ?? "").trim().length > 0,
  );

  const TEXT_TAGS = new Set([
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "span", "a", "label", "small", "strong", "em", "b", "i",
    "li", "blockquote", "code", "pre", "button",
    "input", "textarea", "td", "th", "caption",
    "figcaption", "dt", "dd", "legend", "summary",
  ]);

  if (TEXT_TAGS.has(tag)) return "text";
  if (hasDirectText && kids.length === 0) return "text";

  if (kids.length > 1) return "stack";

  const cs = getComputedStyle(el);
  if (cs.display.includes("flex") || cs.display.includes("grid")) return "stack";

  return "generic";
}

/**
 * Read a CSS property value from an element.
 * Prefers the element's own inline style if set; falls back to computed style.
 */
export function readPropertyValue(el: Element, cssProperty: string): string {
  const hel = el as HTMLElement;
  const inline = hel.style?.getPropertyValue(cssProperty);
  if (inline && inline !== "") return inline;
  return getComputedStyle(el).getPropertyValue(cssProperty).trim();
}

/**
 * Used line height in pixels for numeric UI (commits as e.g. `24px`).
 * Handles `%`, `px`, unitless multipliers, and computed used heights.
 */
export function readLineHeightAsPixelNumber(el: Element): number {
  const hel = el as HTMLElement;
  const inline = hel.style?.getPropertyValue("line-height")?.trim() ?? "";
  const cs = getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize) || 16;

  const roundPx = (px: number): number => Math.round(px * 10) / 10;

  const parsePxString = (s: string): number | null => {
    const m = s.trim().match(/^([\d.]+)\s*px$/i);
    if (!m) return null;
    const px = parseFloat(m[1]);
    return Number.isFinite(px) ? px : null;
  };

  const raw = inline !== "" ? inline : readPropertyValue(el, "line-height").trim();
  const low = raw.toLowerCase();

  if (!raw || low === "normal") {
    const fromPx = parsePxString(cs.lineHeight.trim());
    if (fromPx != null && fromPx > 0) return roundPx(fromPx);
    const n = parseFloat(cs.lineHeight);
    if (Number.isFinite(n) && n > 0) return roundPx(n);
    return roundPx(fontSize * 1.2);
  }

  if (/%\s*$/.test(raw)) {
    const pct = parseFloat(raw);
    if (Number.isFinite(pct)) return roundPx((fontSize * pct) / 100);
    return roundPx(fontSize * 1.2);
  }

  if (/px\s*$/i.test(raw)) {
    const px = parsePxString(raw);
    if (px != null) return roundPx(px);
  }

  const n = parseFloat(raw);
  if (Number.isFinite(n) && !/%\s*$/.test(raw) && !/px\s*$/i.test(raw)) {
    return roundPx(fontSize * n);
  }

  const fallback = parsePxString(cs.lineHeight.trim()) ?? parseFloat(cs.lineHeight);
  if (Number.isFinite(fallback) && fallback > 0) return roundPx(fallback);
  return roundPx(fontSize * 1.2);
}

/** Map font-weight to a comparable numeric string (e.g. bold → 700). */
export function normalizeFontWeightValue(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "" || t === "normal") return "400";
  if (t === "bold" || t === "bolder") return "700";
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? String(n) : t;
}

/**
 * Convert an RGB or RGBA string from getComputedStyle into a hex colour string.
 * Alpha channel is stripped. If the value is already hex or a named colour, returned as-is.
 *
 * Examples:
 *   "rgb(255, 0, 0)"     → "#ff0000"
 *   "rgba(0, 0, 0, 0.8)" → "#000000"
 *   "#abc123"            → "#abc123"
 *   "transparent"        → "#000000"
 */
export function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "none") return "#000000";
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return rgb;
  const r = parseInt(m[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(m[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(m[3], 10).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

const CSS_PAINT_PROPERTIES = new Set<string>([
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "fill",
  "stroke",
  "caret-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
]);

export function cssPaintProperty(cssProperty: string): boolean {
  return CSS_PAINT_PROPERTIES.has(cssProperty);
}

/** True when two colour strings denote the same sRGB colour (hex vs rgb(), etc.). */
export function cssPaintValuesEqual(a: string, b: string): boolean {
  const A = rgbToHex(a.trim());
  const B = rgbToHex(b.trim());
  if (A.startsWith("#") && B.startsWith("#")) return A.toLowerCase() === B.toLowerCase();
  return A === B;
}

/**
 * True when committed `toValue` is not a meaningful change from `fromValue` for history
 * (exact match after trim, same paint, same font-weight, same opacity, or same px/% length).
 */
export function areStyleCommitValuesEquivalent(
  cssProperty: string,
  fromValue: string,
  toValue: string,
): boolean {
  const a = fromValue.trim();
  const b = toValue.trim();
  if (a === b) return true;
  if (cssProperty === "font-weight") {
    return normalizeFontWeightValue(a) === normalizeFontWeightValue(b);
  }
  if (cssPaintProperty(cssProperty)) {
    return cssPaintValuesEqual(a, b);
  }
  if (cssProperty === "opacity") {
    const fa = parseFloat(a);
    const fb = parseFloat(b);
    return Number.isFinite(fa) && Number.isFinite(fb) && Math.abs(fa - fb) < 1e-9;
  }
  const pxA = a.match(/^([\d.]+)\s*px$/i);
  const pxB = b.match(/^([\d.]+)\s*px$/i);
  if (pxA && pxB) {
    return Math.abs(parseFloat(pxA[1]) - parseFloat(pxB[1])) < 1e-4;
  }
  const pctA = a.match(/^([\d.]+)\s*%$/);
  const pctB = b.match(/^([\d.]+)\s*%$/);
  if (pctA && pctB) {
    return Math.abs(parseFloat(pctA[1]) - parseFloat(pctB[1])) < 1e-4;
  }
  return false;
}

/**
 * Read computed margin or padding values from an element.
 * Returns parsed pixel values as numbers (no unit string).
 */
export function readBoxValues(
  el: Element,
  property: "margin" | "padding",
): { top: number; right: number; bottom: number; left: number } {
  const cs = getComputedStyle(el);
  return {
    top:    parseFloat(cs.getPropertyValue(`${property}-top`))    || 0,
    right:  parseFloat(cs.getPropertyValue(`${property}-right`))  || 0,
    bottom: parseFloat(cs.getPropertyValue(`${property}-bottom`)) || 0,
    left:   parseFloat(cs.getPropertyValue(`${property}-left`))   || 0,
  };
}

/**
 * Read border shorthand values from computed style.
 * Returns width in px (number), style string, and colour as hex.
 */
export function readBorderValues(
  el: Element,
): { width: number; style: string; color: string } {
  const cs = getComputedStyle(el);
  return {
    width: parseFloat(cs.borderWidth) || 0,
    style: cs.borderStyle || "none",
    color: rgbToHex(cs.borderColor || "#000000"),
  };
}

/**
 * Read individual border-radius corner values in pixels.
 */
export function readRadiusValues(
  el: Element,
): { tl: number; tr: number; br: number; bl: number } {
  const cs = getComputedStyle(el);
  return {
    tl: parseFloat(cs.borderTopLeftRadius)     || 0,
    tr: parseFloat(cs.borderTopRightRadius)    || 0,
    br: parseFloat(cs.borderBottomRightRadius) || 0,
    bl: parseFloat(cs.borderBottomLeftRadius)  || 0,
  };
}
