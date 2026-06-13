export type DimensionSizingMode = "fixed" | "fill" | "hug";

const HUG_VALUES = new Set(["auto", "fit-content", "max-content", "min-content"]);

export function readDimensionSizingMode(
  el: Element,
  prop: "width" | "height",
): DimensionSizingMode {
  const hel = el as HTMLElement;
  const inline = hel.style.getPropertyValue(prop).trim().toLowerCase();
  if (inline === "100%") return "fill";
  if (HUG_VALUES.has(inline)) return "hug";
  if (inline !== "") return "fixed";
  return "hug";
}

export function dimensionSizingCssValue(mode: "fill" | "hug"): string {
  return mode === "fill" ? "100%" : "auto";
}

export function dimensionSizingLabel(mode: DimensionSizingMode): string {
  if (mode === "fill") return "Fill";
  if (mode === "hug") return "Hug";
  return "";
}
