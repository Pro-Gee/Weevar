import { elementChildren } from "./elementChildren";
import type { PendingReorder } from "./pendingReorder";

export function createPendingCrossMove(
  dragged: Element,
  fromParent: Element,
  toParent: Element,
  desiredToOrder: Element[],
): PendingReorder {
  const snapFrom = Array.from(fromParent.childNodes);
  const snapTo = Array.from(toParent.childNodes);

  function matchesTo(): boolean {
    const cur = elementChildren(toParent);
    if (cur.length !== desiredToOrder.length) return false;
    return cur.every((el, i) => el === desiredToOrder[i]);
  }

  function applyTo(): void {
    for (const el of desiredToOrder) toParent.appendChild(el);
  }

  applyTo();

  const obs = new MutationObserver(() => {
    if (!matchesTo()) applyTo();
  });
  obs.observe(toParent, { childList: true });
  if (fromParent !== toParent) obs.observe(fromParent, { childList: true });

  function revert(): void {
    obs.disconnect();
    while (fromParent.firstChild) fromParent.removeChild(fromParent.firstChild);
    for (const n of snapFrom) fromParent.appendChild(n);
    if (toParent !== fromParent) {
      while (toParent.firstChild) toParent.removeChild(toParent.firstChild);
      for (const n of snapTo) toParent.appendChild(n);
    }
  }

  return {
    disconnect: () => obs.disconnect(),
    revert,
  };
}
