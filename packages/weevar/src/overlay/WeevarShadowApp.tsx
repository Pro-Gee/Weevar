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
import { getDomLabel } from "../engine/domLabel";
import {
  hitTestHostPage,
  hitTestHostPageUnderOverlay,
  isInsideWeevarOverlay,
} from "../engine/hitTest";
import { buildAncestorPath, layoutTypeLabel } from "../engine/layoutContext";
import { buildReorderLayoutChange } from "../engine/layoutChangeFromReorder";
import { buildMoveLayoutChange } from "../engine/layoutChangeMove";
import { findDropParent } from "../engine/dropTargets";
import { isFixedOrSticky } from "../engine/fixedOrSticky";
import { buildElementIdentity } from "../engine/identity";
import type {
  ElementIdentity,
  GeneratedPrompt,
  LayoutChange,
  PromptLength,
  TargetTool,
  WeevarRuntimeConfig,
} from "../engine/layoutTypes";
import { elementChildren } from "../engine/elementChildren";
import { FlexOrderPreview } from "../engine/flexOrderPreview";
import { insertionBarBetween } from "../engine/insertionBar";
import { createPendingCrossMove } from "../engine/pendingMove";
import { createPendingReorder, type PendingReorder } from "../engine/pendingReorder";
import { generatePrompts, promptBody } from "../engine/prompts";
import {
  computeDropIndex,
  orderAfterInsert,
  orderAfterMove,
  parentSupportsFlexOrderPreview,
} from "../engine/reorderTarget";
import { resolveElementIdentity } from "../engine/resolveIdentity";
import { OVERLAY_CSS } from "./overlayStyles";
import { PromptPanel } from "./PromptPanel";

type FrameRects = { hover: DOMRect | null; selected: DOMRect | null };

type DragBar = { left: number; top: number; width: number; height: number };

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
};

