import { elementChildren } from "./elementChildren";

function isVisible(el: Element): boolean {
  const r = el.getClientRects();
  if (!r || r.length === 0) return false;
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0)
    return false;
  return true;
}

export function isValidDropContainer(candidate: Element, dragged: Element): boolean {
  if (!(candidate instanceof Element)) return false;
  if (candidate === dragged) return false;
  if (dragged.contains(candidate)) return false;
  if (!isVisible(candidate)) return false;

  const cs = getComputedStyle(candidate);
  if (cs.display === "contents") return false;

  const d = cs.display;
  const isLayout =
    d === "flex" ||
    d === "inline-flex" ||
    d === "grid" ||
    d === "inline-grid" ||
    d === "block" ||
    d === "inline-block";

  if (!isLayout) return false;

  return true;
}

/** Walk from hit target upward to find a valid drop parent for `dragged`. */
export function findDropParent(hit: Element | null, dragged: Element): Element | null {
  let cur: Element | null = hit;
  while (cur && cur !== document.body) {
    if (isValidDropContainer(cur, dragged)) return cur;
    cur = cur.parentElement;
  }
  return null;
}
