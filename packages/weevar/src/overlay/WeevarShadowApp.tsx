import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { pushPauseHostAnimations } from "../engine/animationPause";
import { autoScrollForPoint } from "../engine/autoScroll";
import {
  WEEVAR_BOOT_DOT_CLASS,
  blurWeevarOverlayFocusIfPointerOutside,
  hitTestHostPage,
  isInsideWeevarOverlay,
  placeCursorHoverLabel,
  pointInDOMRect,
  shouldIgnoreWeevarShortcut,
} from "../engine/hitTest";
import { buildAncestorPath } from "../engine/layoutContext";
import { buildReorderLayoutChange } from "../engine/layoutChangeFromReorder";
import { buildMoveLayoutChange } from "../engine/layoutChangeMove";
import { findDropParent } from "../engine/dropTargets";
import { buildElementIdentity } from "../engine/identity";
import type {
  BatchedChange,
  ElementIdentity,
  GeneratedPrompt,
  MoveSession,
  PromptLength,
  StyleTweak,
  TargetTool,
  WeevarChange,
  WeevarRuntimeConfig,
} from "../engine/layoutTypes";
import { elementChildren } from "../engine/elementChildren";
import { FlexOrderPreview } from "../engine/flexOrderPreview";
import { insertionBarBetween } from "../engine/insertionBar";
import { createPendingCrossMove } from "../engine/pendingMove";
import { createPendingReorder, type PendingReorder } from "../engine/pendingReorder";
import { promptBody } from "../engine/prompts";
import { generateBatchedPrompt } from "../prompts/generateBatched";
import {
  computeDropIndex,
  orderAfterInsert,
  orderAfterMove,
  parentSupportsFlexOrderPreview,
} from "../engine/reorderTarget";
import { resolveElementIdentity } from "../engine/resolveIdentity";
import {
  classifyElement,
  areStyleCommitValuesEquivalent,
  cssPaintProperty,
  cssPaintValuesEqual,
  readBorderValues,
} from "../engine/styleEngine";
import { weevarVersionLabel } from "../version";
import { EditTray } from "./EditTray";
import { OVERLAY_CSS } from "./overlayStyles";
import { PromptPanel } from "./PromptPanel";
import { SpacingMeasureOverlay } from "./SpacingMeasureOverlay";

type FrameRects = { hover: DOMRect | null; selected: DOMRect | null };

type DragBar = { left: number; top: number; width: number; height: number };

function sameDragBar(a: DragBar | null, b: DragBar | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

function sameDropZoneRect(a: DOMRect | null, b: DOMRect | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

type DragSession = {
  dragged: Element;
  sourceParent: Element;
  fromIndex: number;
  dropParent: Element;
  dropIndex: number;
  preview: FlexOrderPreview;
  resumeAnimations: () => void;
  prevOpacity: string;
  pointerId: number;
  ghostEl: HTMLElement | null;
  grabOffsetX: number;
  grabOffsetY: number;
};

type PanelState = {
  change: WeevarChange;
  prompt: GeneratedPrompt;
  len: PromptLength;
  tool: TargetTool;
  copyFlash: boolean;
  mode?: "single" | "batched";
};

type BadgeRender = {
  ordinal: number;
  displayOrdinal: number;
  rect: DOMRect;
};

type PointerSelectionInfo = {
  path: string;
};

type RuntimeChangeRefs = {
  target: Element;
  fromParent: Element;
  toParent: Element;
};

const POINTER_CURSOR_DATA_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.80294 4.62999L15.8359 6.98999C19.3159 8.35199 21.0559 9.03299 20.9989 10.113C20.9409 11.193 19.1249 11.689 15.4929 12.679C14.4119 12.974 13.8709 13.121 13.4959 13.496C13.1209 13.871 12.9739 14.412 12.6789 15.493C11.6889 19.125 11.1929 20.941 10.1129 20.999C9.03294 21.057 8.35294 19.316 6.99094 15.836L4.62994 9.80299C3.20394 6.15899 2.48994 4.33799 3.41394 3.41399C4.33794 2.49099 6.15894 3.20399 9.80294 4.62999Z" fill="#16161E" stroke="#EBEBEB" stroke-width="1.5" stroke-linejoin="round"/></svg>',
)}") 3 3, auto`;


function identityBadgeKey(id: ElementIdentity): string {
  if (id.fiberPath?.length) return `fiber:${JSON.stringify(id.fiberPath)}`;
  if (id.source) {
    return `src:${id.source.file}:${id.source.line}:${id.source.col}|tag:${id.tag}|hash:${id.contentHash}|txt:${id.textSnippet ?? ""}`;
  }
  const cls = id.classList.join(".");
  const txt = id.textSnippet ?? "";
  const name = id.componentName ?? "";
  return `el:${name}|${id.tag}|${cls}|${txt}|hash:${id.contentHash}`;
}

/** Restore inline styles to the captured "from" snapshot (handles rgb vs hex for colours). */
function revertStyleTweakToFromVisual(hel: HTMLElement, changes: StyleTweak["changes"]): void {
  for (const c of changes) {
    hel.style.removeProperty(c.cssProperty);
    if (!c.fromValue) continue;
    const cascaded = getComputedStyle(hel).getPropertyValue(c.cssProperty).trim();
    const same = cssPaintProperty(c.cssProperty)
      ? cssPaintValuesEqual(cascaded, c.fromValue)
      : cascaded === c.fromValue;
    if (!same) hel.style.setProperty(c.cssProperty, c.fromValue);
  }
}

function mergePromptChange(base: WeevarChange, next: WeevarChange): WeevarChange {
  // StyleTweak + StyleTweak → merge property changes, preserve earliest fromValue per property
  if (base.kind === "style-tweak" && next.kind === "style-tweak") {
    const merged = new Map<string, typeof base.changes[0]>();
    for (const c of base.changes) merged.set(c.cssProperty, c);
    for (const c of next.changes) {
      const existing = merged.get(c.cssProperty);
      merged.set(c.cssProperty, {
        ...c,
        // Keep the earliest "from" so the prompt shows the full range of change
        fromValue: existing?.fromValue ?? c.fromValue,
      });
    }
    return {
      ...next,
      target: base.target,
      changes: Array.from(merged.values()),
      borderSummary: next.borderSummary ?? base.borderSummary,
    } as WeevarChange;
  }

  // StyleTweak + LayoutChange or vice versa — cannot be merged into one, return next as-is
  // compressSessionForPrompt handles the mixed case separately below
  if (base.kind === "style-tweak" || next.kind === "style-tweak") return next;
  if (next.kind === "move") {
    if (base.kind === "move") {
      return {
        ...next,
        target: base.target,
        fromParent: base.fromParent,
        fromIndex: base.fromIndex,
        fromLayoutType: base.fromLayoutType,
      };
    }
    return {
      kind: "move",
      target: base.target,
      fromParent: base.parent,
      toParent: next.toParent,
      fromIndex: base.fromIndex,
      toIndex: next.toIndex,
      destinationSiblings: next.destinationSiblings ?? next.siblings,
      siblings: next.destinationSiblings ?? next.siblings,
      fromLayoutType: base.layoutType,
      toLayoutType: next.toLayoutType,
    };
  }

  if (base.kind === "move") {
    return {
      ...base,
      target: base.target,
      toParent: next.parent,
      toIndex: next.toIndex,
      destinationSiblings: next.siblings,
      siblings: next.siblings,
      toLayoutType: next.layoutType,
    };
  }

  return {
    ...next,
    target: base.target,
    parent: base.parent,
    fromIndex: base.fromIndex,
  };
}

function compressSessionForPrompt(session: MoveSession): MoveSession {
  const out: BatchedChange[] = [];
  const byTarget = new Map<string, number>();
  for (const entry of session.changes) {
    const key = identityBadgeKey(entry.change.target);
    const idx = byTarget.get(key);
    if (idx == null) {
      out.push({ ...entry });
      byTarget.set(key, out.length - 1);
      continue;
    }
    const prev = out[idx];
    if (!prev) continue;

    if (prev.change.kind === "style-tweak" && entry.change.kind === "style-tweak") {
      // Both are style tweaks — merge property arrays using mergePromptChange
      out[idx] = {
        ...entry,
        ordinal: prev.ordinal,
        change: mergePromptChange(prev.change, entry.change),
        badgeAnchor: prev.badgeAnchor,
        capturedAt: prev.capturedAt,
      };
    } else if (
      prev.change.kind !== "style-tweak" &&
      entry.change.kind !== "style-tweak"
    ) {
      // Both are layout changes — existing merge logic
      out[idx] = {
        ...entry,
        ordinal: prev.ordinal,
        change: mergePromptChange(prev.change, entry.change),
        badgeAnchor: prev.badgeAnchor,
        capturedAt: prev.capturedAt,
      };
    } else {
      // Mixed kinds (layout + style or style + layout) — keep both as separate entries
      // Each will become its own numbered section in the batched prompt
      out.push({ ...entry });
      // Update the index map so further entries for this element append after the latest
      byTarget.set(identityBadgeKey(entry.change.target), out.length - 1);
    }
  }
  const changes = out.map((c, i) => ({ ...c, ordinal: i + 1 }));
  return { ...session, changes };
}

function truncateLabel(input: string): string {
  const s = input.trim().replace(/\s+/g, " ");
  if (s.length <= 20) return s;
  return `${s.slice(0, 20)}...`;
}

function buildSpecificElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const classList = Array.from((el as HTMLElement).classList ?? []);
  const classPart = classList.length ? `.${classList.slice(0, 2).join(".")}` : "";
  const directText = Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent ?? "")
    .join(" ")
    .trim();
  const textLikeTags = new Set([
    "p",
    "span",
    "a",
    "label",
    "small",
    "strong",
    "em",
    "b",
    "i",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "blockquote",
    "code",
    "pre",
    "button",
  ]);
  const textPart = (directText || (el.textContent ?? "").trim()).replace(/\s+/g, " ").trim();
  const raw = textLikeTags.has(tag) && textPart ? `${tag}: "${textPart}"` : `${tag}${classPart}`;
  return truncateLabel(raw || tag);
}

