import { buildElementIdentity } from "./identity";
import { readLayoutType } from "./layoutTypeFromParent";
import type { LayoutChange } from "./layoutTypes";

export function buildReorderLayoutChange(
  parent: Element,
  dragged: Element,
  fromIndex: number,
  toIndex: number,
  orderedElements: Element[],
): LayoutChange {
  const siblings = orderedElements.map((el) => buildElementIdentity(el));
  return {
    kind: "reorder",
    target: buildElementIdentity(dragged),
    parent: buildElementIdentity(parent),
    fromIndex,
    toIndex,
    siblings,
    layoutType: readLayoutType(parent),
  };
}
