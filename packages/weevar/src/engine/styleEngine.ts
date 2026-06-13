import { elementChildren } from "./elementChildren";
import type { ElementCategory } from "./layoutTypes";
import { roundTo2 } from "./roundNumber";

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

/** Whether the edit tray should offer the CSS `color` property (Style → Font Colour). */
export function supportsCssTextColor(category: ElementCategory): boolean {
  return category === "text" || category === "stack" || category === "generic";
}

/** Whether the edit tray should offer `background-color` in the Box section. */
export function supportsCssBackgroundColor(category: ElementCategory): boolean {
  return category === "text" || category === "stack" || category === "generic";
}

const TEXT_TYPE_LABELS: Record<string, string> = {
  p: "Paragraph",
  h1: "Heading",
  h2: "Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  h6: "Heading",
  button: "Button",
  span: "Text",
  a: "Link",
  label: "Label",
  small: "Text",
  strong: "Text",
  em: "Text",
  b: "Text",
  i: "Text",
  li: "List item",
  blockquote: "Quote",
  code: "Code",
  pre: "Preformatted",
  input: "Input",
  textarea: "Text area",
  td: "Table cell",
  th: "Table header",
  caption: "Caption",
  figcaption: "Caption",
  dt: "Definition term",
  dd: "Definition",
  legend: "Legend",
  summary: "Summary",
};

const GENERIC_TYPE_LABELS: Record<string, string> = {
  div: "Div",
  section: "Section",
  article: "Article",
  nav: "Navigation",
  header: "Header",
  footer: "Footer",
  main: "Main",
  aside: "Aside",
  ul: "List",
  ol: "List",
  form: "Form",
  video: "Video",
  audio: "Audio",
  canvas: "Canvas",
};

/** Human-readable element type for the edit tray header. */
export function elementTypeLabel(el: Element, category: ElementCategory): string {
  const tag = el.tagName.toLowerCase();

  if (category === "svg") return "SVG";
  if (category === "image") return "Image";
  if (category === "stack") return "Stack";

  if (TEXT_TYPE_LABELS[tag]) return TEXT_TYPE_LABELS[tag];
  if (category === "text") return "Text";

  if (GENERIC_TYPE_LABELS[tag]) return GENERIC_TYPE_LABELS[tag];
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

/** Root `<svg>` for SVG category edits (selected node or nearest SVG ancestor). */
export function resolveSvgRoot(el: Element): SVGSVGElement | null {
  if (el instanceof SVGSVGElement) return el;
  return el.closest("svg");
}

function parseSvgLengthPx(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const px = trimmed.match(/^([\d.]+)\s*px$/i);
  if (px) {
    const n = parseFloat(px[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const n = parseFloat(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Raw width/height on the SVG root (attribute, then inline/computed CSS). */
export function readSvgDimensionRaw(el: Element, prop: "width" | "height"): string {
  const svg = resolveSvgRoot(el);
  if (!svg) return "";
  const attr = svg.getAttribute(prop);
  if (attr && attr.trim() !== "") return attr.trim();
  return readPropertyValue(svg, prop);
}

/** Display size of the SVG root in pixels. */
export function readSvgDimension(el: Element, prop: "width" | "height"): number {
  const svg = resolveSvgRoot(el);
  if (!svg) return 0;

  const fromRaw = parseSvgLengthPx(readSvgDimensionRaw(el, prop));
  if (fromRaw != null) return roundTo2(fromRaw);

  const rect = svg.getBoundingClientRect();
  const px = prop === "width" ? rect.width : rect.height;
  return roundTo2(px);
}

/** Apply width/height to the SVG root (attribute + inline style). */
export function applySvgDimension(
  el: Element,
  prop: "width" | "height",
  value: string,
): void {
  const svg = resolveSvgRoot(el);
  if (!svg) return;

  const trimmed = value.trim();
  if (trimmed === "") {
    svg.removeAttribute(prop);
    (svg as unknown as HTMLElement).style.removeProperty(prop);
    return;
  }

  const pxStr = /px$/i.test(trimmed) ? trimmed : `${trimmed}px`;
  svg.setAttribute(prop, pxStr);
  (svg as unknown as HTMLElement).style.setProperty(prop, pxStr);
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

  const roundPx = (px: number): number => roundTo2(px);

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

export type ParsedCssColor = { r: number; g: number; b: number; alpha: number };

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function expandShortHex(hex: string): string {
  if (hex.length === 3 || hex.length === 4) {
    return hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return hex;
}

/** Parse rgb()/rgba()/hex CSS colour strings (no named colours). */
export function parseCssColor(raw: string): ParsedCssColor | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t === "transparent" || t === "none") return { r: 0, g: 0, b: 0, alpha: 0 };

  const rgba = t.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgba) {
    const alphaRaw = rgba[4] != null ? parseFloat(rgba[4]) : 1;
    return {
      r: clamp255(parseFloat(rgba[1])),
      g: clamp255(parseFloat(rgba[2])),
      b: clamp255(parseFloat(rgba[3])),
      alpha: Number.isFinite(alphaRaw) ? Math.max(0, Math.min(1, alphaRaw)) : 1,
    };
  }

  const hex = t.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = expandShortHex(hex[1].toLowerCase());
    if (h.length === 6) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        alpha: 1,
      };
    }
    if (h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        alpha: parseInt(h.slice(6, 8), 16) / 255,
      };
    }
  }
  return null;
}

/** Normalise any browser-supported CSS colour to sRGB + alpha (canvas fallback for hsl, etc.). */
export function normalizeCssColor(raw: string): ParsedCssColor | null {
  const direct = parseCssColor(raw);
  if (direct) return direct;
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = raw.trim();
    return parseCssColor(ctx.fillStyle);
  } catch {
    return null;
  }
}