function rectsEqual(a: DOMRect | null, b: DOMRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

type Props = {
  sessionOn: boolean;
  setSessionOn: (next: boolean) => void;
  disabled?: boolean;
  config?: WeevarRuntimeConfig;
};

export function WeevarShadowApp({
  sessionOn,
  setSessionOn,
  disabled,
  config,
}: Props) {
  const [activeTool, setActiveTool] = useState<"summary" | "pointer">("summary");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTool, setSettingsTool] = useState<TargetTool>("claude-code");
  const [settingsLen, setSettingsLen] = useState<PromptLength>("short");

  const DOCK_WIDTH = 50;
  const DOCK_HEIGHT = 340;
  const TRIGGER_SIZE = 50;
  const DOCK_VIEWPORT_INSET = 24;
  const TRIGGER_OFFSET_Y = DOCK_HEIGHT - TRIGGER_SIZE; // close button aligns with trigger button area

  type DockPos = { left: number; top: number };
  const clampDockPos = useCallback((pos: DockPos): DockPos => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      left: Math.max(0, Math.min(pos.left, w - DOCK_WIDTH)),
      top: Math.max(0, Math.min(pos.top, h - DOCK_HEIGHT)),
    };
  }, []);

  const getDefaultDockPos = useCallback((): DockPos => {
    if (typeof window === "undefined") return { left: 0, top: DOCK_VIEWPORT_INSET };
    const w = window.innerWidth;
    return {
      left: Math.max(0, w - DOCK_WIDTH - DOCK_VIEWPORT_INSET),
      top: DOCK_VIEWPORT_INSET,
    };
  }, []);

  const [dockPos, setDockPos] = useState<DockPos>(() => getDefaultDockPos());
  const [triggerAtTop, setTriggerAtTop] = useState(true);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const trayStackRef = useRef<HTMLDivElement | null>(null);
  const triggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const dockDragRef = useRef<
    | null
    | {
        pointerId: number;
        mode: "dock" | "trigger";
        grabX: number;
        grabY: number;
        moved: boolean;
        startX: number;
        startY: number;
      }
  >(null);
  const triggerDragMovedRef = useRef(false);
  const resolveDockFromTrigger = useCallback(
    (triggerLeft: number, triggerTop: number) => {
      const topCandidate = clampDockPos({ left: triggerLeft, top: triggerTop });
      const bottomCandidate = clampDockPos({
        left: triggerLeft,
        top: triggerTop - TRIGGER_OFFSET_Y,
      });

      const topTriggerTop = topCandidate.top;
      const bottomTriggerTop = bottomCandidate.top + TRIGGER_OFFSET_Y;
      const topDelta = Math.abs(topTriggerTop - triggerTop);
      const bottomDelta = Math.abs(bottomTriggerTop - triggerTop);
      const useTop = topDelta <= bottomDelta;
      return {
        dock: useTop ? topCandidate : bottomCandidate,
        triggerAtTop: useTop,
      };
    },
    [TRIGGER_OFFSET_Y, clampDockPos],
  );

  const triggerTop = dockPos.top + (triggerAtTop ? 0 : TRIGGER_OFFSET_Y);
  const triggerTooltipAlign = useMemo(() => {
    const vw = window.innerWidth;
    const triggerCenterX = dockPos.left + TRIGGER_SIZE / 2;
    if (triggerCenterX < 100) return "left";
    if (triggerCenterX > vw - 100) return "right";
    return "center";
  }, [dockPos.left, TRIGGER_SIZE]);

  const hoverRef = useRef<Element | null>(null);
  const selectedRef = useRef<Element | null>(null);
  const selectedIdentityRef = useRef<ElementIdentity | null>(null);
  const pendingRef = useRef<PendingReorder | null>(null);
  const runtimeChangeRefsRef = useRef<Map<number, RuntimeChangeRefs>>(new Map());
  const dragSessionRef = useRef<DragSession | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<PanelState | null>(null);
  const dragMoveRaf = useRef<number | null>(null);
  const pendingDragEv = useRef<PointerEvent | null>(null);
  const forcedCursorTargetRef = useRef<HTMLElement | SVGElement | null>(null);
  const forcedCursorPrevValueRef = useRef<string>("");
  const forcedCursorPrevPriorityRef = useRef<string>("");
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragUi, setDragUi] = useState<{ bar: DragBar | null } | null>(null);
  const dragOverlayEmitRef = useRef<{ bar: DragBar | null; zone: DOMRect | null } | null>(
    null,
  );
  const [dropZoneRect, setDropZoneRect] = useState<DOMRect | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [pointerInPage, setPointerInPage] = useState(false);
  const [altKeyHeld, setAltKeyHeld] = useState(false);

  const [panel, setPanel] = useState<PanelState | null>(null);
  panelRef.current = panel;
  const [promptOpen, setPromptOpen] = useState(false);
  /** When true, summary / pointer-property trays stay hidden until user re-opens from dock or picks an element. */
  const [traysDismissed, setTraysDismissed] = useState(false);
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const [redoChanges, setRedoChanges] = useState<BatchedChange[]>([]);
  const [badgeTick, setBadgeTick] = useState(0);
  const [isTriggerDragging, setIsTriggerDragging] = useState(false);
  const [toolbarTooltip, setToolbarTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [helperTooltip, setHelperTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const toolbarTooltipDelayRef = useRef<number | null>(null);
  const toolbarTooltipPendingRef = useRef<{ text: string; x: number; y: number } | null>(null);

  const framesRef = useRef<FrameRects>({ hover: null, selected: null });
  const [frames, setFrames] = useState<FrameRects>({
    hover: null,
    selected: null,
  });

  const readFrames = useCallback((): FrameRects => {
    const hover = hoverRef.current?.getBoundingClientRect() ?? null;
    const selected = selectedRef.current?.getBoundingClientRect() ?? null;
    return { hover, selected };
  }, []);

  useLayoutEffect(() => {
    if (!sessionOn || disabled || activeTool !== "pointer") return;
    let id = 0;
    const tick = () => {
      // During drag, flex preview mutates sibling layout every frame — polling rects here
      // forces React updates + layout thrash and freezes the main thread.
      if (!dragSessionRef.current) {
        const next = readFrames();
        const prev = framesRef.current;
        if (
          !rectsEqual(next.hover, prev.hover) ||
          !rectsEqual(next.selected, prev.selected)
        ) {
          framesRef.current = next;
          setFrames(next);
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [sessionOn, disabled, activeTool, readFrames]);

  useEffect(() => {
    if (!sessionOn || !moveSession?.changes.length) return;
    const tick = () => {
      setBadgeTick((n) => (n + 1) % 100000);
    };
    // Avoid a 60fps rerender loop; badges only need occasional refresh.
    const intervalId = window.setInterval(tick, 250);
    window.addEventListener("resize", tick);
    window.addEventListener("scroll", tick, true);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", tick);
      window.removeEventListener("scroll", tick, true);
    };
  }, [sessionOn, moveSession?.changes.length]);

  const disposePending = useCallback((revert: boolean) => {
    const p = pendingRef.current;
    if (!p) return;
    if (revert) p.revert();
    else p.disconnect();
    pendingRef.current = null;
  }, []);

  const cancelDrag = useCallback(() => {
    if (dragMoveRaf.current != null) {
      cancelAnimationFrame(dragMoveRaf.current);
      dragMoveRaf.current = null;
    }
    pendingDragEv.current = null;
    const s = dragSessionRef.current;
    if (!s) return;
    dragSessionRef.current = null;
    s.preview.clear();
    (s.dragged as HTMLElement).style.opacity = s.prevOpacity;
    s.ghostEl?.remove();
    s.resumeAnimations();
    try {
      dragHandleRef.current?.releasePointerCapture(s.pointerId);
    } catch {
      /* noop */
    }
    setIsDragging(false);
    dragOverlayEmitRef.current = null;
    setDragUi(null);
    setDropZoneRect(null);
    bump();
  }, [bump]);

  const clearSelection = useCallback(() => {
    selectedRef.current = null;
    selectedIdentityRef.current = null;
    hoverRef.current = null;
    framesRef.current = { hover: null, selected: null };
    setFrames({ hover: null, selected: null });
    bump();
  }, [bump]);

  const startDockDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if (isDragging || dragSessionRef.current) return;
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      e.stopPropagation();

      const dockEl = dockRef.current;
      if (!dockEl) return;
      const rect = dockEl.getBoundingClientRect();

      dockDragRef.current = {
        pointerId: e.pointerId,
        mode: "dock",
        grabX: e.clientX - rect.left,
        grabY: e.clientY - rect.top,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [isDragging],
  );

  const onDockDragMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const d = dockDragRef.current;
      if (!d || d.pointerId !== e.pointerId || d.mode !== "dock") return;

      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (!d.moved && dist > 4) d.moved = true;

      setDockPos(
        clampDockPos({
          left: e.clientX - d.grabX,
          top: e.clientY - d.grabY,
        }),
      );
    },
    [clampDockPos],
  );

  const stopDockDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dockDragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.mode !== "dock") return;
    dockDragRef.current = null;
  }, []);

  const startTriggerDockDrag = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const btn = triggerBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();

      triggerDragMovedRef.current = false;
      setIsTriggerDragging(true);
      dockDragRef.current = {
        pointerId: e.pointerId,
        mode: "trigger",
        grabX: e.clientX - rect.left,
        grabY: e.clientY - rect.top,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    },
    [disabled],
  );

  const onTriggerDockDragMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = dockDragRef.current;
      if (!d || d.pointerId !== e.pointerId || d.mode !== "trigger") return;

      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (!d.moved && dist > 4) {
        d.moved = true;
        triggerDragMovedRef.current = true;
      }

      const triggerLeft = e.clientX - d.grabX;
      const nextTriggerTop = e.clientY - d.grabY;
      const resolved = resolveDockFromTrigger(triggerLeft, nextTriggerTop);
      setTriggerAtTop(resolved.triggerAtTop);
      setDockPos(resolved.dock);
    },
    [resolveDockFromTrigger],
  );

  const stopTriggerDockDrag = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dockDragRef.current;
    if (!d || d.pointerId !== e.pointerId || d.mode !== "trigger") return;
    dockDragRef.current = null;
    setIsTriggerDragging(false);
  }, []);

  useEffect(() => {
    if (!sessionOn) {
      setActiveTool("summary");
      return;
    }
    if (activeTool === "pointer" || !dragSessionRef.current) return;
    cancelDrag();
  }, [sessionOn, activeTool, cancelDrag]);

  const appendBatchedChange = useCallback((change: WeevarChange, refs: RuntimeChangeRefs) => {
    setRedoChanges([]);
    setMoveSession((prev) => {
      const base: MoveSession = prev ?? { changes: [], startedAt: Date.now() };
      const nextOrdinal = base.changes.length + 1;
      const capturedAt = Date.now();
      const entry: BatchedChange = {
        ordinal: nextOrdinal,
        change,
        badgeAnchor: change.target,
        capturedAt,
      };
      runtimeChangeRefsRef.current.set(capturedAt, refs);
      const changes = [...base.changes, entry].map((c, i) => ({ ...c, ordinal: i + 1 }));
      if (changes.length > 20) {
        // eslint-disable-next-line no-console
        console.warn("[weevar] More than 20 batched changes captured.");
      }
      return { ...base, changes };
    });
  }, []);

  const onStyleCommit = useCallback(
    (
      el: Element,
      cssProperty: string,
      displayLabel: string,
      fromValue: string,
      toValue: string,
    ) => {
      if (!el) return;
      if (areStyleCommitValuesEquivalent(cssProperty, fromValue, toValue)) return;
      const identity = buildElementIdentity(el);
      const category = classifyElement(el);
      const borderCssProps = new Set(["border-width", "border-style", "border-color"]);
      let borderSummary: string | undefined;
      if (borderCssProps.has(cssProperty)) {
        const b = readBorderValues(el);
        if (b.style !== "none" && b.style !== "hidden") {
          borderSummary = `type ${b.style}, weight ${b.width}px, colour ${b.color}`;
        }
      }
      const change: StyleTweak = {
        kind: "style-tweak",
        target: identity,
        elementCategory: category,
        changes: [{ cssProperty, displayLabel, fromValue, toValue }],
        ...(borderSummary ? { borderSummary } : {}),
      };
      appendBatchedChange(change, {
        target: el,
        fromParent: el.parentElement ?? el,
        toParent: el.parentElement ?? el,
      });
    },
    [appendBatchedChange],
  );

  const dismissAllTrays = useCallback(() => {
    setPromptOpen(false);
    setSettingsOpen(false);
    setTraysDismissed(true);
  }, []);

  const applyChangeToDom = useCallback((change: WeevarChange, refs?: RuntimeChangeRefs) => {
    if (change.kind === "style-tweak") {
      const el = refs?.target ?? resolveElementIdentity(change.target);
      if (!el) return null;
      const hel = el as HTMLElement;
      for (const c of change.changes) {
        hel.style.setProperty(c.cssProperty, c.toValue);
      }
      return {
        revert: () => {
          revertStyleTweakToFromVisual(hel, change.changes);
        },
        disconnect: () => {},
      };
    }
    if (change.kind === "reorder") {
      const parent = refs?.toParent ?? resolveElementIdentity(change.parent);
      const target = refs?.target ?? resolveElementIdentity(change.target);
      if (!parent || !target) return null;
      const ordered = orderAfterMove(parent, target, change.toIndex);
      return createPendingReorder(parent, ordered);
    }

    const target = refs?.target ?? resolveElementIdentity(change.target);
    const toParent = refs?.toParent ?? resolveElementIdentity(change.toParent);
    if (!target || !toParent) return null;
    const currentParent = target.parentElement;
    if (!currentParent) return null;

    if (currentParent === toParent) {
      const ordered = orderAfterMove(currentParent, target, change.toIndex);
      return createPendingReorder(currentParent, ordered);
    }

    const ordered = orderAfterInsert(toParent, target, change.toIndex);
    return createPendingCrossMove(target, currentParent, toParent, ordered);
  }, []);

  const applyInverseChangeToDom = useCallback((change: WeevarChange, refs?: RuntimeChangeRefs) => {
    if (change.kind === "style-tweak") {
      const el = refs?.target ?? resolveElementIdentity(change.target);
      if (!el) return null;
      const hel = el as HTMLElement;

      const applyFrom = () => {
        revertStyleTweakToFromVisual(hel, change.changes);
      };

      applyFrom();

      return {
        revert: () => {
          for (const c of change.changes) {
            hel.style.setProperty(c.cssProperty, c.toValue);
          }
        },
        disconnect: () => {},
      };
    }
    if (change.kind === "reorder") {
      const parent = refs?.fromParent ?? resolveElementIdentity(change.parent);
      const target = refs?.target ?? resolveElementIdentity(change.target);
      if (!parent || !target) return null;
      const ordered = orderAfterMove(parent, target, change.fromIndex);
      return createPendingReorder(parent, ordered);
    }

    const target = refs?.target ?? resolveElementIdentity(change.target);
    const fromParent = refs?.fromParent ?? resolveElementIdentity(change.fromParent);
    if (!target || !fromParent) return null;
    const currentParent = target.parentElement;
    if (!currentParent) return null;

    if (currentParent === fromParent) {
      const ordered = orderAfterMove(fromParent, target, change.fromIndex);
      return createPendingReorder(fromParent, ordered);
    }

    const ordered = orderAfterInsert(fromParent, target, change.fromIndex);
    return createPendingCrossMove(target, currentParent, fromParent, ordered);
  }, []);

  const clearMoveSession = useCallback(() => {
    // Delete should fully restore the live page state from before this session,
    // so roll back all captured changes in reverse order.
    disposePending(false);
    if (moveSession?.changes.length) {
      for (let i = moveSession.changes.length - 1; i >= 0; i--) {
        const entry = moveSession.changes[i];
        if (!entry) continue;
        const refs = runtimeChangeRefsRef.current.get(entry.capturedAt);
        const rollback = applyInverseChangeToDom(entry.change, refs);
        rollback?.disconnect();
      }
    }
    pendingRef.current = null;
    runtimeChangeRefsRef.current.clear();
    setMoveSession(null);
    setRedoChanges([]);
    setPanel(null);
  }, [applyInverseChangeToDom, disposePending, moveSession]);

  const undoLastMove = useCallback(() => {
    setMoveSession((prev) => {
      if (!prev?.changes.length) return null;
      const undone = prev.changes[prev.changes.length - 1];
      const refs = runtimeChangeRefsRef.current.get(undone.capturedAt);
      disposePending(false);
      pendingRef.current = applyInverseChangeToDom(undone.change, refs);
      setRedoChanges((redo) => [...redo, undone]);
      const rest = prev.changes.slice(0, -1).map((c, i) => ({ ...c, ordinal: i + 1 }));
      if (!rest.length) {
        setPanel(null);
        return null;
      }
      return { ...prev, changes: rest };
    });
    dismissAllTrays();
  }, [applyInverseChangeToDom, dismissAllTrays, disposePending]);

  const redoLastMove = useCallback(() => {
    setRedoChanges((prevRedo) => {
      if (!prevRedo.length) return prevRedo;
      const restored = prevRedo[prevRedo.length - 1];
      const refs = runtimeChangeRefsRef.current.get(restored.capturedAt);
      disposePending(false);
      pendingRef.current = applyChangeToDom(restored.change, refs);
      setMoveSession((prevSession) => {
        const base: MoveSession = prevSession ?? { changes: [], startedAt: Date.now() };
        const changes = [...base.changes, restored].map((c, i) => ({ ...c, ordinal: i + 1 }));
        return { ...base, changes };
      });
      return prevRedo.slice(0, -1);
    });
    dismissAllTrays();
  }, [applyChangeToDom, dismissAllTrays, disposePending]);

  const generateFromBatch = useCallback(
    (tool: TargetTool, len: PromptLength) => {
      setTraysDismissed(false);
      setPromptOpen(true);
      const s = moveSession;
      if (!s?.changes.length) {
        setPanel(null);
        return;
      }
      const effectiveSession = compressSessionForPrompt(s);
      const prompt = generateBatchedPrompt(effectiveSession, { targetTool: tool });
      if (!prompt) {
        setPanel(null);
        return;
      }
      const last = effectiveSession.changes[effectiveSession.changes.length - 1];
      setPanel({
        change: last.change,
        prompt,
        len,
        tool,
        copyFlash: false,
        mode: "batched",
      });
    },
    [moveSession],
  );

  useEffect(() => {
    if (!sessionOn) {
      setTraysDismissed(false);
      setRedoChanges([]);
    }
  }, [sessionOn]);

  const commitDrag = useCallback(() => {
    const s = dragSessionRef.current;
    if (!s) return;
    const {
      dragged,
      sourceParent,
      dropParent,
      fromIndex,
      dropIndex,
      preview,
      resumeAnimations,
      prevOpacity,
      pointerId,
      ghostEl,
    } = s;
    dragSessionRef.current = null;
    preview.clear();
    (dragged as HTMLElement).style.opacity = prevOpacity;
    ghostEl?.remove();
    resumeAnimations();
    try {
      dragHandleRef.current?.releasePointerCapture(pointerId);
    } catch {
      /* noop */
    }
    setIsDragging(false);
    dragOverlayEmitRef.current = null;
    setDragUi(null);
    setDropZoneRect(null);
    if (dragMoveRaf.current != null) {
      cancelAnimationFrame(dragMoveRaf.current);
      dragMoveRaf.current = null;
    }
    pendingDragEv.current = null;

    if (dropParent === sourceParent && dropIndex === fromIndex) {
      bump();
      return;
    }

    // Prevent observer accumulation across multiple drops.
    disposePending(false);

    let change: WeevarChange;
    if (dropParent === sourceParent) {
      const ordered = orderAfterMove(sourceParent, dragged, dropIndex);
      pendingRef.current = createPendingReorder(sourceParent, ordered);
      change = buildReorderLayoutChange(
        sourceParent,
        dragged,
        fromIndex,
        dropIndex,
        ordered,
      );
    } else {
      const ordered = orderAfterInsert(dropParent, dragged, dropIndex);
      pendingRef.current = createPendingCrossMove(dragged, sourceParent, dropParent, ordered);
      change = buildMoveLayoutChange(
        dragged,
        sourceParent,
        dropParent,
        fromIndex,
        dropIndex,
        ordered,
      );
    }
    appendBatchedChange(change, {
      target: dragged,
      fromParent: sourceParent,
      toParent: dropParent,
    });
    selectedRef.current = null;
    selectedIdentityRef.current = null;
    bump();
  }, [appendBatchedChange, bump, disposePending]);

  useEffect(() => {
    if (!sessionOn) {
      hoverRef.current = null;
      cancelDrag();
      setToast(null);
    }
  }, [sessionOn, cancelDrag]);

  useEffect(() => {
    if (!sessionOn || disabled || activeTool !== "pointer" || promptOpen || isDragging) return;
    const id = window.setInterval(() => {
      const el = selectedRef.current;
      const ident = selectedIdentityRef.current;
      if (!el || !ident) return;
      if (document.contains(el)) return;
      const next = resolveElementIdentity(ident);
      if (next) {
        selectedRef.current = next;
        bump();
      } else {
        selectedRef.current = null;
        selectedIdentityRef.current = null;
        setToast("Selection lost after re-render");
        bump();
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [sessionOn, disabled, activeTool, promptOpen, isDragging, bump]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sessionOn) return;
    const key = "__weevarHistoryPatched__";
    const win = window as Window & { [key: string]: boolean };
    const onNav = () => {
      setMoveSession((prev) => {
        if (!prev?.changes.length) return prev;
        setPanel(null);
        setToast("Session cleared on navigation.");
        return null;
      });
    };
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    if (!win[key]) {
      win[key] = true;
      const origPush = history.pushState.bind(history);
      const origReplace = history.replaceState.bind(history);
      history.pushState = function (...args) {
        origPush(...args);
        window.dispatchEvent(new Event("popstate"));
      };
      history.replaceState = function (...args) {
        origReplace(...args);
        window.dispatchEvent(new Event("popstate"));
      };
    }
    return () => {
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, [sessionOn]);

  /** While the overlay is active, Escape is ignored (no tray dismiss, no in-tray cancel). */
  useEffect(() => {
    if (!sessionOn || disabled) return;
    const swallowEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", swallowEscape, { capture: true });
    return () => document.removeEventListener("keydown", swallowEscape, { capture: true });
  }, [sessionOn, disabled]);

  useEffect(() => {
    if (!sessionOn || disabled || activeTool !== "pointer") return;
    const clearForcedCursorTarget = () => {
      const prev = forcedCursorTargetRef.current;
      if (!prev) return;
      if (forcedCursorPrevValueRef.current) {
        prev.style.setProperty(
          "cursor",
          forcedCursorPrevValueRef.current,
          forcedCursorPrevPriorityRef.current || "",
        );
      } else {
        prev.style.removeProperty("cursor");
      }
      forcedCursorTargetRef.current = null;
      forcedCursorPrevValueRef.current = "";
      forcedCursorPrevPriorityRef.current = "";
    };

    const forceCursorOnTarget = (target: Element | null) => {
      const el =
        target instanceof HTMLElement || target instanceof SVGElement ? target : null;
      if (el === forcedCursorTargetRef.current) return;
      clearForcedCursorTarget();
      if (!el) return;
      forcedCursorTargetRef.current = el;
      forcedCursorPrevValueRef.current = el.style.getPropertyValue("cursor");
      forcedCursorPrevPriorityRef.current = el.style.getPropertyPriority("cursor");
      el.style.setProperty("cursor", POINTER_CURSOR_DATA_URI, "important");
    };

    const onPointerMove = (e: PointerEvent) => {
      const trayBounds = trayStackRef.current?.getBoundingClientRect() ?? null;
      const overChrome = pointerOverWeevarChrome(e, trayBounds);
      if (!overChrome) {
        forceCursorOnTarget(document.elementFromPoint(e.clientX, e.clientY));
      } else {
        clearForcedCursorTarget();
      }
      setPointerInPage(true);
      setPointerPos({ x: e.clientX, y: e.clientY });
      setAltKeyHeld(e.altKey);
      if (dragSessionRef.current) return;
      if (promptOpen) return;
      if (overChrome) {
        if (hoverRef.current !== null) {
          hoverRef.current = null;
          bump();
        }
        return;
      }
      const el = hitTestHostPage(e.clientX, e.clientY);
      if (el !== hoverRef.current) {
        hoverRef.current = el;
        bump();
      }
    };

    const onPointerDownCapture = (e: PointerEvent) => {
      if (dragSessionRef.current) return;
      if (promptOpen) return;
      blurWeevarOverlayFocusIfPointerOutside(e);
      const trayBounds = trayStackRef.current?.getBoundingClientRect() ?? null;
      if (pointerOverWeevarChrome(e, trayBounds)) return;
      const el = hitTestHostPage(e.clientX, e.clientY);
      if (!el) {
        selectedRef.current = null;
        selectedIdentityRef.current = null;
        e.preventDefault();
        e.stopPropagation();
        bump();
        return;
      }
      selectedRef.current = el;
      selectedIdentityRef.current = buildElementIdentity(el);
      setTraysDismissed(false);
      e.preventDefault();
      e.stopPropagation();
      bump();
    };

    document.addEventListener("pointermove", onPointerMove, {
      capture: true,
      passive: true,
    });
    document.addEventListener("pointerdown", onPointerDownCapture, {
      capture: true,
      passive: false,
    });
    const onWindowMouseLeave = () => {
      setPointerInPage(false);
      setPointerPos(null);
      setAltKeyHeld(false);
    };
    const onWindowBlur = () => {
      setPointerInPage(false);
      setPointerPos(null);
      setAltKeyHeld(false);
    };
    const onWindowMouseEnter = () => {
      setPointerInPage(true);
    };
    window.addEventListener("mouseleave", onWindowMouseLeave, true);
    window.addEventListener("blur", onWindowBlur, true);
    window.addEventListener("mouseenter", onWindowMouseEnter, true);

    return () => {
      clearForcedCursorTarget();
      setPointerInPage(false);
      setPointerPos(null);
      setAltKeyHeld(false);
      document.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      document.removeEventListener("pointerdown", onPointerDownCapture, {
        capture: true,
      });
      window.removeEventListener("mouseleave", onWindowMouseLeave, true);
      window.removeEventListener("blur", onWindowBlur, true);
      window.removeEventListener("mouseenter", onWindowMouseEnter, true);
    };
  }, [
    sessionOn,
    disabled,
    activeTool,
    bump,
    promptOpen,
    setTraysDismissed,
  ]);

  useEffect(() => {
    if (!sessionOn || disabled || activeTool !== "pointer") {
      setAltKeyHeld(false);
      return;
    }

    const syncAlt = (held: boolean) => setAltKeyHeld(held);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") syncAlt(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") syncAlt(false);
    };
    const onBlur = () => syncAlt(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [sessionOn, disabled, activeTool]);

  useEffect(() => {
    if (!(sessionOn && activeTool === "pointer")) {
      document.body.style.removeProperty("cursor");
      document.documentElement.style.removeProperty("cursor");
      const lock = document.getElementById("__weevar_pointer_cursor_lock__");
      lock?.remove();
      return;
    }
    const prevBody = document.body.style.cursor;
    const prevRoot = document.documentElement.style.cursor;
    document.body.style.cursor = POINTER_CURSOR_DATA_URI;
    document.documentElement.style.cursor = POINTER_CURSOR_DATA_URI;
    const style = document.createElement("style");
    style.id = "__weevar_pointer_cursor_lock__";
    style.textContent = `html,
body,
body *,
body *::before,
body *::after,
body *:hover,
body *:active,
body *:focus {
  cursor: ${POINTER_CURSOR_DATA_URI} !important;
}`;
    const ensureLast = () => {
      if (document.head.lastElementChild !== style) document.head.appendChild(style);
    };
    ensureLast();
    const observer = new MutationObserver(ensureLast);
    observer.observe(document.head, { childList: true });
    return () => {
      document.body.style.cursor = prevBody;
      document.documentElement.style.cursor = prevRoot;
      observer.disconnect();
      style.remove();
    };
  }, [sessionOn, activeTool]);

  useEffect(() => {
    if (!isDragging) return;

    const flushDrag = () => {
      dragMoveRaf.current = null;
      const ev = pendingDragEv.current;
      pendingDragEv.current = null;
      if (!ev) return;
      const s = dragSessionRef.current;
      if (!s) return;
      ev.preventDefault();
      ev.stopPropagation();
      const { dragged, sourceParent, preview } = s;
      if (s.ghostEl) {
        s.ghostEl.style.left = `${ev.clientX - s.grabOffsetX}px`;
        s.ghostEl.style.top = `${ev.clientY - s.grabOffsetY}px`;
      }
      autoScrollForPoint(ev.clientX, ev.clientY);
      // Host already uses pointer-events:none — visibility toggle every frame was forcing layouts.
      const hit = hitTestHostPage(ev.clientX, ev.clientY);
      const dropParent = findDropParent(hit, dragged) ?? sourceParent;
      const dropIndex = computeDropIndex(dropParent, dragged, ev.clientX, ev.clientY);
      s.dropParent = dropParent;
      s.dropIndex = dropIndex;

      const ordered =
        dropParent === sourceParent
          ? orderAfterMove(sourceParent, dragged, dropIndex)
          : orderAfterInsert(dropParent, dragged, dropIndex);

      if (dropParent === sourceParent && parentSupportsFlexOrderPreview(sourceParent)) {
        preview.apply(ordered);
      } else {
        preview.clear();
      }

      const cs = getComputedStyle(dropParent);
      const row =
        cs.display.includes("flex") &&
        ["row", "row-reverse"].includes(cs.flexDirection || "");
      const insertIdx = ordered.indexOf(dragged);
      const bar = insertionBarBetween(ordered, insertIdx, row);

      const nextZone =
        dropParent === sourceParent ? null : dropParent.getBoundingClientRect();
      const prevEmit = dragOverlayEmitRef.current;
      if (
        prevEmit === null ||
        !sameDragBar(prevEmit.bar, bar) ||
        !sameDropZoneRect(prevEmit.zone, nextZone)
      ) {
        dragOverlayEmitRef.current = { bar, zone: nextZone };
        setDragUi({ bar });
        setDropZoneRect(nextZone);
      }
    };

    const onMove = (e: PointerEvent) => {
      const s = dragSessionRef.current;
      if (!s) return;
      e.preventDefault();
      e.stopPropagation();
      pendingDragEv.current = e;
      if (dragMoveRaf.current != null) return;
      dragMoveRaf.current = requestAnimationFrame(flushDrag);
    };

    const onUp = (e: PointerEvent) => {
      const s = dragSessionRef.current;
      if (!s) return;
      e.preventDefault();
      e.stopPropagation();
      pendingDragEv.current = e;
      if (dragMoveRaf.current != null) {
        cancelAnimationFrame(dragMoveRaf.current);
        dragMoveRaf.current = null;
      }
      flushDrag();
      commitDrag();
    };

    document.addEventListener("pointermove", onMove, { capture: true, passive: false });
    document.addEventListener("pointerup", onUp, { capture: true, passive: false });
    document.addEventListener("pointercancel", onUp, { capture: true, passive: false });

    return () => {
      document.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointerup", onUp, { capture: true });
      document.removeEventListener("pointercancel", onUp, { capture: true });
      if (dragMoveRaf.current != null) cancelAnimationFrame(dragMoveRaf.current);
      dragMoveRaf.current = null;
      pendingDragEv.current = null;
    };
  }, [isDragging, commitDrag]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool !== "pointer") return;
      if (panel) return;
      const dragged = selectedRef.current;
      const parent = dragged?.parentElement;
      if (!dragged || !parent) return;
      e.preventDefault();
      e.stopPropagation();

      const hel = dragged as HTMLElement;
      const dragRect = hel.getBoundingClientRect();
      const prevOpacity = hel.style.opacity;
      hel.style.opacity = "0.3";
      const ghostEl = hel.cloneNode(true) as HTMLElement;
      ghostEl.style.position = "fixed";
      ghostEl.style.left = `${dragRect.left}px`;
      ghostEl.style.top = `${dragRect.top}px`;
      ghostEl.style.width = `${dragRect.width}px`;
      ghostEl.style.height = `${dragRect.height}px`;
      ghostEl.style.margin = "0";
      ghostEl.style.pointerEvents = "none";
      ghostEl.style.opacity = "0.55";
      ghostEl.style.zIndex = "2147483646";
      ghostEl.style.transform = "none";
      ghostEl.style.transition = "none";
      ghostEl.style.boxSizing = "border-box";
      ghostEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(ghostEl);

      const preview = new FlexOrderPreview();
      const resume = pushPauseHostAnimations();
      const fromIndex = elementChildren(parent).indexOf(dragged);

      dragSessionRef.current = {
        dragged,
        sourceParent: parent,
        dropParent: parent,
        dropIndex: fromIndex,
        fromIndex,
        preview,
        resumeAnimations: resume,
        prevOpacity,
        pointerId: e.pointerId,
        ghostEl,
        grabOffsetX: e.clientX - dragRect.left,
        grabOffsetY: e.clientY - dragRect.top,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragOverlayEmitRef.current = null;
      setIsDragging(true);
      setDragUi({ bar: null });
      setDropZoneRect(null);
      bump();
    },
    [activeTool, bump, panel],
  );

  const selectedEl = selectedRef.current;
  const hoverEl = hoverRef.current;

  const pointerSelectionInfo = useMemo<PointerSelectionInfo | null>(() => {
    if (!selectedEl || promptOpen || activeTool !== "pointer") return null;
    const p = selectedEl.parentElement;
    if (!p) return null;
    return {
      path: buildAncestorPath(selectedEl),
    };
  }, [selectedEl, promptOpen, rev, activeTool]);


  const visibleBadges = useMemo((): BadgeRender[] => {
    void badgeTick;
    const changes = moveSession?.changes ?? [];
    if (!changes.length) return [];
    const latest = new Map<string, BatchedChange>();
    for (const c of changes) latest.set(identityBadgeKey(c.change.target), c);
    const out: BadgeRender[] = [];
    for (const c of latest.values()) {
      const el = resolveElementIdentity(c.badgeAnchor);
      if (!el) continue;
      out.push({ ordinal: c.ordinal, displayOrdinal: 0, rect: el.getBoundingClientRect() });
    }
    out.sort((a, b) => a.ordinal - b.ordinal);
    return out.map((b, i) => ({ ...b, displayOrdinal: i + 1 }));
  }, [moveSession, badgeTick]);

  const movedElementCount = useMemo(() => {
    const changes = moveSession?.changes ?? [];
    if (!changes.length) return 0;
    const unique = new Set<string>();
    for (const c of changes) unique.add(identityBadgeKey(c.change.target));
    return unique.size;
  }, [moveSession]);
  const selectedToolLabel = useMemo(() => {
    if (settingsTool === "claude-code") return "Claude Code";
    if (settingsTool === "codex") return "Codex";
    return "Generic";
  }, [settingsTool]);
  const pendingMoveCount = movedElementCount;
  const isSettingsActive = settingsOpen;
  const isPromptActive = promptOpen && !settingsOpen;
  const isSummaryActive = activeTool === "summary" && !isSettingsActive && !isPromptActive;
  const isPointerActive = activeTool === "pointer" && !isSettingsActive && !isPromptActive;
  const showSettingsTray = settingsOpen;
  const showPromptTray = promptOpen && !showSettingsTray;
  const showSummaryTray =
    !traysDismissed &&
    !showPromptTray &&
    !showSettingsTray &&
    (activeTool === "summary" || (activeTool === "pointer" && pointerSelectionInfo));
  const trayAnyOpen = showSummaryTray || showSettingsTray || showPromptTray;
  /** Taller tray shell only when the pointer selection EditTray is the visible summary tray. */
  const editSelectionTrayVisible =
    showSummaryTray && activeTool === "pointer" && pointerSelectionInfo != null;
  const pointerOverOpenTray =
    trayAnyOpen &&
    pointerPos != null &&
    trayStackRef.current != null &&
    pointInDOMRect(
      pointerPos.x,
      pointerPos.y,
      trayStackRef.current.getBoundingClientRect(),
    );
  const labelAvoidRects =
    trayAnyOpen && trayStackRef.current
      ? [trayStackRef.current.getBoundingClientRect()]
      : [];
  const showSpacingMeasure =
    activeTool === "pointer" &&
    altKeyHeld &&
    !!selectedEl &&
    !!hoverEl &&
    hoverEl !== selectedEl &&
    !!frames.selected &&
    !!frames.hover &&
    !isDragging &&
    !promptOpen &&
    !pointerOverOpenTray;
  const trayStyle = useMemo((): CSSProperties => {
    const trayWidth = 250;
    const gap = 8;
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - trayWidth - 8);
    const leftCandidate = dockPos.left - trayWidth - gap;
    const left =
      leftCandidate >= minLeft
        ? Math.min(leftCandidate, maxLeft)
        : Math.min(Math.max(dockPos.left + DOCK_WIDTH + gap, minLeft), maxLeft);
    return {
      left,
      top: dockPos.top,
      right: "auto",
      bottom: "auto",
    };
  }, [dockPos, DOCK_WIDTH]);

  const placeToolbarTooltip = useCallback((text: string, clientX: number, clientY: number) => {
    const estimatedWidth = Math.max(56, text.length * 6 + 16);
    // Keep tooltip away from tray direction:
    // on left half of viewport, render tooltip to the left of cursor; otherwise to the right.
    const placeLeft = clientX < window.innerWidth / 2;
    const rawX = placeLeft ? clientX - estimatedWidth + 2 : clientX + 6;
    const x = Math.min(Math.max(4, rawX), window.innerWidth - estimatedWidth - 4);
    const y = Math.min(Math.max(4, clientY + 16), window.innerHeight - 28);
    return { text, x, y };
  }, []);

  const scheduleToolbarTooltip = useCallback((text: string, clientX: number, clientY: number, delayMs = 1600) => {
    const pending = placeToolbarTooltip(text, clientX, clientY);
    toolbarTooltipPendingRef.current = pending;
    if (toolbarTooltipDelayRef.current != null) window.clearTimeout(toolbarTooltipDelayRef.current);
    toolbarTooltipDelayRef.current = window.setTimeout(() => {
      if (toolbarTooltipPendingRef.current) {
        setToolbarTooltip(toolbarTooltipPendingRef.current);
      }
      toolbarTooltipDelayRef.current = null;
    }, delayMs);
  }, [placeToolbarTooltip]);

  const showToolbarTooltip = useCallback((text: string, e: React.MouseEvent<HTMLElement>, delayMs = 1600) => {
    scheduleToolbarTooltip(text, e.clientX, e.clientY, delayMs);
  }, [scheduleToolbarTooltip]);

  const moveToolbarTooltip = useCallback((text: string, e: React.MouseEvent<HTMLElement>) => {
    const next = placeToolbarTooltip(text, e.clientX, e.clientY);
    toolbarTooltipPendingRef.current = next;
    setToolbarTooltip((prev) => {
      if (!prev || prev.text !== text) {
        return prev;
      }
      return { ...prev, x: next.x, y: next.y };
    });
  }, [placeToolbarTooltip]);

  const showToolbarTooltipFromPointer = useCallback((
    text: string,
    e: React.PointerEvent<HTMLElement>,
    delayMs = 1600,
  ) => {
    scheduleToolbarTooltip(text, e.clientX, e.clientY, delayMs);
  }, [scheduleToolbarTooltip]);

  const moveToolbarTooltipFromPointer = useCallback((text: string, e: React.PointerEvent<HTMLElement>) => {
    const next = placeToolbarTooltip(text, e.clientX, e.clientY);
    toolbarTooltipPendingRef.current = next;
    setToolbarTooltip((prev) => {
      if (!prev || prev.text !== text) return prev;
      return { ...prev, x: next.x, y: next.y };
    });
  }, [placeToolbarTooltip]);

  const hideToolbarTooltip = useCallback(() => {
    if (toolbarTooltipDelayRef.current != null) {
      window.clearTimeout(toolbarTooltipDelayRef.current);
      toolbarTooltipDelayRef.current = null;
    }
    toolbarTooltipPendingRef.current = null;
    setToolbarTooltip(null);
  }, []);

  useEffect(() => {
    // Prevent stale delayed tooltip state when toggling trigger <-> toolbar UI.
    hideToolbarTooltip();
  }, [sessionOn, hideToolbarTooltip]);

  const showHelperTooltip = useCallback((text: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setHelperTooltip({
      text,
      x: r.right + 8,
      y: r.top + r.height / 2,
    });
  }, []);

  const hideHelperTooltip = useCallback(() => {
    setHelperTooltip(null);
  }, []);

  useEffect(() => {
    if (!sessionOn) return;
    const onShortcut = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (editSelectionTrayVisible) return;
      if (shouldIgnoreWeevarShortcut(e)) return;

      const k = e.key.toLowerCase();
      if (k === "p") {
        e.preventDefault();
        e.stopPropagation();
        setTraysDismissed(false);
        setSettingsOpen(false);
        generateFromBatch(settingsTool, settingsLen);
        return;
      }
      if (k === "w") {
        e.preventDefault();
        e.stopPropagation();
        setTraysDismissed(false);
        setActiveTool("pointer");
        setPanel(null);
        setSettingsOpen(false);
        setPromptOpen(false);
        return;
      }
      if (k === "o") {
        e.preventDefault();
        e.stopPropagation();
        setTraysDismissed(false);
        setActiveTool("summary");
        setPanel(null);
        setSettingsOpen(false);
        setPromptOpen(false);
        return;
      }
      if (k === "d") {
        e.preventDefault();
        e.stopPropagation();
        clearMoveSession();
        clearSelection();
        dismissAllTrays();
        return;
      }
      if (k === "u") {
        e.preventDefault();
        e.stopPropagation();
        undoLastMove();
        return;
      }
      if (k === "r") {
        e.preventDefault();
        e.stopPropagation();
        redoLastMove();
      }
    };

    document.addEventListener("keydown", onShortcut, { capture: true });
    return () => {
      document.removeEventListener("keydown", onShortcut, { capture: true });
    };
  }, [
    sessionOn,
    editSelectionTrayVisible,
    cancelDrag,
    setSessionOn,
    generateFromBatch,
    settingsTool,
    settingsLen,
    clearMoveSession,
    clearSelection,
    dismissAllTrays,
    undoLastMove,
    redoLastMove,
  ]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap"
      />
      <style>{OVERLAY_CSS}</style>
      <div className="wv-root" aria-hidden={!sessionOn}>
        {!sessionOn ? (
          <>
            <button
              type="button"
              className="wv-tool-button wv-pe"
              data-tooltip="Activate Weevar (⌘⇧E)"
              data-tooltip-align={triggerTooltipAlign}
              data-tooltip-suppress={isTriggerDragging ? "true" : "false"}
              aria-label="Activate Weevar overlay"
              disabled={disabled}
              ref={triggerBtnRef}
              onClick={() => {
                if (disabled) return;
                if (triggerDragMovedRef.current) {
                  triggerDragMovedRef.current = false;
                  return;
                }
                setSessionOn(true);
              }}
              onPointerDown={startTriggerDockDrag}
              onPointerMove={onTriggerDockDragMove}
              onPointerUp={stopTriggerDockDrag}
              onPointerCancel={stopTriggerDockDrag}
              style={{
                left: dockPos.left,
                top: triggerTop,
                right: "auto",
                bottom: "auto",
              }}
            >
              <LogomarkIcon className="wv-tool-button-logo" />
              {pendingMoveCount > 0 ? (
                <span className="wv-tool-button-badge" aria-label={`${pendingMoveCount} pending moves`}>
                  {pendingMoveCount}
                </span>
              ) : null}
            </button>
          </>
        ) : (
          <>
            <div
              className="wv-dock"
              ref={dockRef}
              style={{
                left: dockPos.left,
                top: dockPos.top,
                right: "auto",
                bottom: "auto",
              }}
            >
              {triggerAtTop ? (
                <button
                  type="button"
                  className="wv-toolbar-close"
                  aria-label="Close overlay"
                  onMouseEnter={(e) => showToolbarTooltip("Close overlay", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Close overlay", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    cancelDrag();
                    setSessionOn(false);
                  }}
                >
                  <CloseIcon />
                </button>
              ) : null}
              <div
                className="wv-toolbar"
                onPointerDown={startDockDrag}
                onPointerMove={onDockDragMove}
                onPointerUp={stopDockDrag}
                onPointerCancel={stopDockDrag}
              >
                <button
                  type="button"
                  className={`wv-tool-icon ${isSummaryActive ? "wv-tool-icon-on" : ""}`}
                  onMouseEnter={(e) => showToolbarTooltip("Overview (O)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Overview (O)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    setTraysDismissed(false);
                    setActiveTool("summary");
                    setPanel(null);
                    setSettingsOpen(false);
                    setPromptOpen(false);
                  }}
                >
                  <LogomarkIcon />
                </button>
                <button
                  type="button"
                  className={`wv-tool-icon ${isPointerActive ? "wv-tool-icon-on" : ""}`}
                  onMouseEnter={(e) => showToolbarTooltip("Pointer (W)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Pointer (W)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    setTraysDismissed(false);
                    setActiveTool("pointer");
                    setPanel(null);
                    setSettingsOpen(false);
                    setPromptOpen(false);
                  }}
                >
                  <PointerIcon />
                </button>
                <button
                  type="button"
                  className={`wv-tool-icon ${isPromptActive ? "wv-tool-icon-on" : ""}`}
                  onMouseEnter={(e) => showToolbarTooltip("Prompt (P)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Prompt (P)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    setTraysDismissed(false);
                    setSettingsOpen(false);
                    generateFromBatch(settingsTool, settingsLen);
                  }}
                >
                  <PromptIcon />
                </button>
                <button
                  type="button"
                  className="wv-tool-icon"
                  onMouseEnter={(e) => showToolbarTooltip("Undo (U)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Undo (U)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  disabled={!((moveSession?.changes.length ?? 0) > 0)}
                  onClick={undoLastMove}
                >
                  <UndoIcon />
                </button>
                <button
                  type="button"
                  className="wv-tool-icon"
                  onMouseEnter={(e) => showToolbarTooltip("Redo (R)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Redo (R)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  disabled={redoChanges.length === 0}
                  onClick={redoLastMove}
                >
                  <RedoIcon />
                </button>
                <button
                  type="button"
                  className="wv-tool-icon"
                  onMouseEnter={(e) => showToolbarTooltip("Delete (D)", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Delete (D)", e)}
                  onMouseLeave={hideToolbarTooltip}
                  disabled={!((moveSession?.changes.length ?? 0) > 0 || !!selectedEl)}
                  onClick={() => {
                    clearMoveSession();
                    clearSelection();
                    dismissAllTrays();
                  }}
                >
                  <TrashIcon />
                </button>
                <button
                  type="button"
                  className={`wv-tool-icon ${isSettingsActive ? "wv-tool-icon-on" : ""}`}
                  onMouseEnter={(e) => showToolbarTooltip("Settings", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Settings", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    setTraysDismissed(false);
                    setActiveTool("summary");
                    setPanel(null);
                    setSettingsOpen(true);
                    setPromptOpen(false);
                  }}
                >
                  <SettingsIcon />
                </button>
              </div>
              {!triggerAtTop ? (
                <button
                  type="button"
                  className="wv-toolbar-close"
                  aria-label="Close overlay"
                  onMouseEnter={(e) => showToolbarTooltip("Close overlay", e)}
                  onMouseMove={(e) => moveToolbarTooltip("Close overlay", e)}
                  onMouseLeave={hideToolbarTooltip}
                  onClick={() => {
                    cancelDrag();
                    setSessionOn(false);
                  }}
                >
                  <CloseIcon />
                </button>
              ) : null}
            </div>

            {trayAnyOpen ? (
              <div
                ref={trayStackRef}
                className={`wv-tray-stack${editSelectionTrayVisible ? " wv-tray-stack--edit" : ""}`}
                style={trayStyle}
              >
                <div
                  className={`wv-tray-stack-layer${showSummaryTray ? " wv-tray-stack-layer--visible" : ""}`}
                  aria-hidden={!showSummaryTray}
                >
                  <aside className="wv-summary-tray wv-pe" aria-hidden={!showSummaryTray}>
                    <div className="wv-tray-head">
                      <WeevarWordmarkIcon />
                      <button
                        type="button"
                        className="wv-tray-hide-btn"
                        aria-label="Hide tray"
                        onClick={dismissAllTrays}
                      >
                        <HideTrayIcon />
                      </button>
                    </div>
                    <div
                      className={`wv-tray-content ${
                        activeTool === "pointer" && pointerSelectionInfo
                          ? "wv-tray-content-selection"
                          : activeTool === "summary"
                            ? "wv-tray-content-summary"
                          : ""
                      }`}
                      style={
                        activeTool === "summary"
                          ? { paddingLeft: 16, paddingRight: 16 }
                          : undefined
                      }
                    >
                      {activeTool === "summary" ? (
                        <>
                          <div className="wv-summary-content">
                            <div className="wv-summary-heading">
                              <div className="wv-summary-kicker" style={{ textAlign: "left", width: "100%" }}>
                                Hey builder!
                              </div>
                              <div className="wv-summary-title" style={{ textAlign: "left", width: "100%" }}>
                                Overview
                              </div>
                            </div>
                            <div className="wv-summary-main">
                              <div className="wv-tray-card wv-overview-card">
                                <div className="wv-overview-stat">
                                  <span className="wv-overview-orb wv-overview-orb--moved">
                                    <span className="wv-overview-orb-value">{movedElementCount}</span>
                                  </span>
                                  <span className="wv-overview-label">Total edits</span>
                                </div>
                                <span className="wv-overview-divider" aria-hidden />
                                <div className="wv-overview-stat">
                                  <span className="wv-overview-orb wv-overview-orb--tool">
                                    <AIToolIcon />
                                  </span>
                                  <span className="wv-overview-label">{selectedToolLabel}</span>
                                </div>
                              </div>
                              <div className="wv-tray-card wv-doc-card">
                                <span className="wv-doc-icon"><DocumentationIcon /></span>
                                <span className="wv-doc-copy">
                                  <span className="wv-doc-title">Documentation</span>
                                  <span className="wv-doc-site">weevar.com</span>
                                </span>
                                <button
                                  type="button"
                                  className="wv-doc-go"
                                  onClick={() => {
                                    window.open("https://weevar.com", "_blank", "noopener,noreferrer");
                                  }}
                                >
                                  <ArrowRightIcon />
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : pointerSelectionInfo ? (
                        <EditTray
                          element={selectedEl}
                          onStyleCommit={onStyleCommit}
                          onClose={dismissAllTrays}
                          hidden={traysDismissed}
                          tailwindEnabled={config?.prompts?.tailwindVerbatimClasses ?? false}
                        />
                      ) : null}
                    </div>
                    <div className="wv-tray-foot">
                      <span>{weevarVersionLabel()}</span>
                      <GlobeIcon />
                    </div>
                  </aside>
                </div>

                <div
                  className={`wv-tray-stack-layer${showSettingsTray ? " wv-tray-stack-layer--visible" : ""}`}
                  aria-hidden={!showSettingsTray}
                >
                  <SettingsTray
                    tool={settingsTool}
                    len={settingsLen}
                    onTool={setSettingsTool}
                    onLen={setSettingsLen}
                    onClose={dismissAllTrays}
                    onShowHelperTooltip={showHelperTooltip}
                    onHideHelperTooltip={hideHelperTooltip}
                    hidden={!showSettingsTray}
                  />
                </div>

                <div
                  className={`wv-tray-stack-layer${showPromptTray ? " wv-tray-stack-layer--visible" : ""}`}
                  aria-hidden={!showPromptTray}
                >
                  <PromptPanel
                    hidden={!showPromptTray}
                    promptText={panel ? promptBody(panel.prompt, panel.len) : "No edits made yet"}
                    canCopy={!!panel}
                    runtimeConfig={config}
                    onClose={dismissAllTrays}
                    copyFlash={panel?.copyFlash ?? false}
                    onCopy={async () => {
                      const p = panelRef.current;
                      if (!p) return;
                      const text = promptBody(p.prompt, p.len);
                      await navigator.clipboard.writeText(text);
                      setPanel((cur) => (cur ? { ...cur, copyFlash: true } : cur));
                      window.setTimeout(() => {
                        setPanel((cur) => (cur ? { ...cur, copyFlash: false } : cur));
                        bump();
                      }, 1200);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {dropZoneRect && (
              <div
                className="wv-drop-zone"
                style={{
                  left: dropZoneRect.left,
                  top: dropZoneRect.top,
                  width: dropZoneRect.width,
                  height: dropZoneRect.height,
                }}
              />
            )}
            {dragUi?.bar && (
              <div
                className="wv-insertion-bar"
                style={{
                  left: dragUi.bar.left,
                  top: dragUi.bar.top,
                  width: dragUi.bar.width,
                  height: dragUi.bar.height,
                }}
              />
            )}
            {toast && (
              <div className="wv-toast wv-pe" role="status">
                {toast}
              </div>
            )}
            {toolbarTooltip ? (
              <div
                className="wv-toolbar-tooltip"
                role="tooltip"
                style={{ left: toolbarTooltip.x, top: toolbarTooltip.y }}
              >
                {toolbarTooltip.text}
              </div>
            ) : null}
            {helperTooltip ? (
              <div
                className="wv-settings-helper-tooltip"
                role="tooltip"
                style={{ left: helperTooltip.x, top: helperTooltip.y }}
              >
                {helperTooltip.text}
              </div>
            ) : null}
            {visibleBadges.map((b) => (
              <div
                key={`badge-${b.ordinal}`}
                className="wv-badge"
                style={{ left: b.rect.left - 8, top: b.rect.top - 8 }}
                aria-label={`Move ${b.displayOrdinal}`}
              >
                {b.displayOrdinal}
              </div>
            ))}

            {activeTool === "pointer" &&
              frames.hover &&
              hoverEl &&
              (!selectedEl || hoverEl !== selectedEl) &&
              !isDragging &&
              !promptOpen &&
              !pointerOverOpenTray &&
              (!altKeyHeld || !selectedEl) && <Outline rect={frames.hover} variant="hover" />}

            {showSpacingMeasure && (
              <>
                <Outline rect={frames.hover!} variant="hover" />
                <SpacingMeasureOverlay from={frames.selected!} to={frames.hover!} />
              </>
            )}

            {activeTool === "pointer" && frames.selected && selectedEl && !promptOpen && (
              <>
                <Outline rect={frames.selected} variant="selected" />
                <CornerMarkers rect={frames.selected} />
                <SelectedTopBar
                  rect={frames.selected}
                  text={buildSpecificElementLabel(selectedEl)}
                  onDragStart={startDrag}
                  dragRef={dragHandleRef}
                />
              </>
            )}

            {activeTool === "pointer" &&
              frames.hover &&
              hoverEl &&
              hoverEl !== selectedEl &&
              !isDragging &&
              !promptOpen &&
              !altKeyHeld &&
              pointerInPage &&
              pointerPos && (
                <CursorHoverLabel
                  x={pointerPos.x}
                  y={pointerPos.y}
                  text={buildSpecificElementLabel(hoverEl)}
                  avoidRects={labelAvoidRects}
                />
              )}
          </>
        )}
      </div>
    </>
  );
}

function SettingsTray({
  tool,
  len,
  onTool,
  onLen,
  onClose,
  onShowHelperTooltip,
  onHideHelperTooltip,
  hidden = false,
}: {
  tool: TargetTool;
  len: PromptLength;
  onTool: (t: TargetTool) => void;
  onLen: (l: PromptLength) => void;
  onClose: () => void;
  onShowHelperTooltip: (text: string, el: HTMLElement) => void;
  onHideHelperTooltip: () => void;
  hidden?: boolean;
}) {
  return (
    <aside
      className="wv-summary-tray wv-settings-tray wv-pe"
      role="dialog"
      aria-label="Weevar settings"
      aria-hidden={hidden}
    >
      <div className="wv-tray-head wv-settings-head">
        <WeevarWordmarkIcon />
        <button type="button" className="wv-tray-hide-btn" aria-label="Hide tray" onClick={onClose}>
          <HideTrayIcon />
        </button>
      </div>

      <div className="wv-tray-content wv-settings-content">
        <div className="wv-settings-section">
          <div className="wv-settings-label-row">
            <span className="wv-settings-label-inline">
              <span>Target Tool</span>
              <span
                className="wv-settings-help-wrap"
                tabIndex={0}
                aria-label="Target tool help"
                onMouseEnter={(e) =>
                  onShowHelperTooltip("Tailor your prompt to fit the AI tool you use", e.currentTarget)
                }
                onMouseLeave={onHideHelperTooltip}
                onFocus={(e) =>
                  onShowHelperTooltip("Tailor your prompt to fit the AI tool you use", e.currentTarget)
                }
                onBlur={onHideHelperTooltip}
              >
                <InfoIcon />
              </span>
            </span>
          </div>
          <div className="wv-settings-tool-list">
            <button
              type="button"
              className="wv-settings-row"
              onClick={() => onTool("claude-code")}
            >
              <span>Claude Code</span>
              <TargetToolToggle selected={tool === "claude-code"} />
            </button>
            <button
              type="button"
              className="wv-settings-row"
              onClick={() => onTool("codex")}
            >
              <span>Codex</span>
              <TargetToolToggle selected={tool === "codex"} />
            </button>
            <button
              type="button"
              className="wv-settings-row"
              onClick={() => onTool("generic")}
            >
              <span>Generic</span>
              <TargetToolToggle selected={tool === "generic"} />
            </button>
          </div>
        </div>

        <div className="wv-settings-section">
          <div className="wv-settings-label-row">
            <span className="wv-settings-label-inline">
              <span>Prompt Style</span>
              <span
                className="wv-settings-help-wrap"
                tabIndex={0}
                aria-label="Prompt style help"
                onMouseEnter={(e) =>
                  onShowHelperTooltip("Choose the level of detail included in your prompt", e.currentTarget)
                }
                onMouseLeave={onHideHelperTooltip}
                onFocus={(e) =>
                  onShowHelperTooltip("Choose the level of detail included in your prompt", e.currentTarget)
                }
                onBlur={onHideHelperTooltip}
              >
                <InfoIcon />
              </span>
            </span>
          </div>
          <div className="wv-settings-seg">
            <button
              type="button"
              className={len === "short" ? "wv-settings-seg-on" : "wv-settings-seg-off"}
              onClick={() => onLen("short")}
            >
              Short
            </button>
            <button
              type="button"
              className={len === "detailed" ? "wv-settings-seg-on" : "wv-settings-seg-off"}
              onClick={() => onLen("detailed")}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      <div className="wv-tray-foot wv-settings-foot">
        <span>{weevarVersionLabel()}</span>
        <GlobeIcon />
      </div>
    </aside>
  );
}

function eventFromWeevarChrome(e: PointerEvent | KeyboardEvent): boolean {
  const path = e.composedPath();
  if (
    path.some((n) => {
      if (!(n instanceof Element)) return false;
      return isInsideWeevarOverlay(n);
    })
  ) {
    return true;
  }
  // Closed shadow + some targets: composedPath can omit inner nodes; retargeted target may still be the host.
  const t = e.target;
  return t instanceof Element && isInsideWeevarOverlay(t);
}

/** True when coordinates hit Weevar UI (dock, trays, etc.), not the host page. */
function pointerOverWeevarChrome(
  e: PointerEvent,
  trayBounds: DOMRect | null = null,
): boolean {
  if (trayBounds && pointInDOMRect(e.clientX, e.clientY, trayBounds)) return true;
  if (eventFromWeevarChrome(e)) return true;
  const top = document.elementFromPoint(e.clientX, e.clientY);
  if (!top) return false;
  if (isInsideWeevarOverlay(top)) return true;
  return (
    top instanceof HTMLElement && top.classList.contains(WEEVAR_BOOT_DOT_CLASS)
  );
}

function Outline({
  rect,
  variant,
}: {
  rect: DOMRect;
  variant: "hover" | "selected";
}) {
  return (
    <div
      className={
        variant === "selected" ? "wv-outline wv-outline-selected" : "wv-outline"
      }
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

function SelectedTopBar({
  rect,
  text,
  onDragStart,
  dragRef,
}: {
  rect: DOMRect;
  text: string;
  onDragStart: (e: React.PointerEvent) => void;
  dragRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const pad = 4;
  let top = rect.top - 30;
  if (top < 4) top = rect.bottom + pad;
  const left = Math.min(Math.max(4, rect.left), window.innerWidth - 260);
  return (
    <div className="wv-selected-top" style={{ left, top }}>
      <div
        ref={dragRef}
        className="wv-drag-handle"
        title="Drag to reorder or move to another container"
        role="presentation"
        onPointerDown={onDragStart}
      >
        <SelectedDragIcon />
      </div>
      <div className="wv-selected-label">{text}</div>
    </div>
  );
}

function CursorHoverLabel({
  x,
  y,
  text,
  avoidRects = [],
}: {
  x: number;
  y: number;
  text: string;
  avoidRects?: DOMRect[];
}) {
  const placement = placeCursorHoverLabel(x, y, text, avoidRects);
  if (!placement) return null;
  return (
    <div className="wv-cursor-label" style={{ left: placement.left, top: placement.top }}>
      {text}
    </div>
  );
}

function SelectedDragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.75 4.75H9.755V4.755H9.75V4.75Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4.75C10 4.8163 9.97366 4.87989 9.92678 4.92678C9.87989 4.97366 9.8163 5 9.75 5C9.6837 5 9.62011 4.97366 9.57322 4.92678C9.52634 4.87989 9.5 4.8163 9.5 4.75C9.5 4.6837 9.52634 4.62011 9.57322 4.57322C9.62011 4.52634 9.6837 4.5 9.75 4.5C9.8163 4.5 9.87989 4.52634 9.92678 4.57322C9.97366 4.62011 10 4.6837 10 4.75ZM9.75 7.995H9.755V8H9.75V7.995Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7.995C10 8.0613 9.97366 8.12489 9.92678 8.17177C9.87989 8.21866 9.8163 8.245 9.75 8.245C9.6837 8.245 9.62011 8.21866 9.57322 8.17177C9.52634 8.12489 9.5 8.0613 9.5 7.995C9.5 7.92869 9.52634 7.8651 9.57322 7.81822C9.62011 7.77133 9.6837 7.745 9.75 7.745C9.8163 7.745 9.87989 7.77133 9.92678 7.81822C9.97366 7.8651 10 7.92869 10 7.995ZM9.75 11.25H9.755V11.255H9.75V11.25Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11.25C10 11.3163 9.97366 11.3799 9.92678 11.4268C9.87989 11.4737 9.8163 11.5 9.75 11.5C9.6837 11.5 9.62011 11.4737 9.57322 11.4268C9.52634 11.3799 9.5 11.3163 9.5 11.25C9.5 11.1837 9.52634 11.1201 9.57322 11.0732C9.62011 11.0263 9.6837 11 9.75 11C9.8163 11 9.87989 11.0263 9.92678 11.0732C9.97366 11.1201 10 11.1837 10 11.25ZM6.25 4.75H6.255V4.755H6.25V4.75Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 4.75C6.5 4.8163 6.47366 4.87989 6.42678 4.92678C6.37989 4.97366 6.3163 5 6.25 5C6.1837 5 6.12011 4.97366 6.07322 4.92678C6.02634 4.87989 6 4.8163 6 4.75C6 4.6837 6.02634 4.62011 6.07322 4.57322C6.12011 4.52634 6.1837 4.5 6.25 4.5C6.3163 4.5 6.37989 4.52634 6.42678 4.57322C6.47366 4.62011 6.5 4.6837 6.5 4.75ZM6.25 7.995H6.255V8H6.25V7.995Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7.995C6.5 8.0613 6.47366 8.12489 6.42678 8.17177C6.37989 8.21866 6.3163 8.245 6.25 8.245C6.1837 8.245 6.12011 8.21866 6.07322 8.17177C6.02634 8.12489 6 8.0613 6 7.995C6 7.92869 6.02634 7.8651 6.07322 7.81822C6.12011 7.77133 6.1837 7.745 6.25 7.745C6.3163 7.745 6.37989 7.77133 6.42678 7.81822C6.47366 7.8651 6.5 7.92869 6.5 7.995ZM6.25 11.25H6.255V11.255H6.25V11.25Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 11.25C6.5 11.3163 6.47366 11.3799 6.42678 11.4268C6.37989 11.4737 6.3163 11.5 6.25 11.5C6.1837 11.5 6.12011 11.4737 6.07322 11.4268C6.02634 11.3799 6 11.3163 6 11.25C6 11.1837 6.02634 11.1201 6.07322 11.0732C6.12011 11.0263 6.1837 11 6.25 11C6.3163 11 6.37989 11.0263 6.42678 11.0732C6.47366 11.1201 6.5 11.1837 6.5 11.25Z" stroke="#EBEBEB" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CornerMarkers({ rect }: { rect: DOMRect }) {
  const o = 2;
  const s = 4;
  const box: CSSProperties = {
    position: "fixed",
    left: rect.left - o,
    top: rect.top - o,
    width: rect.width + o * 2,
    height: rect.height + o * 2,
    pointerEvents: "none",
    zIndex: 4,
  };
  const corner: CSSProperties = {
    position: "absolute",
    width: s,
    height: s,
    background: "var(--wv-accent)",
  };
  return (
    <div style={box}>
      <span style={{ ...corner, left: 0, top: 0 }} />
      <span style={{ ...corner, right: 0, top: 0 }} />
      <span style={{ ...corner, left: 0, bottom: 0 }} />
      <span style={{ ...corner, right: 0, bottom: 0 }} />
    </div>
  );
}

function IconBase({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function LogomarkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4.67677 16C4.05948 16 3.54321 15.7266 3.12795 15.1797C2.71268 14.6328 2.50505 13.8839 2.50505 12.9328C2.50505 12.4454 2.55556 11.8985 2.65657 11.2922C2.75758 10.674 2.87542 10.0498 3.0101 9.41975C3.14478 8.78967 3.26263 8.20119 3.36364 7.65432C3.46465 7.09556 3.51515 6.63192 3.51515 6.26338C3.51515 6.00183 3.48148 5.79973 3.41414 5.65706C3.3468 5.50252 3.22334 5.42524 3.04377 5.42524C2.90909 5.42524 2.75196 5.49063 2.57239 5.6214C2.39282 5.75217 2.25814 6.00777 2.16835 6.3882L2 6.31687C2 5.29447 2.21886 4.48605 2.65657 3.89163C3.1055 3.29721 3.70595 3 4.45791 3C5.16498 3 5.6532 3.24371 5.92256 3.73114C6.20314 4.21856 6.34343 4.83082 6.34343 5.5679C6.34343 6.11477 6.28732 6.6973 6.17508 7.3155C6.07407 7.9337 5.95623 8.5519 5.82155 9.1701C5.68687 9.77641 5.56341 10.3411 5.45118 10.8642C5.35017 11.3873 5.29966 11.8212 5.29966 12.166C5.29966 12.6772 5.42312 12.9328 5.67003 12.9328C5.81594 12.9328 6.01235 12.8258 6.25926 12.6118C6.50617 12.3859 6.76431 12.0828 7.03367 11.7023C7.31425 11.31 7.58361 10.8701 7.84175 10.3827C8.09989 9.8834 8.31874 9.36031 8.49832 8.81344C8.47587 8.5519 8.45903 8.30224 8.44781 8.06447C8.43659 7.81481 8.43098 7.59488 8.43098 7.40466C8.43098 6.45359 8.51515 5.68679 8.6835 5.10425C8.86308 4.52172 9.08754 4.09374 9.3569 3.8203C9.62626 3.54687 9.90123 3.41015 10.1818 3.41015C10.5746 3.41015 10.9282 3.64198 11.2424 4.10562C11.5567 4.55738 11.7138 5.17558 11.7138 5.96022C11.7138 6.44765 11.6296 6.99451 11.4613 7.60082C11.2929 8.19524 11.0123 8.83128 10.6195 9.50892C10.5859 10.5313 10.6925 11.3576 10.9394 11.9877C11.1863 12.6177 11.4949 12.9328 11.8653 12.9328C12.101 12.9328 12.3535 12.808 12.6229 12.5583C12.9035 12.2968 13.1616 11.9401 13.3973 11.4883C13.633 11.0247 13.8238 10.4897 13.9697 9.8834C14.1268 9.27709 14.2054 8.62917 14.2054 7.93964C14.2054 7.53544 14.1773 7.1134 14.1212 6.67353C14.0763 6.23365 14.0146 5.81161 13.936 5.40741C13.8687 5.0032 13.7957 4.67032 13.7172 4.40878C13.7172 4.20668 13.7957 4.00457 13.9529 3.80247C14.1212 3.58848 14.3345 3.41015 14.5926 3.26749C14.8507 3.11294 15.1145 3.03566 15.3838 3.03566C15.6532 3.03566 15.9113 3.13672 16.1582 3.33882C16.4052 3.54092 16.6072 3.89758 16.7643 4.40878C16.9214 4.90809 17 5.6214 17 6.5487C17 7.84454 16.8429 9.0631 16.5286 10.2044C16.2144 11.3338 15.7879 12.3324 15.2492 13.2003C14.7217 14.0681 14.138 14.7517 13.4983 15.251C12.8586 15.7385 12.2076 15.9822 11.5455 15.9822C10.9618 15.9822 10.4792 15.792 10.0976 15.4115C9.71605 15.0311 9.41863 14.5199 9.20539 13.8779C8.99214 13.2359 8.84063 12.5226 8.75084 11.738C8.3468 12.7604 7.90909 13.5866 7.43771 14.2167C6.96633 14.8349 6.49495 15.2867 6.02357 15.572C5.55219 15.8573 5.10325 16 4.67677 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
function AIToolIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.36207 2.61103C5.50334 2.04084 6.31408 2.04084 6.45536 2.61103C6.75047 3.80492 7.36605 4.89554 8.23567 5.76515C9.10528 6.63476 10.1959 7.25035 11.3898 7.54546C11.96 7.68674 11.96 8.49747 11.3898 8.63875L11.1626 8.69793C10.018 9.02356 8.9798 9.64591 8.15316 10.5019C7.32652 11.358 6.74081 12.4173 6.45536 13.5725L6.42099 13.6731C6.22881 14.1096 5.58798 14.1096 5.39643 13.6731L5.36207 13.5732C5.07656 12.4178 4.49075 11.3585 3.66399 10.5024C2.83724 9.6464 1.7989 9.02409 0.65419 8.69857L0.427642 8.63875C-0.142547 8.49747 -0.142547 7.68674 0.427642 7.54546C1.62153 7.25035 2.71214 6.63476 3.58176 5.76515C4.45137 4.89554 5.06696 3.80492 5.36207 2.61103ZM10.882 0.206184C10.9424 -0.0687282 11.3344 -0.0687282 11.3949 0.206184C11.5249 0.793001 11.8197 1.33051 12.2447 1.75551C12.6697 2.18051 13.2072 2.47533 13.794 2.60531C14.0695 2.6664 14.0695 3.05777 13.794 3.11886L13.6737 3.15004C13.1131 3.29756 12.6039 3.59663 12.202 4.01444C11.8002 4.43225 11.5211 4.95267 11.3955 5.51862L11.3796 5.56698C11.2924 5.77698 10.9838 5.77698 10.8966 5.56698L10.882 5.51862C10.7604 4.96963 10.4943 4.46308 10.1114 4.05137C9.72842 3.63965 9.24243 3.33771 8.70366 3.17677L8.48156 3.11886C8.20665 3.05777 8.20665 2.6664 8.48156 2.60531C9.06862 2.47554 9.60639 2.18082 10.0316 1.7558C10.4569 1.33079 10.7519 0.793166 10.882 0.206184Z"
        fill="#111113"
      />
    </svg>
  );
}

function DocumentationIcon() {
  return (
    <svg
      width="24"
      height="30"
      viewBox="0 0 24 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M12 0L12.1755 0.0105C12.5103 0.0499858 12.8221 0.201119 13.0605 0.439517C13.2989 0.677915 13.45 0.989675 13.4895 1.3245L13.5 1.5V7.5L13.5075 7.725C13.5612 8.43926 13.8686 9.11074 14.3743 9.61805C14.8799 10.1253 15.5504 10.435 16.2645 10.491L16.5 10.5H22.5L22.6755 10.5105C23.0103 10.55 23.3221 10.7011 23.5605 10.9395C23.7989 11.1779 23.95 11.4897 23.9895 11.8245L24 12V25.5C24.0001 26.6478 23.5615 27.7523 22.7741 28.5874C21.9866 29.4225 20.9098 29.9252 19.764 29.9925L19.5 30H4.5C3.35218 30.0001 2.24773 29.5615 1.41261 28.7741C0.57749 27.9866 0.0748387 26.9098 0.00750018 25.764L6.99067e-09 25.5V4.5C-6.39326e-05 3.35218 0.438488 2.24773 1.22593 1.41261C2.01336 0.57749 3.09016 0.0748387 4.236 0.00750017L4.5 0H12Z" fill="#F8563F"/>
      <path d="M22.5 7.49979H16.5L16.4985 1.49829L22.5 7.49979Z" fill="#D1402A"/>
      <path d="M12 24C14.7614 24 17 21.7614 17 19C17 16.2386 14.7614 14 12 14C9.23858 14 7 16.2386 7 19C7 21.7614 9.23858 24 12 24Z" stroke="#FFEAE7" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.9998 14.5H10.4998C9.5248 17.42 9.5248 20.58 10.4998 23.5H9.9998" stroke="#FFEAE7" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 14.5C14.475 17.42 14.475 20.58 13.5 23.5" stroke="#FFEAE7" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 21V20.5C10.42 21.475 13.58 21.475 16.5 20.5V21" stroke="#FFEAE7" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 17.5C10.42 16.525 13.58 16.525 16.5 17.5" stroke="#FFEAE7" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PointerIcon() {
  return (
    <Icon18Base className="wv-icon-pointer">
      <path d="M3.10071 5.81125L5.72984 14.2829C6.3524 16.2942 9.18745 16.323 9.85312 14.326L10.6289 11.9986C10.8444 11.3521 11.3521 10.8444 11.9986 10.6289L14.326 9.85312C16.323 9.18745 16.2894 6.35719 14.2829 5.72984L5.81125 3.10071C4.1447 2.58351 2.58351 4.1447 3.10071 5.81125Z" />
    </Icon18Base>
  );
}
function PromptIcon() {
  return (
    <Icon18Base className="wv-icon-prompt">
      <path d="M11.4 3H6.6C4.2 3 3 4.2 3 6.6V14.4C3 14.73 3.27 15 3.6 15H11.4C13.8 15 15 13.8 15 11.4V6.6C15 4.2 13.8 3 11.4 3Z" />
      <path d="M6 8H12" />
      <path d="M6 11H10" />
    </Icon18Base>
  );
}
function TrashIcon() {
  return (
    <Icon18Base>
      <path d="M14.625 4.125L14.16 11.6437C14.0415 13.5645 13.9823 14.5253 13.5 15.216C13.2619 15.5574 12.9554 15.8455 12.6 16.062C11.8822 16.5 10.92 16.5 8.9955 16.5C7.068 16.5 6.10425 16.5 5.385 16.0613C5.02942 15.8443 4.72291 15.5557 4.485 15.2137C4.0035 14.5222 3.945 13.56 3.8295 11.6363L3.375 4.125M2.25 4.125H15.75M12.042 4.125L11.5298 3.069C11.19 2.367 11.0198 2.01675 10.7265 1.79775C10.6614 1.74924 10.5924 1.70609 10.5203 1.66875C10.1955 1.5 9.8055 1.5 9.02625 1.5C8.22675 1.5 7.827 1.5 7.49625 1.6755C7.42314 1.71466 7.3534 1.75981 7.28775 1.8105C6.9915 2.03775 6.82575 2.4015 6.49425 3.12825L6.03975 4.125M7.125 12.375V7.875M10.875 12.375V7.875" />
    </Icon18Base>
  );
}
function SettingsIcon() {
  return (
    <Icon18Base>
      <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" />
      <path d="M1.5 9.66007V8.34007C1.5 7.56007 2.1375 6.91507 2.925 6.91507C4.2825 6.91507 4.8375 5.95507 4.155 4.77757C3.765 4.10257 3.9975 3.22507 4.68 2.83507L5.9775 2.09257C6.57 1.74007 7.335 1.95007 7.6875 2.54257L7.77 2.68507C8.445 3.86257 9.555 3.86257 10.2375 2.68507L10.32 2.54257C10.6725 1.95007 11.4375 1.74007 12.03 2.09257L13.3275 2.83507C14.01 3.22507 14.2425 4.10257 13.8525 4.77757C13.17 5.95507 13.725 6.91507 15.0825 6.91507C15.8625 6.91507 16.5075 7.55257 16.5075 8.34007V9.66007C16.5075 10.4401 15.87 11.0851 15.0825 11.0851C13.725 11.0851 13.17 12.0451 13.8525 13.2226C14.2425 13.9051 14.01 14.7751 13.3275 15.1651L12.03 15.9076C11.4375 16.2601 10.6725 16.0501 10.32 15.4576L10.2375 15.3151C9.5625 14.1376 8.4525 14.1376 7.77 15.3151L7.6875 15.4576C7.335 16.0501 6.57 16.2601 5.9775 15.9076L4.68 15.1651C3.9975 14.7751 3.765 13.8976 4.155 13.2226C4.8375 12.0451 4.2825 11.0851 2.925 11.0851C2.1375 11.0851 1.5 10.4401 1.5 9.66007Z" />
    </Icon18Base>
  );
}
function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M4.22704 13.773C5.44853 14.9945 7.13602 15.75 9 15.75C12.7279 15.75 15.75 12.7279 15.75 9C15.75 5.27209 12.7279 2.25 9 2.25C7.13602 2.25 5.44853 3.00552 4.22704 4.22704C3.60528 4.84879 2.25 6.375 2.25 6.375" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.25 3.375V6.375H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M13.773 13.773C12.5515 14.9945 10.864 15.75 9 15.75C5.27209 15.75 2.25 12.7279 2.25 9C2.25 5.27209 5.27209 2.25 9 2.25C10.864 2.25 12.5515 3.00552 13.773 4.22704C14.3947 4.84879 15.75 6.375 15.75 6.375" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.75 3.375V6.375H12.75" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function DragDotsIcon() {
  return (
    <Icon18Base>
      <path d="M13.875 11.625L13.875 11.6317L13.8683 11.6317L13.8683 11.625L13.875 11.625Z" />
      <path d="M13.875 12C13.7755 12 13.6802 11.9605 13.6098 11.8902C13.5395 11.8198 13.5 11.7245 13.5 11.625C13.5 11.5255 13.5395 11.4302 13.6098 11.3598C13.6802 11.2895 13.7755 11.25 13.875 11.25C13.9745 11.25 14.0698 11.2895 14.1402 11.3598C14.2105 11.4302 14.25 11.5255 14.25 11.625C14.25 11.7245 14.2105 11.8198 14.1402 11.8902C14.0698 11.9605 13.9745 12 13.875 12ZM9.0075 11.625L9.0075 11.6325L9 11.6325L9 11.625L9.0075 11.625Z" />
      <path d="M9.00732 12C8.90787 12 8.81249 11.9605 8.74216 11.8902C8.67183 11.8198 8.63232 11.7245 8.63232 11.625C8.63232 11.5255 8.67183 11.4302 8.74216 11.3598C8.81249 11.2895 8.90787 11.25 9.00732 11.25C9.10678 11.25 9.20216 11.2895 9.27249 11.3598C9.34282 11.4302 9.38232 11.5255 9.38232 11.625C9.38232 11.7245 9.34282 11.8198 9.27249 11.8902C9.20216 11.9605 9.10678 12 9.00732 12ZM4.12482 11.625L4.12482 11.6325L4.11732 11.6325L4.11732 11.625L4.12482 11.625Z" />
      <path d="M4.125 12C4.02554 12 3.93016 11.9605 3.85984 11.8902C3.78951 11.8198 3.75 11.7245 3.75 11.625C3.75 11.5255 3.78951 11.4302 3.85984 11.3598C3.93016 11.2895 4.02554 11.25 4.125 11.25C4.22446 11.25 4.31984 11.2895 4.39017 11.3598C4.46049 11.4302 4.5 11.5255 4.5 11.625C4.5 11.7245 4.46049 11.8198 4.39017 11.8902C4.31984 11.9605 4.22446 12 4.125 12ZM13.875 6.375L13.875 6.3825L13.8675 6.3825L13.8675 6.375L13.875 6.375Z" />
      <path d="M13.875 6.75C13.7755 6.75 13.6802 6.71049 13.6098 6.64017C13.5395 6.56984 13.5 6.47446 13.5 6.375C13.5 6.27554 13.5395 6.18016 13.6098 6.10984C13.6802 6.03951 13.7755 6 13.875 6C13.9745 6 14.0698 6.03951 14.1402 6.10984C14.2105 6.18016 14.25 6.27554 14.25 6.375C14.25 6.47446 14.2105 6.56984 14.1402 6.64017C14.0698 6.71049 13.9745 6.75 13.875 6.75ZM9.0075 6.375L9.0075 6.3825L9 6.3825L9 6.375L9.0075 6.375Z" />
      <path d="M9.00732 6.75C8.90787 6.75 8.81249 6.71049 8.74216 6.64017C8.67183 6.56984 8.63232 6.47446 8.63232 6.375C8.63232 6.27554 8.67183 6.18016 8.74216 6.10984C8.81249 6.03951 8.90787 6 9.00732 6C9.10678 6 9.20216 6.03951 9.27249 6.10984C9.34282 6.18016 9.38232 6.27554 9.38232 6.375C9.38232 6.47446 9.34282 6.56984 9.27249 6.64017C9.20216 6.71049 9.10678 6.75 9.00732 6.75ZM4.12482 6.375L4.12482 6.3825L4.11732 6.3825L4.11732 6.375L4.12482 6.375Z" />
      <path d="M4.125 6.75C4.02554 6.75 3.93016 6.71049 3.85984 6.64017C3.78951 6.56984 3.75 6.47446 3.75 6.375C3.75 6.27554 3.78951 6.18016 3.85984 6.10984C3.93016 6.03951 4.02554 6 4.125 6C4.22446 6 4.31984 6.03951 4.39017 6.10984C4.46049 6.18016 4.5 6.27554 4.5 6.375C4.5 6.47446 4.46049 6.56984 4.39017 6.64017C4.31984 6.71049 4.22446 6.75 4.125 6.75Z" />
    </Icon18Base>
  );
}
function CloseIcon() {
  return (
    <Icon18Base>
      <path d="M4 14.0002L14.0002 4.00005" />
      <path d="M14.0002 13.9999L4 3.99976" />
    </Icon18Base>
  );
}

function InfoIcon() {
  return (
    <svg
      className="wv-settings-info-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7.00008 12.8334C10.2084 12.8334 12.8334 10.2084 12.8334 7.00008C12.8334 3.79175 10.2084 1.16675 7.00008 1.16675C3.79175 1.16675 1.16675 3.79175 1.16675 7.00008C1.16675 10.2084 3.79175 12.8334 7.00008 12.8334Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4.66675V7.58341"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.99683 9.33325H7.00207"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetToolToggle({ selected }: { selected: boolean }) {
  return selected ? (
    <svg
      className="wv-settings-toggle-svg wv-settings-toggle-svg-on"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <g clipPath="url(#wv-toggle-selected-clip)">
        <path
          d="M18.125 14.375L18.2322 14.2678C19.3641 13.1359 20 11.6007 20 9.99996C20 8.39921 19.3641 6.86402 18.2322 5.73212L18.125 5.62493C16.9244 4.4243 15.2963 3.74992 13.5984 3.74992L6.40151 3.74992C4.7038 3.75044 3.07573 4.42483 1.87491 5.62493L1.76773 5.73212C0.63583 6.86402 -5.98136e-05 8.39921 -5.96737e-05 9.99996C-5.95337e-05 11.6007 0.635831 13.1359 1.76773 14.2678L1.87492 14.375C3.07573 15.5751 4.7038 16.2495 6.40151 16.25L13.5984 16.25C15.2961 16.2495 16.9242 15.5751 18.125 14.375Z"
          fill="#EBEBEB"
          fillOpacity="0.05"
        />
        <path
          d="M15.9154 13.75C14.9209 14.3242 13.7389 14.4798 12.6297 14.1825C11.5204 13.8853 10.5746 13.1595 10.0004 12.165C9.42621 11.1704 9.27062 9.98846 9.56786 8.87917C9.86511 7.76989 10.5908 6.82412 11.5854 6.24992C12.0779 5.9656 12.6215 5.78107 13.1853 5.70686C13.7491 5.63264 14.3219 5.6702 14.8712 5.81738C15.9805 6.11463 16.9263 6.84036 17.5005 7.83493C18.0747 8.8295 18.2302 10.0114 17.933 11.1207C17.6357 12.23 16.91 13.1758 15.9154 13.75Z"
          fill="#35C759"
        />
        <path
          d="M15.9154 13.75C14.9209 14.3242 13.7389 14.4798 12.6297 14.1825C11.5204 13.8853 10.5746 13.1595 10.0004 12.165C9.42621 11.1704 9.27062 9.98846 9.56786 8.87917C9.86511 7.76989 10.5908 6.82412 11.5854 6.24992C12.0779 5.9656 12.6215 5.78107 13.1853 5.70686C13.7491 5.63264 14.3219 5.6702 14.8712 5.81738C15.9805 6.11463 16.9263 6.84036 17.5005 7.83493C18.0747 8.8295 18.2302 10.0114 17.933 11.1207C17.6357 12.23 16.91 13.1758 15.9154 13.75Z"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.25"
        />
      </g>
      <defs>
        <clipPath id="wv-toggle-selected-clip">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg
      className="wv-settings-toggle-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <g clipPath="url(#wv-toggle-unselected-clip)">
        <path
          d="M1.87498 5.62501L1.76779 5.7322C0.635893 6.86411 2.56136e-06 8.39929 2.84125e-06 10C3.12113e-06 11.6008 0.635894 13.136 1.76779 14.2679L1.87498 14.3751C3.07561 15.5757 4.70375 16.2501 6.40157 16.2501L13.5985 16.2501C15.2962 16.2496 16.9243 15.5752 18.1251 14.3751L18.2323 14.2679C19.3642 13.136 20.0001 11.6008 20.0001 10C20.0001 8.39929 19.3642 6.8641 18.2323 5.7322L18.1251 5.62501C16.9243 4.42491 15.2962 3.75053 13.5985 3.75L6.40157 3.75C4.70387 3.75053 3.07579 4.42491 1.87498 5.62501Z"
          fill="#EBEBEB"
          fillOpacity="0.05"
        />
        <path
          d="M4.08456 6.25003C5.07913 5.67583 6.26106 5.52024 7.37034 5.81749C8.47963 6.11474 9.4254 6.84047 9.9996 7.83504C10.5738 8.82961 10.7294 10.0115 10.4321 11.1208C10.1349 12.2301 9.40916 13.1759 8.41459 13.7501C7.92213 14.0344 7.37849 14.2189 6.81471 14.2931C6.25094 14.3674 5.67806 14.3298 5.1288 14.1826C4.01952 13.8854 3.07374 13.1596 2.49955 12.1651C1.92535 11.1705 1.76976 9.98857 2.06701 8.87929C2.36425 7.77 3.08999 6.82423 4.08456 6.25003Z"
          fill="#58585D"
        />
      </g>
      <defs>
        <clipPath id="wv-toggle-unselected-clip">
          <rect width="20" height="20" fill="white" transform="translate(20 20) rotate(180)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function Icon18Base({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 18"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}
function CollapseIcon() {
  return (
    <IconBase>
      <path d="M8 6v12M16 8v8" />
    </IconBase>
  );
}
function WeevarWordmarkIcon() {
  return (
    <svg
      className="wv-tray-logo"
      width="48"
      height="10"
      viewBox="0 0 48 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Weevar"
    >
      <path d="M2.16888 9.97264C1.66872 9.97264 1.2504 9.76288 0.913931 9.34336C0.577459 8.92385 0.409223 8.34929 0.409223 7.6197C0.409223 7.24578 0.450145 6.82627 0.531989 6.36115C0.613834 5.88691 0.709319 5.40812 0.818445 4.92476C0.927571 4.4414 1.02306 3.98997 1.1049 3.57045C1.18675 3.14181 1.22767 2.78614 1.22767 2.50342C1.22767 2.30278 1.20039 2.14774 1.14582 2.0383C1.09126 1.91974 0.991228 1.86047 0.845727 1.86047C0.736601 1.86047 0.609287 1.91062 0.463786 2.01094C0.318284 2.11126 0.209158 2.30734 0.136408 2.59918L0 2.54446C0 1.76015 0.17733 1.13999 0.531989 0.683995C0.895743 0.227998 1.38226 0 1.99155 0C2.56446 0 2.96004 0.186959 3.1783 0.560876C3.40564 0.934793 3.51931 1.40447 3.51931 1.9699C3.51931 2.38942 3.47385 2.8363 3.38291 3.31053C3.30106 3.78477 3.20558 4.25901 3.09645 4.73324C2.98733 5.19836 2.88729 5.63155 2.79635 6.03283C2.71451 6.43411 2.67359 6.76699 2.67359 7.03146C2.67359 7.42362 2.77362 7.6197 2.97368 7.6197C3.0919 7.6197 3.25105 7.53762 3.45111 7.37346C3.65118 7.20018 3.86033 6.96762 4.07859 6.67579C4.30593 6.37483 4.52418 6.03739 4.73334 5.66347C4.9425 5.28044 5.11983 4.87916 5.26533 4.45964C5.24714 4.25901 5.2335 4.06749 5.22441 3.88509C5.21531 3.69357 5.21077 3.52485 5.21077 3.37893C5.21077 2.64934 5.27897 2.0611 5.41538 1.61423C5.56088 1.16735 5.74276 0.839033 5.96101 0.629275C6.17926 0.419517 6.40206 0.314637 6.62941 0.314637C6.94769 0.314637 7.23415 0.492476 7.48877 0.848153C7.7434 1.19471 7.87072 1.66895 7.87072 2.27086C7.87072 2.64478 7.80251 3.0643 7.6661 3.52941C7.5297 3.98541 7.30235 4.47332 6.98407 4.99316C6.95678 5.77747 7.04318 6.41131 7.24324 6.89466C7.44331 7.37802 7.69339 7.6197 7.99348 7.6197C8.18445 7.6197 8.38906 7.52394 8.60732 7.33242C8.83466 7.13178 9.04382 6.85819 9.23479 6.51163C9.42576 6.15595 9.58036 5.74555 9.69858 5.28044C9.82589 4.81532 9.88955 4.31829 9.88955 3.78933C9.88955 3.47925 9.86681 3.15549 9.82134 2.81806C9.78497 2.48062 9.73495 2.15686 9.67129 1.84678C9.61673 1.53671 9.55762 1.28135 9.49396 1.08071C9.49396 0.925672 9.55762 0.770634 9.68494 0.615595C9.82134 0.451437 9.99413 0.314637 10.2033 0.205198C10.4124 0.086639 10.6261 0.0273594 10.8444 0.0273594C11.0627 0.0273594 11.2718 0.104879 11.4719 0.259918C11.6719 0.414957 11.8356 0.688555 11.9629 1.08071C12.0903 1.46375 12.1539 2.01094 12.1539 2.7223C12.1539 3.71637 12.0266 4.65116 11.772 5.52668C11.5173 6.39307 11.1718 7.15914 10.7353 7.8249C10.3079 8.49065 9.83498 9.01505 9.31663 9.39808C8.79829 9.772 8.27084 9.95896 7.73431 9.95896C7.26143 9.95896 6.87039 9.81304 6.5612 9.5212C6.25201 9.22937 6.01103 8.83721 5.83824 8.34473C5.66546 7.85226 5.54269 7.30506 5.46994 6.70315C5.14256 7.48746 4.7879 8.12129 4.40596 8.60465C4.02402 9.07889 3.64208 9.42544 3.26014 9.64432C2.8782 9.8632 2.51445 9.97264 2.16888 9.97264Z" fill="currentColor" />
      <path d="M15.4244 10C14.7605 10 14.2104 9.86776 13.7739 9.60328C13.3374 9.32969 13.01 8.97401 12.7917 8.53625C12.5735 8.08938 12.4643 7.61058 12.4643 7.09986C12.4643 6.61651 12.5553 6.13315 12.7372 5.64979C12.9281 5.15732 13.2009 4.71044 13.5556 4.30917C13.9194 3.90789 14.3559 3.58413 14.8651 3.33789C15.3835 3.09166 15.9655 2.96854 16.6111 2.96854C17.4114 2.96854 17.9934 3.15093 18.3572 3.51573C18.73 3.87141 18.9164 4.30461 18.9164 4.81532C18.9164 5.25308 18.7982 5.65891 18.5618 6.03283C18.3344 6.39763 18.0298 6.69403 17.6478 6.92202C17.2659 7.1409 16.8476 7.25034 16.3929 7.25034C16.1564 7.25034 15.9155 7.21386 15.6699 7.1409C15.4244 7.06794 15.1834 6.95394 14.947 6.79891C14.9924 7.36434 15.1561 7.77474 15.438 8.0301C15.7199 8.28545 16.0564 8.41313 16.4474 8.41313C16.7203 8.41313 16.9931 8.36297 17.2659 8.26265C17.5387 8.15321 17.7888 8.01642 18.0161 7.85226C18.2526 7.67898 18.4344 7.49658 18.5618 7.30506L18.6572 7.37346C18.6572 7.8477 18.5572 8.25353 18.3572 8.59097C18.1662 8.91929 17.9116 9.18833 17.5933 9.39808C17.275 9.60784 16.9249 9.76288 16.5429 9.8632C16.1701 9.9544 15.7972 10 15.4244 10ZM15.7381 6.30643C16.0291 6.30643 16.2656 6.22435 16.4474 6.06019C16.6293 5.88691 16.7657 5.68627 16.8567 5.45828C16.9476 5.23028 16.9931 5.02964 16.9931 4.85636C16.9931 4.6466 16.934 4.47332 16.8157 4.33653C16.6975 4.19061 16.5338 4.11765 16.3247 4.11765C16.161 4.11765 15.9791 4.17693 15.779 4.29549C15.5881 4.41404 15.4153 4.61924 15.2607 4.91108C15.1061 5.1938 15.0061 5.59052 14.9606 6.10123C15.2516 6.23803 15.5108 6.30643 15.7381 6.30643Z" fill="currentColor" />
      <path d="M22.5378 10C21.874 10 21.3238 9.86776 20.8873 9.60328C20.4508 9.32969 20.1234 8.97401 19.9052 8.53625C19.6869 8.08938 19.5778 7.61058 19.5778 7.09986C19.5778 6.61651 19.6687 6.13315 19.8506 5.64979C20.0416 5.15732 20.3144 4.71044 20.669 4.30917C21.0328 3.90789 21.4693 3.58413 21.9786 3.33789C22.4969 3.09166 23.0789 2.96854 23.7246 2.96854C24.5248 2.96854 25.1068 3.15093 25.4706 3.51573C25.8434 3.87141 26.0299 4.30461 26.0299 4.81532C26.0299 5.25308 25.9116 5.65891 25.6752 6.03283C25.4479 6.39763 25.1432 6.69403 24.7613 6.92202C24.3793 7.1409 23.961 7.25034 23.5063 7.25034C23.2699 7.25034 23.0289 7.21386 22.7834 7.1409C22.5378 7.06794 22.2968 6.95394 22.0604 6.79891C22.1059 7.36434 22.2696 7.77474 22.5515 8.0301C22.8334 8.28545 23.1698 8.41313 23.5609 8.41313C23.8337 8.41313 24.1065 8.36297 24.3793 8.26265C24.6521 8.15321 24.9022 8.01642 25.1296 7.85226C25.366 7.67898 25.5479 7.49658 25.6752 7.30506L25.7707 7.37346C25.7707 7.8477 25.6707 8.25353 25.4706 8.59097C25.2796 8.91929 25.025 9.18833 24.7067 9.39808C24.3884 9.60784 24.0383 9.76288 23.6564 9.8632C23.2835 9.9544 22.9107 10 22.5378 10ZM22.8516 6.30643C23.1426 6.30643 23.379 6.22435 23.5609 6.06019C23.7428 5.88691 23.8792 5.68627 23.9701 5.45828C24.061 5.23028 24.1065 5.02964 24.1065 4.85636C24.1065 4.6466 24.0474 4.47332 23.9292 4.33653C23.811 4.19061 23.6473 4.11765 23.4381 4.11765C23.2744 4.11765 23.0926 4.17693 22.8925 4.29549C22.7015 4.41404 22.5287 4.61924 22.3741 4.91108C22.2195 5.1938 22.1195 5.59052 22.074 6.10123C22.365 6.23803 22.6242 6.30643 22.8516 6.30643Z" fill="currentColor" />
      <path d="M28.751 9.95896C28.2235 9.95896 27.8052 9.82216 27.496 9.54856C27.1868 9.26585 27.0322 8.83265 27.0322 8.24897C27.0322 7.91154 27.0732 7.5513 27.155 7.16826C27.246 6.78523 27.3323 6.44323 27.4142 6.14227C27.496 5.85043 27.5597 5.59508 27.6052 5.3762C27.6597 5.15732 27.687 4.9886 27.687 4.87004C27.687 4.72412 27.6552 4.61924 27.5915 4.5554C27.5279 4.49156 27.4506 4.45964 27.3596 4.45964C27.1414 4.45964 26.9595 4.56452 26.814 4.77428L26.7594 4.71956C26.7685 4.40948 26.8686 4.12677 27.0595 3.87141C27.2505 3.60693 27.496 3.39717 27.7961 3.24213C28.0962 3.0871 28.4009 3.00958 28.7101 3.00958C29.0556 3.00958 29.3512 3.11446 29.5967 3.32421C29.8422 3.52485 29.9559 3.84405 29.9377 4.28181C29.9286 4.47332 29.8923 4.715 29.8286 5.00684C29.774 5.29868 29.6967 5.64523 29.5967 6.04651C29.533 6.30187 29.4648 6.59371 29.3921 6.92202C29.3284 7.24122 29.2966 7.53306 29.2966 7.79754C29.2966 7.99818 29.3284 8.15777 29.3921 8.27633C29.4558 8.39489 29.5603 8.45417 29.7058 8.45417C29.8968 8.45417 30.106 8.34929 30.3333 8.13953C30.5697 7.92066 30.7744 7.56954 30.9471 7.08618C31.1199 6.59371 31.22 5.94163 31.2472 5.12996C31.2745 4.5098 31.2336 4.05837 31.1245 3.77565V3.70725C31.2063 3.57957 31.3291 3.45645 31.4928 3.33789C31.6656 3.21933 31.8565 3.12357 32.0657 3.05062C32.2748 2.96854 32.4704 2.9275 32.6522 2.9275C32.9432 2.9275 33.1888 3.06886 33.3888 3.35157C33.598 3.63429 33.6889 4.12677 33.6617 4.829C33.6435 5.50388 33.5207 6.11491 33.2934 6.66211C33.0751 7.2093 32.7886 7.6881 32.434 8.0985C32.0793 8.50889 31.6883 8.85089 31.2609 9.12449C30.8426 9.39808 30.4152 9.60784 29.9786 9.75376C29.5421 9.89056 29.1329 9.95896 28.751 9.95896Z" fill="currentColor" />
      <path d="M39.2501 9.97264C38.9318 9.97264 38.6545 9.86776 38.418 9.658C38.1816 9.44824 38.0634 9.10625 38.0634 8.63201C38.0634 8.58641 38.0634 8.54081 38.0634 8.49521C38.0634 8.44961 38.0679 8.40401 38.077 8.35841C37.8042 8.90561 37.495 9.31145 37.1494 9.57592C36.8129 9.83128 36.4719 9.95896 36.1264 9.95896C35.8081 9.95896 35.508 9.84952 35.2261 9.63064C34.9442 9.40264 34.7168 9.06977 34.544 8.63201C34.3713 8.19425 34.2849 7.6653 34.2849 7.04514C34.2849 6.40675 34.3713 5.83675 34.544 5.33516C34.7259 4.83356 34.9624 4.40948 35.2534 4.06293C35.5444 3.71637 35.8626 3.45645 36.2082 3.28317C36.5538 3.10078 36.8902 3.00958 37.2176 3.00958C37.5814 3.00958 37.9088 3.12358 38.1998 3.35157C38.4908 3.57045 38.6908 3.92157 38.8 4.40492C38.8272 4.24989 38.8454 4.10853 38.8545 3.98085C38.8727 3.85317 38.8818 3.76653 38.8818 3.72093C38.8909 3.47469 39.0137 3.29229 39.2501 3.17373C39.4956 3.05518 39.7639 2.9959 40.0549 2.9959C40.3095 2.9959 40.5505 3.04606 40.7779 3.14637C41.0052 3.24669 41.1598 3.41541 41.2416 3.65253L41.2689 3.73461C41.1598 3.98085 41.0507 4.27725 40.9415 4.6238C40.8324 4.97036 40.7324 5.33516 40.6415 5.71819C40.5505 6.09211 40.4778 6.46147 40.4232 6.82627C40.3686 7.18194 40.3414 7.49658 40.3414 7.77018C40.3414 8.07114 40.3732 8.28089 40.4368 8.39945C40.5005 8.50889 40.5778 8.56361 40.6687 8.56361C40.8233 8.56361 40.9643 8.45417 41.0916 8.23529L41.2007 8.29001C41.2007 8.60009 41.1007 8.88281 40.9006 9.13817C40.7006 9.39353 40.4505 9.59872 40.1504 9.75376C39.8503 9.89968 39.5502 9.97264 39.2501 9.97264ZM37.0267 8.23529C37.2631 8.23529 37.5223 8.02554 37.8042 7.60602C38.0952 7.17738 38.3453 6.56635 38.5544 5.77291C38.5726 5.69083 38.5908 5.61332 38.609 5.54036C38.6272 5.45828 38.6408 5.38076 38.6499 5.3078C38.5044 4.97036 38.3498 4.73324 38.1861 4.59644C38.0315 4.45052 37.8769 4.37756 37.7223 4.37756C37.495 4.37756 37.2813 4.50068 37.0812 4.74692C36.8902 4.98404 36.7311 5.285 36.6038 5.64979C36.4856 6.01459 36.4265 6.37939 36.4265 6.74419C36.4265 7.24578 36.481 7.6197 36.5901 7.86594C36.7084 8.11218 36.8539 8.23529 37.0267 8.23529Z" fill="currentColor" />
      <path d="M43.5804 9.95896C43.253 9.95896 42.962 9.82672 42.7074 9.56224C42.4528 9.28865 42.3254 8.90561 42.3254 8.41313C42.3254 8.17601 42.3527 7.90698 42.4073 7.60602C42.4619 7.30506 42.5255 6.99954 42.5983 6.68947C42.671 6.37027 42.7347 6.07387 42.7892 5.80027C42.8438 5.51756 42.8711 5.285 42.8711 5.1026C42.8711 4.91108 42.8347 4.7606 42.762 4.65116C42.6983 4.5326 42.6119 4.47332 42.5028 4.47332C42.33 4.47332 42.1527 4.59188 41.9708 4.829L41.8889 4.77428C41.8798 4.62836 41.9117 4.45508 41.9844 4.25445C42.0572 4.05381 42.1709 3.86229 42.3254 3.67989C42.48 3.48837 42.6756 3.32877 42.912 3.20109C43.1575 3.07342 43.444 3.00958 43.7714 3.00958C44.2533 3.00958 44.6035 3.15093 44.8217 3.43365C45.04 3.70725 45.1491 4.04013 45.1491 4.43228C45.1491 4.49612 45.1445 4.56452 45.1354 4.63748C45.1354 4.70132 45.1309 4.76516 45.1218 4.829C45.4492 4.23621 45.7902 3.78477 46.1449 3.47469C46.5086 3.15549 46.8451 2.9959 47.1543 2.9959C47.4453 2.9959 47.659 3.1099 47.7954 3.33789C47.9318 3.56589 48 3.83949 48 4.15869C48 4.45052 47.9409 4.74692 47.8227 5.04788C47.7135 5.34884 47.5453 5.59964 47.318 5.80027C47.0997 5.99179 46.8314 6.08299 46.5132 6.07387L46.4586 6.04651C46.4495 5.80939 46.3722 5.62243 46.2267 5.48564C46.0812 5.34884 45.9175 5.28044 45.7356 5.28044C45.4901 5.28044 45.2582 5.40356 45.04 5.64979C44.8308 5.89603 44.7262 6.25171 44.7262 6.71683C44.7262 6.99954 44.758 7.30506 44.8217 7.63338C44.8854 7.9617 44.9172 8.23985 44.9172 8.46785C44.9172 8.74145 44.8535 8.99225 44.7262 9.22025C44.5989 9.44824 44.4352 9.63064 44.2352 9.76744C44.0351 9.89512 43.8168 9.95896 43.5804 9.95896Z" fill="currentColor" />
    </svg>
  );
}
function HideTrayIcon() {
  return (
    <svg
      className="wv-tray-hide-icon"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath="url(#wv-hide-tray-clip)">
        <path d="M4 11L4 1M3 11L9 11C10.1046 11 11 10.1046 11 9L11 3C11 1.89543 10.1046 1 9 1L3 1C1.89543 1 1 1.89543 1 3L1 9C1 10.1046 1.89543 11 3 11Z" stroke="currentColor" strokeLinecap="round" />
      </g>
      <defs>
        <clipPath id="wv-hide-tray-clip">
          <rect width="12" height="12" fill="white" transform="translate(0 12) rotate(-90)" />
        </clipPath>
      </defs>
    </svg>
  );
}
function ArrowUpRightIcon() {
  return (
    <IconBase>
      <path d="M7 17L17 7M10 7h7v7" />
    </IconBase>
  );
}
function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.49854 3.4939L10.506 3.4939L10.506 8.50139"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.49414 10.5061L10.4362 3.56408"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.5 2.2 2.5 13.8 0 16M12 4c-2.5 2.2-2.5 13.8 0 16" />
    </IconBase>
  );
}
