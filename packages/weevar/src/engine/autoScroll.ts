/** TRD §6: scroll nearest scrollable ancestor when cursor is within 60px of edge. */
export function autoScrollForPoint(clientX: number, clientY: number): void {
  const margin = 60;
  const el = document.elementFromPoint(clientX, clientY) as Element | null;
  if (!el) return;

  const sc = findNearestScrollable(el);
  if (!sc) return;

  const r = sc.getBoundingClientRect();
  let dsx = 0;
  let dsy = 0;

  const left = clientX - r.left;
  const right = r.right - clientX;
  const top = clientY - r.top;
  const bottom = r.bottom - clientY;

  if (left < margin && left >= 0) dsx = -((margin - left) * 0.5);
  if (right < margin && right >= 0) dsx = (margin - right) * 0.5;
  if (top < margin && top >= 0) dsy = -((margin - top) * 0.5);
  if (bottom < margin && bottom >= 0) dsy = (margin - bottom) * 0.5;

  if (dsx !== 0) sc.scrollLeft += dsx;
  if (dsy !== 0) sc.scrollTop += dsy;
}

function findNearestScrollable(start: Element): HTMLElement | null {
  let cur: Element | null = start;
  while (cur && cur !== document.documentElement) {
    if (cur instanceof HTMLElement) {
      const cs = getComputedStyle(cur);
      const oy = cs.overflowY;
      const ox = cs.overflowX;
      const canY =
        (oy === "auto" || oy === "scroll" || oy === "overlay") &&
        cur.scrollHeight > cur.clientHeight + 1;
      const canX =
        (ox === "auto" || ox === "scroll" || ox === "overlay") &&
        cur.scrollWidth > cur.clientWidth + 1;
      if (canY || canX) return cur;
    }
    cur = cur.parentElement;
  }
  const root = document.documentElement;
  if (root.scrollHeight > root.clientHeight + 1 || root.scrollWidth > root.clientWidth + 1)
    return root;
  return null;
}
