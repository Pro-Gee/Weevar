import { getFiberFromDOM } from "./fiber";

/** Heuristic: React has mounted (fiber on #root or its first child — dev builds). */
export function isLikelyReactHydrated(): boolean {
  const root = document.getElementById("root");
  if (!root) return true;
  if (getFiberFromDOM(root)) return true;
  const first = root.firstElementChild;
  return first ? Boolean(getFiberFromDOM(first)) : false;
}

export async function waitForReactHydration(timeoutMs = 5000): Promise<void> {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    if (isLikelyReactHydrated()) return;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
}
