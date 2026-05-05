export function layoutTypeLabel(parent: Element): string {
  const cs = getComputedStyle(parent);
  const d = cs.display;
  if (d === "flex" || d === "inline-flex")
    return `flex-${cs.flexDirection || "row"}`;
  if (d === "grid" || d === "inline-grid") return "grid";
  if (d === "block") return "block";
  return d || "flow";
}

export function buildAncestorPath(el: Element, maxDepth = 8): string {
  const segments: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (cur && cur !== document.documentElement && depth < maxDepth) {
    segments.unshift(shortElementLabel(cur));
    cur = cur.parentElement;
    depth++;
  }
  return segments.join(" › ");
}

function shortElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const cl = (el as HTMLElement).classList;
  if (!cl?.length) return tag;
  const first = cl[0];
  if (!first) return tag;
  if (first.length > 20) return `${tag}.${first.slice(0, 17)}…`;
  return `${tag}.${first}`;
}
