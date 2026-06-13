import { directTextContent, isTextLikeTag } from "./elementText";
import { getDomLabel } from "./domLabel";
import { elementChildren } from "./elementChildren";
import {
  buildFiberPath,
  elementRendersViaPortalHost,
  getNearestHostComponentName,
} from "./fiber";
import type { DomPathSegment, ElementIdentity } from "./layoutTypes";
import { parseDataWvSource } from "./parseDataWvSource";

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

function domPathFromBody(el: Element): DomPathSegment[] {
  const chain: Element[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    chain.push(cur);
    cur = cur.parentElement;
  }
  chain.reverse();
  return chain.map((node) => {
    const parent = node.parentElement;
    const idx =
      parent && node !== document.body ? elementChildren(parent).indexOf(node) : 0;
    const classes = (node as HTMLElement).classList
      ? Array.from((node as HTMLElement).classList)
      : [];
    return {
      tag: node.tagName.toLowerCase(),
      index: Math.max(0, idx),
      classes: classes.slice(0, 4),
    };
  });
}

export function buildElementIdentity(el: Element): ElementIdentity {
  const classes = (el as HTMLElement).classList
    ? Array.from((el as HTMLElement).classList)
    : [];
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").trim().slice(0, 120);
  const directText = directTextContent(el);
  const childElementCount = elementChildren(el).length;
  const textLike = isTextLikeTag(tag);
  const labelText = textLike ? directText || (childElementCount === 0 ? text : "") : "";
  const textSnippet = labelText ? labelText.slice(0, 30) : undefined;
  const fiberPath = buildFiberPath(el);
  const debugFromFiber = [...fiberPath].reverse().find((s) => s.source)?.source;
  const fromAttr = parseDataWvSource(el);
  const source = fromAttr ?? debugFromFiber;
  const testId = el.getAttribute("data-testid") ?? undefined;
  const componentName = getNearestHostComponentName(el);
  const inPortal = elementRendersViaPortalHost(el);

  return {
    fiberPath: fiberPath.length ? fiberPath : undefined,
    source,
    domPath: domPathFromBody(el),
    tag,
    classList: classes,
    contentHash: simpleHash(text),
    textSnippet,
    childElementCount: childElementCount > 0 ? childElementCount : undefined,
    label: componentName ? `<${componentName}>` : getDomLabel(el),
    componentName,
    testId,
    inPortal,
  };
}