type PanelState = {
  change: LayoutChange;
  prompt: GeneratedPrompt;
  len: PromptLength;
  tool: TargetTool;
  copyFlash: boolean;
};

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
  const hoverRef = useRef<Element | null>(null);
  const selectedRef = useRef<Element | null>(null);
  const selectedIdentityRef = useRef<ElementIdentity | null>(null);
  const pendingRef = useRef<PendingReorder | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<PanelState | null>(null);
  const dragMoveRaf = useRef<number | null>(null);
  const pendingDragEv = useRef<PointerEvent | null>(null);

  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragUi, setDragUi] = useState<{
    bar: DragBar | null;
    preview: string;
    x: number;
    y: number;
  } | null>(null);
  const [dropZoneRect, setDropZoneRect] = useState<DOMRect | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [panel, setPanel] = useState<PanelState | null>(null);
  panelRef.current = panel;

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
    if (!sessionOn || disabled) return;
    let id = 0;
    const tick = () => {
      const next = readFrames();
      const prev = framesRef.current;
      if (
        !rectsEqual(next.hover, prev.hover) ||
        !rectsEqual(next.selected, prev.selected)
      ) {
        framesRef.current = next;
        setFrames(next);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [sessionOn, disabled, readFrames]);

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
    s.resumeAnimations();
    try {
      dragHandleRef.current?.releasePointerCapture(s.pointerId);
    } catch {
      /* noop */
    }
    setIsDragging(false);
    setDragUi(null);
    setDropZoneRect(null);
    bump();
  }, [bump]);

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
    } = s;
    dragSessionRef.current = null;
    preview.clear();
    (dragged as HTMLElement).style.opacity = prevOpacity;
    resumeAnimations();
    try {
      dragHandleRef.current?.releasePointerCapture(pointerId);
    } catch {
      /* noop */
    }
    setIsDragging(false);
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

    let change: LayoutChange;
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
    const tool: TargetTool = "claude-code";
    const prompt = generatePrompts(change, tool, config);
    if (!prompt) return;
    setPanel({ change, prompt, len: "short", tool, copyFlash: false });
    selectedRef.current = null;
    selectedIdentityRef.current = null;
    bump();
  }, [bump, config]);

  useEffect(() => {
    if (!sessionOn) {
      disposePending(true);
      hoverRef.current = null;
      selectedRef.current = null;
      selectedIdentityRef.current = null;
      dragSessionRef.current = null;
      setIsDragging(false);
      setDragUi(null);
      setDropZoneRect(null);
      setToast(null);
      setPanel(null);
      framesRef.current = { hover: null, selected: null };
      setFrames({ hover: null, selected: null });
    }
  }, [sessionOn, disposePending]);

  useEffect(() => {
    if (!sessionOn || disabled || panel || isDragging) return;
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
  }, [sessionOn, disabled, panel, isDragging, bump]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sessionOn || disabled) return;

    const onPointerMove = (e: PointerEvent) => {
      if (dragSessionRef.current) return;
      if (panel) return;
      if (eventFromWeevarChrome(e)) return;
      const el = hitTestHostPage(e.clientX, e.clientY);
      if (el !== hoverRef.current) {
        hoverRef.current = el;
        bump();
      }
    };

    const onPointerDownCapture = (e: PointerEvent) => {
      if (dragSessionRef.current) return;
      if (panel) return;
      if (eventFromWeevarChrome(e)) return;
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
      e.preventDefault();
      e.stopPropagation();
      bump();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
          return;
      }
      if (panel) {
        e.preventDefault();
        e.stopPropagation();
        disposePending(true);
        setPanel(null);
        bump();
        return;
      }
      if (dragSessionRef.current) {
        e.preventDefault();
        e.stopPropagation();
        cancelDrag();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (selectedRef.current) {
        selectedRef.current = null;
        selectedIdentityRef.current = null;
        bump();
        return;
      }
      setSessionOn(false);
    };

    document.addEventListener("pointermove", onPointerMove, {
      capture: true,
      passive: true,
    });
    document.addEventListener("pointerdown", onPointerDownCapture, {
      capture: true,
      passive: false,
    });
    document.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      document.removeEventListener("pointermove", onPointerMove, {
        capture: true,
      });
      document.removeEventListener("pointerdown", onPointerDownCapture, {
        capture: true,
      });
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [sessionOn, disabled, setSessionOn, bump, panel, disposePending, cancelDrag]);

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
      autoScrollForPoint(ev.clientX, ev.clientY);
      const hit = hitTestHostPageUnderOverlay(ev.clientX, ev.clientY);
      const dropParent = findDropParent(hit, dragged) ?? sourceParent;
      const dropIndex = computeDropIndex(dropParent, dragged, ev.clientX, ev.clientY);
      s.dropParent = dropParent;
      s.dropIndex = dropIndex;

      if (dropParent === sourceParent && parentSupportsFlexOrderPreview(sourceParent)) {
        preview.apply(orderAfterMove(sourceParent, dragged, dropIndex));
      } else {
        preview.clear();
      }

      const cs = getComputedStyle(dropParent);
      const row =
        cs.display.includes("flex") &&
        ["row", "row-reverse"].includes(cs.flexDirection || "");
      const ordered =
        dropParent === sourceParent
          ? orderAfterMove(sourceParent, dragged, dropIndex)
          : orderAfterInsert(dropParent, dragged, dropIndex);
      const insertIdx = ordered.indexOf(dragged);
      const bar = insertionBarBetween(ordered, insertIdx, row);

      setDropZoneRect(dropParent === sourceParent ? null : dropParent.getBoundingClientRect());
      setDragUi({
        bar,
        preview: getDomLabel(dragged),
        x: ev.clientX,
        y: ev.clientY,
      });
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
      if (panel) return;
      const dragged = selectedRef.current;
      const parent = dragged?.parentElement;
      if (!dragged || !parent) return;
      e.preventDefault();
      e.stopPropagation();

      const hel = dragged as HTMLElement;
      const prevOpacity = hel.style.opacity;
      hel.style.opacity = "0.3";

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
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      setDragUi({
        bar: null,
        preview: getDomLabel(dragged),
        x: e.clientX,
        y: e.clientY,
      });
      bump();
    },
    [bump, panel],
  );

  const selectedEl = selectedRef.current;
  const hoverEl = hoverRef.current;

  const actionPanel = useMemo(() => {
    if (!selectedEl || panel) return null;
    const p = selectedEl.parentElement;
    if (!p) return null;
    return {
      path: buildAncestorPath(selectedEl),
      layout: layoutTypeLabel(p),
      fixedHint: isFixedOrSticky(selectedEl),
    };
  }, [selectedEl, panel, rev]);

  const handlePos = useMemo(() => {
    if (!frames.selected || panel) return null;
    const r = frames.selected;
    return { left: r.left - 20, top: r.top - 22 };
  }, [frames.selected, panel]);

  const panelPos = useMemo(() => {
    if (!frames.selected || panel) return null;
    const r = frames.selected;
    const panelH = 120;
    const gap = 8;
    const aboveTop = r.top - gap - panelH;
    const useAbove = aboveTop >= 8;
    return {
      left: Math.min(Math.max(8, r.left), window.innerWidth - 248),
      top: useAbove ? aboveTop : r.bottom + gap,
    };
  }, [frames.selected, panel]);

  const toolbarLabel = useMemo(() => {
    if (panel) return "Prompt ready — copy or discard";
    if (isDragging) return "Dragging…";
    if (selectedEl) return `Selected: ${getDomLabel(selectedEl)}`;
    if (hoverEl) return `Hover: ${getDomLabel(hoverEl)}`;
    return "Hover an element";
  }, [panel, isDragging, selectedEl, hoverEl]);

  return (
    <>
      <style>{OVERLAY_CSS}</style>
      <div className="wv-root" aria-hidden={!sessionOn}>
        {!sessionOn ? (
          <button
            type="button"
            className="wv-dot wv-pe"
            title="Activate Weevar (⌘⇧E)"
            aria-label="Activate Weevar overlay"
            disabled={disabled}
            onClick={() => !disabled && setSessionOn(true)}
          />
        ) : (
          <>
            <div className="wv-toolbar">
              <span className="wv-toolbar-status">{toolbarLabel}</span>
              <button
                type="button"
                className="wv-toolbar-close"
                aria-label="Close overlay"
                onClick={() => setSessionOn(false)}
              >
                ×
              </button>
            </div>

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
            {isDragging && dragUi && (
              <div className="wv-drag-preview" style={{ left: dragUi.x, top: dragUi.y }}>
                {dragUi.preview}
              </div>
            )}

            {panel && (
              <PromptPanel
                change={panel.change}
                prompt={panel.prompt}
                promptLen={panel.len}
                runtimeConfig={config}
                onPromptLen={(len) => setPanel((p) => (p ? { ...p, len } : p))}
                tool={panel.tool}
                onTool={(tool) =>
                  setPanel((p) =>
                    p
                      ? {
                          ...p,
                          tool,
                          prompt: generatePrompts(p.change, tool, config) ?? p.prompt,
                        }
                      : p,
                  )
                }
                copyFlash={panel.copyFlash}
                onRegenerate={() =>
                  setPanel((p) =>
                    p
                      ? {
                          ...p,
                          prompt: generatePrompts(p.change, p.tool, config) ?? p.prompt,
                        }
                      : p,
                  )
                }
                onDiscard={() => {
                  disposePending(true);
                  setPanel(null);
                  bump();
                }}
                onCopy={async () => {
                  const p = panelRef.current;
                  if (!p) return;
                  const text = promptBody(p.prompt, p.len);
                  await navigator.clipboard.writeText(text);
                  setPanel((cur) => (cur ? { ...cur, copyFlash: true } : cur));
                  window.setTimeout(() => {
                    disposePending(false);
                    setPanel(null);
                    bump();
                  }, 1000);
                }}
              />
            )}

            {frames.hover &&
              hoverEl &&
              (!selectedEl || hoverEl !== selectedEl) &&
              !isDragging &&
              !panel && <Outline rect={frames.hover} variant="hover" />}

            {frames.selected && selectedEl && !panel && (
              <>
                <Outline rect={frames.selected} variant="selected" />
                <CornerMarkers rect={frames.selected} />
                {handlePos && (
                  <div
                    ref={dragHandleRef}
                    className="wv-drag-handle"
                    style={{ left: handlePos.left, top: handlePos.top }}
                    title="Drag to reorder or move to another container"
                    role="presentation"
                    onPointerDown={startDrag}
                  >
                    <span className="wv-handle-grid" />
                  </div>
                )}
                {panelPos && actionPanel && (
                  <div
                    className="wv-action-panel"
                    style={{ left: panelPos.left, top: panelPos.top }}
                  >
                    <div className="wv-action-title">Path</div>
                    <div className="wv-path">{actionPanel.path}</div>
                    <div>
                      <span className="wv-pill">{actionPanel.layout}</span>
                    </div>
                    <div className="wv-hint">
                      Drag the handle to reorder or drop into another valid container.
                      {actionPanel.fixedHint ? (
                        <span className="wv-fixed-hint">
                          {" "}
                          Fixed/sticky: flow reorder may not match runtime positioning.
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </>
            )}

            {frames.hover &&
              hoverEl &&
              hoverEl !== selectedEl &&
              !isDragging &&
              !panel && <Label rect={frames.hover} text={getDomLabel(hoverEl)} />}
            {frames.selected && selectedEl && !panel && (
              <Label rect={frames.selected} text={getDomLabel(selectedEl)} />
            )}
          </>
        )}
      </div>
    </>
  );
}

function eventFromWeevarChrome(e: PointerEvent | KeyboardEvent): boolean {
  return e.composedPath().some((n) => {
    if (!(n instanceof Element)) return false;
    return isInsideWeevarOverlay(n);
  });
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

function Label({ rect, text }: { rect: DOMRect; text: string }) {
  const pad = 4;
  let top = rect.top - 24;
  if (top < 4) top = rect.bottom + pad;
  const left = Math.min(Math.max(4, rect.left), window.innerWidth - 200);
  return (
    <div className="wv-label" style={{ left, top }}>
      {text}
    </div>
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
