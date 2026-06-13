export const WEEVAR_HOST_ID = "__weevar_host__";
export const WEEVAR_BOOT_DOT_CLASS = "__weevar_boot_dot__";

export function pointInDOMRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

export function domRectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function estimateCursorLabelWidth(text: string): number {
  return Math.min(210, Math.max(56, text.length * 7 + 20));
}

export type ViewportSize = { width: number; height: number };

/** Place a cursor-following hover label without overlapping blocked regions (e.g. open tray). */
export function placeCursorHoverLabel(
  x: number,
  y: number,
  text: string,
  avoid: DOMRect[],
  viewport: ViewportSize = { width: window.innerWidth, height: window.innerHeight },
): { left: number; top: number } | null {
  const height = 24;
  const width = estimateCursorLabelWidth(text);
  const margin = 6;
  const pad = 12;

  const candidates = [
    { left: x + pad, top: y - height - 2 },
    { left: x + pad, top: y + 16 },
    { left: x - width - pad, top: y - height - 2 },
    { left: x - width - pad, top: y + 16 },
    { left: x - width / 2, top: y - height - pad - 8 },
    { left: x - width / 2, top: y + pad + 8 },
  ];

  for (const c of candidates) {
    const left = Math.min(Math.max(margin, c.left), viewport.width - width - margin);
    const top = Math.min(Math.max(margin, c.top), viewport.height - height - margin);
    const rect = new DOMRect(left, top, width, height);
    if (!avoid.some((zone) => domRectsOverlap(rect, zone))) {
      return { left, top };
    }
  }
  return null;
}

export function isInsideWeevarOverlay(el: Node | null): boolean {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  const element = el as Element;
  const root = element.getRootNode();
  if (root instanceof ShadowRoot && root.host?.id === WEEVAR_HOST_ID) return true;
  if ((element as HTMLElement).id === WEEVAR_HOST_ID) return true;
  return false;
}

/** Deepest focused element (walks open shadow roots). */
export function getDeepActiveElement(): Element | null {
  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement as Element;
  }
  return active;
}

/**
 * If focus is inside Weevar chrome and the pointer is outside that node, blur so
 * e.g. EditTray inputs commit before pointerdown handlers call preventDefault.
 */
export function blurWeevarOverlayFocusIfPointerOutside(e: Pick<PointerEvent, "target">): void {
  const ae = getDeepActiveElement();
  if (!(ae instanceof HTMLElement)) return;
  if (!isInsideWeevarOverlay(ae)) return;
  const t = e.target;
  if (t instanceof Node && ae.contains(t)) return;
  ae.blur();
}

/** Topmost element under point that belongs to the host app (not Weevar chrome). */
export function hitTestHostPage(x: number, y: number): Element | null {
  const raw = document.elementFromPoint(x, y);
  if (!raw || isInsideWeevarOverlay(raw)) return null;
  if ((raw as HTMLElement).classList?.contains(WEEVAR_BOOT_DOT_CLASS)) return null;

  let cur: Element | null = raw;
  while (cur) {
    if (cur.id === WEEVAR_HOST_ID) return null;
    const parent = cur.parentElement;
    if (!parent && cur.parentNode instanceof ShadowRoot) {
      cur = (cur.parentNode as ShadowRoot).host;
      continue;
    }
    cur = parent;
  }
  return raw;
}

/**
 * Same as {@link hitTestHostPage}, but temporarily hides the Weevar host so
 * `elementFromPoint` can see nodes underneath the overlay during drag.
 */
export function hitTestHostPageUnderOverlay(x: number, y: number): Element | null {
  const host = document.getElementById(WEEVAR_HOST_ID) as HTMLElement | null;
  const prev = host?.style.visibility;
  if (host) host.style.visibility = "hidden";
  try {
    const raw = document.elementFromPoint(x, y);
    if (!raw || (raw as HTMLElement).classList?.contains(WEEVAR_BOOT_DOT_CLASS)) return null;
    if (isInsideWeevarOverlay(raw)) return null;

    let cur: Element | null = raw;
    while (cur) {
      if (cur.id === WEEVAR_HOST_ID) return null;
      const parent = cur.parentElement;
      if (!parent && cur.parentNode instanceof ShadowRoot) {
        cur = (cur.parentNode as ShadowRoot).host;
        continue;
      }
      cur = parent;
    }
    return raw;
  } finally {
    if (host) host.style.visibility = prev ?? "";
  }
}
