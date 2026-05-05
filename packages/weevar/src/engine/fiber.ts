/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * React Fiber access is internal and may break across React versions (TRD §5).
 * Supports React 17–19 style keys on DOM nodes.
 */

export type FiberNode = any;

export function getFiberFromDOM(node: Element): FiberNode | null {
  const key = Object.keys(node).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  return key ? (node as any)[key] ?? null : null;
}

function getTypeName(type: unknown): string | undefined {
  if (typeof type === "string") return type;
  if (typeof type === "function") return type.name || "Anonymous";
  if (typeof type === "object" && type && "displayName" in type) {
    return String((type as { displayName?: string }).displayName || "");
  }
  if (typeof type === "symbol") return type.toString();
  return undefined;
}

function readDebugSource(fiber: FiberNode): { file: string; line: number; col: number } | undefined {
  const s = fiber?._debugSource;
  if (!s) return undefined;
  return {
    file: String(s.fileName ?? s.file ?? ""),
    line: Number(s.lineNumber ?? s.line ?? 0),
    col: Number(s.columnNumber ?? s.column ?? 0),
  };
}

/** Meaningful component/host tags along the return chain (best-effort). */
const TAG_HOST_PORTAL = 4;
const TAG_HOST_COMPONENT = 5;
const TAG_FUNCTION_COMPONENT = 0;
const TAG_CLASS_COMPONENT = 1;
const TAG_MEMO = 14;
const TAG_FORWARD_REF = 11;
const TAG_SIMPLE_MEMO = 15;

function isSegmentFiber(fiber: FiberNode): boolean {
  const t = fiber?.tag;
  return (
    t === TAG_HOST_COMPONENT ||
    t === TAG_FUNCTION_COMPONENT ||
    t === TAG_CLASS_COMPONENT ||
    t === TAG_MEMO ||
    t === TAG_FORWARD_REF ||
    t === TAG_SIMPLE_MEMO
  );
}

export function buildFiberPath(el: Element): import("./layoutTypes").FiberPathSegment[] {
  const out: import("./layoutTypes").FiberPathSegment[] = [];
  let fiber = getFiberFromDOM(el);
  if (!fiber) return out;

  const stack: import("./layoutTypes").FiberPathSegment[] = [];
  let cur: FiberNode | null = fiber;
  while (cur) {
    if (isSegmentFiber(cur)) {
      const name = getTypeName(cur.type);
      const source = readDebugSource(cur);
      stack.push({
        componentName: name,
        key: cur.key ?? null,
        index: typeof cur.index === "number" ? cur.index : 0,
        source,
      });
    }
    cur = cur.return;
  }
  stack.reverse();
  return stack;
}

/** True if this DOM node’s fiber chain includes a React host portal (TRD portal hint). */
export function elementRendersViaPortalHost(el: Element): boolean {
  let fiber = getFiberFromDOM(el);
  if (!fiber) return false;
  let cur: FiberNode | null = fiber;
  while (cur) {
    if (cur.tag === TAG_HOST_PORTAL) return true;
    cur = cur.return;
  }
  return false;
}

export function getNearestHostComponentName(el: Element): string | undefined {
  const path = buildFiberPath(el);
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i]?.componentName;
    if (n && n !== "Fragment" && /^[A-Z]/.test(n)) return n;
  }
  return path[path.length - 1]?.componentName;
}
