import { buildElementIdentity } from "./identity";
import { readLayoutType } from "./layoutTypeFromParent";
import type { LayoutChangeMove } from "./layoutTypes";

export function buildMoveLayoutChange(
  dragged: Element,
  fromParent: Element,
  toParent: Element,
  fromIndex: number,
  toIndex: number,
  orderedInTarget: Element[],
): LayoutChangeMove {
  return {
    kind: "move",
    target: buildElementIdentity(dragged),
    fromParent: buildElementIdentity(fromParent),
    toParent: buildElementIdentity(toParent),
    fromIndex,
    toIndex,
    siblings: orderedInTarget.map((el) => buildElementIdentity(el)),
    fromLayoutType: readLayoutType(fromParent),
    toLayoutType: readLayoutType(toParent),
  };
}