/** Hex for tray display: `#rrggbb` opaque, `#rrggbbaa` when alpha &lt; 1. */
export function formatCssColorHex(parsed: ParsedCssColor): string {
  const rr = parsed.r.toString(16).padStart(2, "0");
  const gg = parsed.g.toString(16).padStart(2, "0");
  const bb = parsed.b.toString(16).padStart(2, "0");
  if (parsed.alpha <= 0) return `#${rr}${gg}${bb}00`;
  if (parsed.alpha >= 1 - 1 / 255) return `#${rr}${gg}${bb}`;
  const aa = Math.round(parsed.alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${rr}${gg}${bb}${aa}`;
}

export function opaqueCssColorHex(parsed: ParsedCssColor): string {
  const rr = parsed.r.toString(16).padStart(2, "0");
  const gg = parsed.g.toString(16).padStart(2, "0");
  const bb = parsed.b.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export function parsePickerColorValue(value: string): ParsedCssColor {
  return normalizeCssColor(value) ?? { r: 0, g: 0, b: 0, alpha: 1 };
}

export function isTransparentPickerColor(value: string): boolean {
  return parsePickerColorValue(value).alpha <= 0;
}

/** Alpha as 0–100 for tray opacity field (2 decimal places). */
export function alphaPercentFromPickerColor(value: string): number {
  const { alpha } = parsePickerColorValue(value);
  return Math.round(alpha * 10000) / 100;
}

export function opaqueHexFromPickerColor(value: string): string {
  return opaqueCssColorHex(parsePickerColorValue(value));
}

/** Merge 6-digit hex with an opacity percentage into `#rrggbb` or `#rrggbbaa`. */
export function combineOpaqueHexAndAlphaPercent(opaqueHex: string, alphaPercent: number): string {
  const rgb = parsePickerColorValue(opaqueHex);
  const pct = Math.max(0, Math.min(100, alphaPercent));
  return formatCssColorHex({ r: rgb.r, g: rgb.g, b: rgb.b, alpha: pct / 100 });
}

/** Read a colour property from an element for ColorPicker (`#rrggbb` or `#rrggbbaa`). */
export function readCssColorForPicker(el: Element, cssProperty: string): string {
  const parsed = normalizeCssColor(readPropertyValue(el, cssProperty));
  if (!parsed) return "#000000";
  return formatCssColorHex(parsed);
}

/**
 * Convert an RGB or RGBA string from getComputedStyle into a hex colour string.
 * Preserves alpha as `#rrggbbaa` when alpha &lt; 1; fully transparent → `#00000000`.
 */
export function rgbToHex(rgb: string): string {
  const parsed = normalizeCssColor(rgb);
  if (!parsed) {
    const t = rgb.trim();
    if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(t)) return t.toLowerCase();
    return "#000000";
  }
  return formatCssColorHex(parsed);
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
  const A = normalizeCssColor(a.trim());
  const B = normalizeCssColor(b.trim());
  if (A && B) {
    return (
      A.r === B.r &&
      A.g === B.g &&
      A.b === B.b &&
      Math.abs(A.alpha - B.alpha) < 1 / 255
    );
  }
  return rgbToHex(a.trim()).toLowerCase() === rgbToHex(b.trim()).toLowerCase();
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
    color: readCssColorForPicker(el, "border-color"),
  };
}

/** Per-side border widths in pixels (from computed style). */
export function readBorderWidthValues(
  el: Element,
): { top: number; right: number; bottom: number; left: number } {
  const cs = getComputedStyle(el);
  return {
    top: parseFloat(cs.borderTopWidth) || 0,
    right: parseFloat(cs.borderRightWidth) || 0,
    bottom: parseFloat(cs.borderBottomWidth) || 0,
    left: parseFloat(cs.borderLeftWidth) || 0,
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
