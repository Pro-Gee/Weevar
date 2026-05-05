import type { LayoutType } from "./layoutTypes";

export function readLayoutType(parent: Element): LayoutType {
  const cs = getComputedStyle(parent);
  return {
    display: cs.display,
    flexDirection: cs.flexDirection || undefined,
  };
}
