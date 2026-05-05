import { elementChildren } from "./elementChildren";

export function reorderImmutable<T>(arr: readonly T[], from: number, to: number): T[] {
  const a = arr.slice() as T[];
  const [item] = a.splice(from, 1);
  a.splice(to, 0, item!);
  return a;
}

/**
 * Insertion index for `dragged` into `parent` (0..n). If `dragged` is not yet a child of `parent`,
 * append index is `elementChildren(parent).length`.
 */
export function computeDropIndex(
  parent: Element,
  dragged: Element,
  clientX: number,
  clientY: number,
): number {
  const kids = elementChildren(parent);
  const inParent = kids.includes(dragged);
  const others = inParent ? kids.filter((k) => k !== dragged) : kids.slice();

  if (others.length === 0) return 0;

  const cs = getComputedStyle(parent);
  const flexDir = cs.flexDirection || "row";
  const isRowAxis =
    cs.display.includes("flex") &&
    (flexDir === "row" || flexDir === "row-reverse");
  const pos = isRowAxis ? clientX : clientY;

  let insert = others.length;
  for (let i = 0; i < others.length; i++) {
    const r = others[i]!.getBoundingClientRect();
    const mid = isRowAxis ? r.left + r.width / 2 : r.top + r.height / 2;
    if (pos < mid) {
      insert = i;
      break;
    }
  }

  if (insert >= others.length) {
    return inParent ? kids.length - 1 : kids.length;
  }

  const anchor = others[insert]!;
  return kids.indexOf(anchor);
}

/** @deprecated use computeDropIndex */
export function computeReorderDomIndex(
  parent: Element,
  dragged: Element,
  clientX: number,
  clientY: number,
): number {
  return computeDropIndex(parent, dragged, clientX, clientY);
}

/** Element order after moving `dragged` to `targetIndex` within the same parent. */
export function orderAfterMove(
  parent: Element,
  dragged: Element,
  targetIndex: number,
): Element[] {
  const kids = elementChildren(parent);
  const from = kids.indexOf(dragged);
  if (from === -1) return kids;
  let to = targetIndex;
  if (to < 0) to = 0;
  if (to > kids.length - 1) to = kids.length - 1;
  return reorderImmutable(kids, from, to);
}

/** Order after inserting `dragged` into `parent` at `targetIndex` (possibly from another parent). */
export function orderAfterInsert(
  parent: Element,
  dragged: Element,
  targetIndex: number,
): Element[] {
  const cur = elementChildren(parent).filter((k) => k !== dragged);
  const next = cur.slice();
  let i = Math.min(Math.max(0, targetIndex), next.length);
  next.splice(i, 0, dragged);
  return next;
}

export function parentSupportsFlexOrderPreview(parent: Element): boolean {
  return getComputedStyle(parent).display.includes("flex");
}
