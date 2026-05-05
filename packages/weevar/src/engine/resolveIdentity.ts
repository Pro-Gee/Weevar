import { elementChildren } from "./elementChildren";
import { buildFiberPath } from "./fiber";
import type { ElementIdentity } from "./layoutTypes";
import { parseDataWvSource } from "./parseDataWvSource";

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

function resolveDomPath(identity: ElementIdentity): Element | null {
  let cur: Element | null = document.body;
  for (const seg of identity.domPath) {
    if (!cur) return null;
    const kids = elementChildren(cur);
    const next = kids[seg.index];
    if (!next || next.tagName.toLowerCase() !== seg.tag) return null;
    cur = next;
  }
  return cur;
}

function resolveBySource(identity: ElementIdentity): Element | null {
  if (!identity.source) return null;
  const nodes = document.querySelectorAll("[data-wv-source]");
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i] as Element;
    const loc = parseDataWvSource(el);
    if (
      loc &&
      loc.file === identity.source.file &&
      loc.line === identity.source.line &&
      loc.col === identity.source.col
    )
      return el;
  }
  return null;
}

function resolveByFiberPathFingerprint(identity: ElementIdentity): Element | null {
  if (!identity.fiberPath?.length) return null;
  const want = JSON.stringify(identity.fiberPath);
  const max = 6000;
  let seen = 0;
  const tree = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let n = tree.nextNode() as Element | null;
  while (n && seen < max) {
    seen++;
    try {
      const p = buildFiberPath(n);
      if (!p.length) {
        n = tree.nextNode() as Element | null;
        continue;
      }
      if (JSON.stringify(p) !== want) {
        n = tree.nextNode() as Element | null;
        continue;
      }
      if (n.tagName.toLowerCase() === identity.tag && matchesIdentity(n, identity)) return n;
    } catch {
      /* ignore fiber read errors */
    }
    n = tree.nextNode() as Element | null;
  }
  return null;
}

function resolveByContentScan(identity: ElementIdentity): Element | null {
  const tag = identity.tag.toUpperCase();
  const want = identity.contentHash;
  const max = 4000;
  let seen = 0;
  const walk = (root: Element) => {
    const stack: Element[] = [root];
    while (stack.length && seen < max) {
      const el = stack.pop()!;
      seen++;
      if (el.tagName !== tag) {
        for (let i = el.children.length - 1; i >= 0; i--)
          stack.push(el.children[i] as Element);
        continue;
      }
      const text = (el.textContent ?? "").trim().slice(0, 120);
      if (simpleHash(text) !== want) {
        for (let i = el.children.length - 1; i >= 0; i--)
          stack.push(el.children[i] as Element);
        continue;
      }
      const cl = (el as HTMLElement).classList;
      const cls = cl ? Array.from(cl) : [];
      if (identity.classList.length && cls.join(" ") !== identity.classList.join(" ")) {
        for (let i = el.children.length - 1; i >= 0; i--)
          stack.push(el.children[i] as Element);
        continue;
      }
      return el;
    }
    return null;
  };
  return walk(document.body);
}

/**
 * TRD §5 resolution order: fiber path fingerprint → source attribute → DOM path → content scan.
 */
export function resolveElementIdentity(identity: ElementIdentity): Element | null {
  const byFiber = resolveByFiberPathFingerprint(identity);
  if (byFiber) return byFiber;

  const bySource = resolveBySource(identity);
  if (bySource && matchesIdentity(bySource, identity)) return bySource;

  const byDom = resolveDomPath(identity);
  if (byDom && matchesIdentity(byDom, identity)) return byDom;

  return resolveByContentScan(identity);
}

function matchesIdentity(el: Element, identity: ElementIdentity): boolean {
  if (el.tagName.toLowerCase() !== identity.tag) return false;
  const text = (el.textContent ?? "").trim().slice(0, 120);
  if (simpleHash(text) !== identity.contentHash) return false;
  return true;
}
