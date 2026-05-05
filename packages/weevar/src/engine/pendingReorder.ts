import { elementChildren } from "./elementChildren";

export type PendingReorder = {
  revert: () => void;
  disconnect: () => void;
};

/**
 * Applies DOM order for `desired` element children and re-applies if React mutates `parent`'s childList.
 */
export function createPendingReorder(
  parent: Element,
  desired: Element[],
): PendingReorder {
  const snapshot = Array.from(parent.childNodes);

  function currentElements(): Element[] {
    return elementChildren(parent);
  }

  function matches(): boolean {
    const cur = currentElements();
    if (cur.length !== desired.length) return false;
    return cur.every((el, i) => el === desired[i]);
  }

  function applyDesired(): void {
    for (const el of desired) parent.appendChild(el);
  }

  applyDesired();

  const observer = new MutationObserver(() => {
    if (!matches()) applyDesired();
  });
  observer.observe(parent, { childList: true });

  function revert(): void {
    observer.disconnect();
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    for (const n of snapshot) parent.appendChild(n);
  }

  return {
    disconnect: () => observer.disconnect(),
    revert,
  };
}
