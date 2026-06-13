export type ArrangementAxis = "flex-start" | "center" | "flex-end";
export type VisualAxis = "start" | "center" | "end";

/** Screen-relative visual positions for each 3×3 cell (left→right, top→bottom). */
export const ARRANGEMENT_VISUAL_GRID: Array<[VisualAxis, VisualAxis]> = [
  ["start", "start"], ["center", "start"], ["end", "start"],
  ["start", "center"], ["center", "center"], ["end", "center"],
  ["start", "end"], ["center", "end"], ["end", "end"],
];

/** Map computed CSS alignment keywords to grid axis values. */
export function normalizeArrangementAxis(raw: string): ArrangementAxis | null {
  const v = raw.trim().toLowerCase();
  if (v === "flex-start" || v === "start" || v === "left") return "flex-start";
  if (v === "center") return "center";
  if (v === "flex-end" || v === "end" || v === "right") return "flex-end";
  // Stretch / baseline have no grid cell — treat as start on the cross axis.
  if (
    v === "stretch" ||
    v === "normal" ||
    v === "baseline" ||
    v === "first baseline" ||
    v === "last baseline" ||
    v === "self-start" ||
    v === "self-end"
  ) {
    return "flex-start";
  }
  return null;
}

function flipVisual(axis: VisualAxis): VisualAxis {
  if (axis === "start") return "end";
  if (axis === "end") return "start";
  return "center";
}

function toVisualAxis(value: ArrangementAxis): VisualAxis {
  if (value === "flex-start") return "start";
  if (value === "flex-end") return "end";
  return "center";
}

function fromVisualAxis(axis: VisualAxis): ArrangementAxis {
  if (axis === "start") return "flex-start";
  if (axis === "end") return "flex-end";
  return "center";
}

/** Convert current layout CSS to a screen-relative visual position. */
export function visualFromArrangementCss(
  justifyContent: string,
  alignItems: string,
  flexDirection: string,
): { vx: VisualAxis; vy: VisualAxis } | null {
  const justify = normalizeArrangementAxis(justifyContent);
  const align = normalizeArrangementAxis(alignItems);
  if (!justify || !align) return null;

  const isColumn = flexDirection.includes("column");
  const isReverse = flexDirection.includes("reverse");

  if (!isColumn) {
    let vx = toVisualAxis(justify);
    const vy = toVisualAxis(align);
    if (isReverse) vx = flipVisual(vx);
    return { vx, vy };
  }

  let vy = toVisualAxis(justify);
  const vx = toVisualAxis(align);
  if (isReverse) vy = flipVisual(vy);
  return { vx, vy };
}

/** Convert a screen-relative visual position back to justify / align CSS. */
export function arrangementCssFromVisual(
  vx: VisualAxis,
  vy: VisualAxis,
  flexDirection: string,
): { justifyContent: ArrangementAxis; alignItems: ArrangementAxis } {
  const isColumn = flexDirection.includes("column");
  const isReverse = flexDirection.includes("reverse");

  if (!isColumn) {
    let j = vx;
    const a = vy;
    if (isReverse) j = flipVisual(j);
    return { justifyContent: fromVisualAxis(j), alignItems: fromVisualAxis(a) };
  }

  let j = vy;
  const a = vx;
  if (isReverse) j = flipVisual(j);
  return { justifyContent: fromVisualAxis(j), alignItems: fromVisualAxis(a) };
}

/** Index of the grid cell matching the element's current arrangement, if any. */
export function findActiveArrangementIndex(
  justifyContent: string,
  alignItems: string,
  flexDirection: string,
): number | null {
  const visual = visualFromArrangementCss(justifyContent, alignItems, flexDirection);
  if (!visual) return null;

  const index = ARRANGEMENT_VISUAL_GRID.findIndex(
    ([vx, vy]) => vx === visual.vx && vy === visual.vy,
  );
  return index >= 0 ? index : null;
}
