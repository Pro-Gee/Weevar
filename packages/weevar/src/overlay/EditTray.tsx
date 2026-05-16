import { useCallback, useEffect, useRef, useState } from "react";
import {
  areStyleCommitValuesEquivalent,
  classifyElement,
  normalizeFontWeightValue,
  readBorderValues,
  readBoxValues,
  readLineHeightAsPixelNumber,
  readPropertyValue,
  readRadiusValues,
  rgbToHex,
} from "../engine/styleEngine";
import type { ElementCategory } from "../engine/layoutTypes";
import { AlignmentControl } from "./controls/AlignmentControl";
import { BorderControl } from "./controls/BorderControl";
import { BoxControl } from "./controls/BoxControl";
import { ColorPicker } from "./controls/ColorPicker";
import { NumberInput } from "./controls/NumberInput";
import { OpacityControl } from "./controls/OpacityControl";
import { RadiusControl } from "./controls/RadiusControl";
import { SegmentedControl } from "./controls/SegmentedControl";
import { SelectControl } from "./controls/SelectControl";
import { WeightSelect } from "./controls/WeightSelect";

type EditTrayProps = {
  element: Element;
  /** Called when a CSS property is committed with its before/after values. */
  onStyleCommit: (
    element: Element,
    cssProperty: string,
    displayLabel: string,
    fromValue: string,
    toValue: string,
  ) => void;
  onClose: () => void;
  hidden?: boolean;
  tailwindEnabled?: boolean;
};

/** Numeric weight for UI; maps common keywords from inline/computed style. */
function readFontWeightNumber(el: Element): number {
  const key = normalizeFontWeightValue(readPropertyValue(el, "font-weight"));
  const n = parseInt(key, 10);
  return Number.isFinite(n) ? n : 400;
}

/** Columns when switching from flex row/column to grid (no browser prompt). */
const DEFAULT_GRID_COLUMNS = 2;

/** Column count for `repeat(n, …)` templates we generate; otherwise a rough fallback. */
function parseGridColumnCount(gridTemplateColumns: string): number {
  const g = gridTemplateColumns.trim();
  const repeatM = g.match(/^repeat\s*\(\s*(\d+)/i);
  if (repeatM) {
    const n = parseInt(repeatM[1], 10);
    if (Number.isFinite(n) && n >= 1) return Math.min(24, n);
  }
  const tracks = g.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(24, tracks || 3));
}

// CSS properties to show in the raw CSS toggle panel, per category
const CSS_PANEL_PROPS: Record<ElementCategory, string[]> = {
  text:    ["color", "font-size", "font-weight", "font-family", "line-height", "letter-spacing", "text-align"],
  svg:     ["width", "height", "fill", "stroke"],
  image:   ["object-fit", "width", "height"],
  stack:   [
    "display",
    "flex-direction",
    "grid-template-columns",
    "gap",
    "row-gap",
    "column-gap",
    "justify-content",
    "align-items",
    "width",
    "height",
  ],
  generic: ["display", "width", "height"],
};

export function EditTray({
  element,
  onStyleCommit,
  onClose: _onClose,
  hidden = false,
  tailwindEnabled: _tailwindEnabled = false,
}: EditTrayProps) {
  const [category, setCategory] = useState<ElementCategory>("generic");
  const [cssOpen, setCssOpen] = useState(false);
  const [, setTick] = useState(0);
  const fromValuesRef = useRef<Map<string, string>>(new Map());

  // Re-classify and reset tracking whenever the selected element changes
  useEffect(() => {
    setCategory(classifyElement(element));
    setCssOpen(false);

    // Pre-record ALL property baselines using getComputedStyle (not inline style)
    // so fromValue is always available even if onFocus doesn't fire before handleChange.
    // This is the only reliable way to capture the pre-interaction state for controls
    // like ColorPicker where the native picker dialog can interfere with focus events.
    const cs = getComputedStyle(element);
    const baseline = new Map<string, string>();
    const BASELINE_PROPS = [
      "color", "font-size", "font-weight", "text-align",
      "line-height", "letter-spacing",
      "width", "height", "object-fit", "display",
      "flex-direction",
      "grid-template-columns",
      "gap",
      "row-gap",
      "column-gap",
      "justify-content",
      "align-items",
      "margin-top", "margin-right", "margin-bottom", "margin-left",
      "padding-top", "padding-right", "padding-bottom", "padding-left",
      "border-width", "border-style", "border-color",
      "border-radius",
      "border-top-left-radius", "border-top-right-radius",
      "border-bottom-right-radius", "border-bottom-left-radius",
      "opacity",
    ];
    for (const prop of BASELINE_PROPS) {
      const val = cs.getPropertyValue(prop).trim();
      if (val) baseline.set(prop, val);
    }
    fromValuesRef.current = baseline;

    setTick((n) => n + 1);
  }, [element]);

  // Record "from" value when a control gets focus — only on first focus per property,
  // except font-weight: always refresh when the weight menu opens so live onChange + commit
  // still diffs correctly against the pre-open value.
  const handleFocus = useCallback(
    (cssProperty: string) => {
      const snap = readPropertyValue(element, cssProperty);
      if (cssProperty === "font-weight") {
        fromValuesRef.current.set(cssProperty, snap);
        return;
      }
      if (!fromValuesRef.current.has(cssProperty)) {
        fromValuesRef.current.set(cssProperty, snap);
      }
    },
    [element],
  );

  /** Snapshot for deferred history: NumberInput / opacity scrub — always refresh on each focus. */
  const handleDeferrableFocus = useCallback((cssProperty: string) => {
    const snap = readPropertyValue(element, cssProperty);
    fromValuesRef.current.set(cssProperty, snap);
  }, [element]);

  /** Revert live preview to the snapshot from `handleDeferrableFocus` (Escape / cancel edit). */
  const revertDeferrablePreview = useCallback(
    (cssProperty: string, targetEl: Element = element) => {
      const el = targetEl as HTMLElement;
      const raw = (
        fromValuesRef.current.get(cssProperty) ?? readPropertyValue(el, cssProperty)
      ).trim();
      if (raw === "") el.style.removeProperty(cssProperty);
      else el.style.setProperty(cssProperty, raw);
      setTick((n) => n + 1);
    },
    [element],
  );

  const snapshotBoxAxis = useCallback(
    (property: "margin" | "padding", axis: "v" | "h" | "top" | "right" | "bottom" | "left") => {
      if (axis === "v") {
        handleDeferrableFocus(`${property}-top`);
        handleDeferrableFocus(`${property}-bottom`);
      } else if (axis === "h") {
        handleDeferrableFocus(`${property}-left`);
        handleDeferrableFocus(`${property}-right`);
      } else {
        handleDeferrableFocus(`${property}-${axis}`);
      }
    },
    [handleDeferrableFocus],
  );

  const revertBoxAxisPreview = useCallback(
    (property: "margin" | "padding", axis: "v" | "h" | "top" | "right" | "bottom" | "left") => {
      if (axis === "v") {
        revertDeferrablePreview(`${property}-top`);
        revertDeferrablePreview(`${property}-bottom`);
      } else if (axis === "h") {
        revertDeferrablePreview(`${property}-left`);
        revertDeferrablePreview(`${property}-right`);
      } else {
        revertDeferrablePreview(`${property}-${axis}`);
      }
    },
    [revertDeferrablePreview],
  );

  const radiusCornerCss = useCallback((corner: "all" | "tl" | "tr" | "br" | "bl") => {
    if (corner === "all") return "border-radius";
    const map = { tl: "top-left", tr: "top-right", br: "bottom-right", bl: "bottom-left" } as const;
    return `border-${map[corner]}-radius`;
  }, []);

  // Collapsing the tray / hiding it should blur focused inputs so the final value commits once.
  useEffect(() => {
    if (!hidden) return;
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && ae.closest(".wv-edit-tray")) {
      ae.blur();
    }
  }, [hidden]);

  // Apply live preview directly to the DOM element (no undo entry yet)
  const handleChange = useCallback(
    (cssProperty: string, newValue: string, styleTarget?: Element) => {
      const el = styleTarget ?? element;
      (el as HTMLElement).style.setProperty(cssProperty, newValue);
    },
    [element],
  );

  // Commit: diff the value and call the parent callback
  const handleCommit = useCallback(
    (
      cssProperty: string,
      displayLabel: string,
      newValue: string,
      commitTarget?: Element,
      commitFromSnapshot?: string,
    ) => {
      const el = commitTarget ?? element;
      const sameTrayEl = el === element;
      const trimmed = newValue.trim();
      const snap = commitFromSnapshot?.trim();
      const rawFrom =
        snap != null && snap !== ""
          ? snap
          : sameTrayEl
            ? (fromValuesRef.current.get(cssProperty) ??
              getComputedStyle(el).getPropertyValue(cssProperty).trim())
            : getComputedStyle(el).getPropertyValue(cssProperty).trim();

      // Normalise colour values to hex for comparison and storage
      const COLOR_PROPS = new Set(["color", "background-color", "border-color"]);
      const fromValue = COLOR_PROPS.has(cssProperty) ? rgbToHex(rawFrom) : rawFrom;

      if (areStyleCommitValuesEquivalent(cssProperty, fromValue, trimmed)) {
        if (cssProperty === "font-weight") {
          const domN = normalizeFontWeightValue(readPropertyValue(el, "font-weight"));
          const newN = normalizeFontWeightValue(trimmed);
          if (domN !== newN) {
            (el as HTMLElement).style.setProperty(cssProperty, trimmed);
          }
          if (sameTrayEl) {
            fromValuesRef.current.set(cssProperty, trimmed);
          }
          setTick((n) => n + 1);
        }
        return;
      }

      (el as HTMLElement).style.setProperty(cssProperty, trimmed);
      onStyleCommit(el, cssProperty, displayLabel, fromValue, trimmed);
      // Update baseline so subsequent edits on the same property have the right "from"
      if (sameTrayEl) {
        fromValuesRef.current.set(cssProperty, trimmed);
      }
      setTick((n) => n + 1);
    },
    [element, onStyleCommit],
  );

  /** Remove inline grid template when switching to flex so layout matches the chosen mode. */
  const clearGridTemplateIfNeeded = useCallback(() => {
    const el = element as HTMLElement;
    const inlineGtc = el.style.getPropertyValue("grid-template-columns").trim();
    if (!inlineGtc) return;
    handleDeferrableFocus("grid-template-columns");
    const rawFrom = (fromValuesRef.current.get("grid-template-columns") ?? inlineGtc).trim();
    el.style.removeProperty("grid-template-columns");
    onStyleCommit(el, "grid-template-columns", "Grid columns", rawFrom, "");
    fromValuesRef.current.set("grid-template-columns", "");
    setTick((n) => n + 1);
  }, [element, onStyleCommit, handleDeferrableFocus]);

  // BoxControl commits — expand V/H axis to one or two individual property commits
  const handleBoxCommit = useCallback(
    (
      property: "margin" | "padding",
      axis: "v" | "h" | "top" | "right" | "bottom" | "left",
      value: number,
    ) => {
      const val = `${value}px`;
      const label = property === "margin" ? "Margin" : "Padding";
      const sides: Array<[string, string]> =
        axis === "v" ? [[`${property}-top`, val], [`${property}-bottom`, val]] :
        axis === "h" ? [[`${property}-left`, val], [`${property}-right`, val]] :
        [[`${property}-${axis}`, val]];
      for (const [cssProperty, cssValue] of sides) {
        const displayLabel = `${label} ${
          axis === "v" ? "Vertical" : axis === "h" ? "Horizontal" : axis.charAt(0).toUpperCase() + axis.slice(1)
        }`;
        handleCommit(cssProperty, displayLabel, cssValue);
      }
    },
    [handleCommit],
  );

  const handleBoxChange = useCallback(
    (
      property: "margin" | "padding",
      axis: "v" | "h" | "top" | "right" | "bottom" | "left",
      value: number,
    ) => {
      const val = `${value}px`;
      const sides =
        axis === "v" ? [`${property}-top`, `${property}-bottom`] :
        axis === "h" ? [`${property}-left`, `${property}-right`] :
        [`${property}-${axis}`];
      for (const p of sides) handleChange(p, val);
    },
    [handleChange],
  );

  // ─── Read current values from the element ────────────────────────────
  const cs = getComputedStyle(element);

  const fontSize      = parseFloat(readPropertyValue(element, "font-size")) || 14;
  const fontWeight    = readFontWeightNumber(element);
  const rawAlign      = readPropertyValue(element, "text-align") || "left";
  const textAlign     = (["left", "center", "right"].includes(rawAlign) ? rawAlign : "left") as "left" | "center" | "right";
  const lineHeight = readLineHeightAsPixelNumber(element);
  const letterSpacing = parseFloat(readPropertyValue(element, "letter-spacing")) || 0;
  const fontColor     = rgbToHex(readPropertyValue(element, "color") || "#000000");

  const svgWidth  = parseFloat(readPropertyValue(element, "width"))  || 24;
  const svgHeight = parseFloat(readPropertyValue(element, "height")) || 24;

  const imgFit    = readPropertyValue(element, "object-fit") || "fill";
  const imgWidth  = parseFloat(readPropertyValue(element, "width"))  || 100;
  const imgHeight = parseFloat(readPropertyValue(element, "height")) || 100;

  const stackWidth    = parseFloat(readPropertyValue(element, "width"))          || 100;
  const stackHeight   = parseFloat(readPropertyValue(element, "height"))         || 100;
  const gapUnified    = parseFloat(readPropertyValue(element, "gap"))            || 0;
  const isGridLayout  = cs.display.includes("grid");
  const gridTemplateColsRaw = readPropertyValue(element, "grid-template-columns");
  const gridColCount  = parseGridColumnCount(gridTemplateColsRaw);
  const rowGapRaw     = readPropertyValue(element, "row-gap").trim();
  const colGapRaw     = readPropertyValue(element, "column-gap").trim();
  const rowGap =
    rowGapRaw !== "" && Number.isFinite(parseFloat(rowGapRaw))
      ? parseFloat(rowGapRaw)
      : gapUnified;
  const colGap =
    colGapRaw !== "" && Number.isFinite(parseFloat(colGapRaw))
      ? parseFloat(colGapRaw)
      : gapUnified;
  const flexDir       = readPropertyValue(element, "flex-direction")             || "row";
  const justifyContent = readPropertyValue(element, "justify-content")          || "flex-start";
  const alignItems    = readPropertyValue(element, "align-items")               || "stretch";

  const marginValues  = readBoxValues(element, "margin");
  const paddingValues = readBoxValues(element, "padding");
  const borderVals    = readBorderValues(element);
  const radiusVals    = readRadiusValues(element);
  const opacity       = parseFloat(readPropertyValue(element, "opacity") || "1") || 1;

  // ─── CSS panel: read computed values for the relevant properties ──────
  const cssPanelLines = (CSS_PANEL_PROPS[category] ?? [])
    .map((prop) => ({ prop, value: cs.getPropertyValue(prop).trim() }))
    .filter((l) => l.value && l.value !== "normal" && l.value.length > 0);

  // ─── Derive a display title from fiber if available ───────────────────
  const componentName: string | null = (() => {
    try {
      const fiberKey = Object.keys(element).find((k) => k.startsWith("__reactFiber$"));
      if (!fiberKey) return null;
      let cur = (element as unknown as Record<string, unknown>)[fiberKey] as {
        type?: unknown;
        return?: unknown;
      } | null;
      while (cur) {
        if (
          typeof cur.type === "function" &&
          (cur.type as { name?: string }).name &&
          /^[A-Z]/.test((cur.type as { name: string }).name)
        ) {
          return (cur.type as { name: string }).name;
        }
        cur = (cur.return as typeof cur) ?? null;
      }
    } catch {
      /* ignore fiber errors */
    }
    return null;
  })();

  const categoryLabel =
    category === "text"  ? "Text"    :
    category === "svg"   ? "SVG"     :
    category === "image" ? "Image"   :
    category === "stack" ? "Stack"   : "Element";

  const trayTitle = componentName ? `<${componentName}>` : categoryLabel;

  // ─── Shared Box section (rendered for every element category) ─────────
  const BoxSection = (
    <>
      <div className="wv-edit-section-label">Box</div>
      <BoxControl
        property="margin"
        values={marginValues}
        onChange={(axis, v) => handleBoxChange("margin", axis, v)}
        onCommit={(axis, v) => handleBoxCommit("margin", axis, v)}
        onFocus={(axis) => snapshotBoxAxis("margin", axis)}
        onDeferCancel={(axis) => revertBoxAxisPreview("margin", axis)}
      />
      <BoxControl
        property="padding"
        values={paddingValues}
        onChange={(axis, v) => handleBoxChange("padding", axis, v)}
        onCommit={(axis, v) => handleBoxCommit("padding", axis, v)}
        onFocus={(axis) => snapshotBoxAxis("padding", axis)}
        onDeferCancel={(axis) => revertBoxAxisPreview("padding", axis)}
      />
      <div className="wv-edit-section-label">Border</div>
      <BorderControl
        width={borderVals.width}
        style={borderVals.style}
        color={borderVals.color}
        styleCommitTarget={element}
        selectionDismissSignal={element}
        onWidthChange={(v) => handleChange("border-width", v)}
        onWidthCommit={(v) => handleCommit("border-width", "Border Width", v)}
        onStyleChange={(v) => handleChange("border-style", v)}
        onStyleCommit={(v) => handleCommit("border-style", "Border Style", v)}
        onColorChange={(v, target) => handleChange("border-color", v, target)}
        onColorCommit={(v, target, fromSnap) =>
          handleCommit("border-color", "Border Color", v, target, fromSnap)}
        onFocusWidth={() => handleDeferrableFocus("border-width")}
        onCancelWidth={() => revertDeferrablePreview("border-width")}
        onFocusColor={() => handleFocus("border-color")}
      />
      <RadiusControl
        values={radiusVals}
        onSingleChange={(v) => handleChange("border-radius", v)}
        onSingleCommit={(v) => handleCommit("border-radius", "Radius", v)}
        onCornerChange={(corner, v) => {
          const map: Record<string, string> = {
            tl: "top-left", tr: "top-right",
            br: "bottom-right", bl: "bottom-left",
          };
          handleChange(`border-${map[corner]}-radius`, v);
        }}
        onCornerCommit={(corner, v) => {
          const map: Record<string, string> = {
            tl: "top-left", tr: "top-right",
            br: "bottom-right", bl: "bottom-left",
          };
          handleCommit(`border-${map[corner]}-radius`, `Radius ${corner.toUpperCase()}`, v);
        }}
        onFocus={(corner) => handleDeferrableFocus(radiusCornerCss(corner))}
        onDeferCancel={(corner) => revertDeferrablePreview(radiusCornerCss(corner))}
      />
      <OpacityControl
        value={opacity}
        onChange={(v) => handleChange("opacity", String(v))}
        onCommit={(v) => handleCommit("opacity", "Opacity", String(v))}
        onFocus={() => handleDeferrableFocus("opacity")}
      />
    </>
  );

  return (
    <div
      className={`wv-edit-tray wv-pe${hidden ? " wv-edit-tray--hidden" : ""}`}
      aria-hidden={hidden}
    >
      {/* Header row: element title + CSS toggle button */}
      <div className="wv-edit-tray-head">
        <span className="wv-edit-tray-title">{trayTitle}</span>
        <button
          type="button"
          className={`wv-edit-tray-code-btn wv-pe${cssOpen ? " wv-edit-tray-code-btn--active" : ""}`}
          title="Toggle raw CSS view"
          onClick={() => setCssOpen((s) => !s)}
        >
          {"</>"}
        </button>
      </div>

      {/* Raw CSS panel — visible when cssOpen is true */}
      {cssOpen && (
        <div className="wv-css-panel">
          {cssPanelLines.map((l) => (
            <div key={l.prop} className="wv-css-panel-line">
              <span className="wv-css-panel-prop">{l.prop}</span>
              <span className="wv-css-panel-sep">: </span>
              <span className="wv-css-panel-val">{l.value}</span>
              <span className="wv-css-panel-sep">;</span>
            </div>
          ))}
          {cssPanelLines.length === 0 && (
            <span className="wv-css-panel-empty">No relevant styles found.</span>
          )}
        </div>
      )}

      {/* Type-specific controls */}
      <div className="wv-edit-controls">

        {/* ── Text ── */}
        {category === "text" && (
          <>
            <div className="wv-edit-section-label">Typography</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Font Size</span>
              <NumberInput
                cssProperty="font-size"
                displayLabel="Font Size"
                value={fontSize}
                unit="px"
                min={1}
                max={999}
                onChange={(v) => handleChange("font-size", v)}
                onCommit={(v) => handleCommit("font-size", "Font Size", v)}
                onFocus={() => handleDeferrableFocus("font-size")}
                onCancel={() => revertDeferrablePreview("font-size")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Font Weight</span>
              <WeightSelect
                value={fontWeight}
                onChange={(v) => handleChange("font-weight", String(v))}
                onCommit={(v) => handleCommit("font-weight", "Font Weight", String(v))}
                onFocus={() => handleFocus("font-weight")}
                onCancel={() => revertDeferrablePreview("font-weight")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Alignment</span>
              <SegmentedControl
                value={textAlign}
                onCommit={(v) => {
                  handleFocus("text-align");
                  handleCommit("text-align", "Font Alignment", v);
                }}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Line Height</span>
              <NumberInput
                cssProperty="line-height"
                displayLabel="Line Height"
                value={lineHeight}
                unit="px"
                min={0}
                max={500}
                step={0.5}
                onChange={(v) => handleChange("line-height", v)}
                onCommit={(v) => handleCommit("line-height", "Line Height", v)}
                onFocus={() => handleDeferrableFocus("line-height")}
                onCancel={() => revertDeferrablePreview("line-height")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Letter Spacing</span>
              <NumberInput
                cssProperty="letter-spacing"
                displayLabel="Letter Spacing"
                value={letterSpacing}
                unit="px"
                min={-20}
                max={50}
                step={0.5}
                onChange={(v) => handleChange("letter-spacing", v)}
                onCommit={(v) => handleCommit("letter-spacing", "Letter Spacing", v)}
                onFocus={() => handleDeferrableFocus("letter-spacing")}
                onCancel={() => revertDeferrablePreview("letter-spacing")}
              />
            </div>
            <div className="wv-edit-section-label">Style</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Font Colour</span>
              <ColorPicker
                value={fontColor}
                styleCommitTarget={element}
                selectionDismissSignal={element}
                onChange={(v, target) => handleChange("color", v, target)}
                onCommit={(v, target, fromSnap) =>
                  handleCommit("color", "Font Colour", v, target, fromSnap)}
                onFocus={() => handleFocus("color")}
              />
            </div>
          </>
        )}

        {/* ── SVG ── */}
        {category === "svg" && (
          <>
            <div className="wv-edit-section-label">SVG</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Width</span>
              <NumberInput
                cssProperty="width"
                displayLabel="Width"
                value={svgWidth}
                unit="px"
                min={1}
                onChange={(v) => handleChange("width", v)}
                onCommit={(v) => handleCommit("width", "Width", v)}
                onFocus={() => handleDeferrableFocus("width")}
                onCancel={() => revertDeferrablePreview("width")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Height</span>
              <NumberInput
                cssProperty="height"
                displayLabel="Height"
                value={svgHeight}
                unit="px"
                min={1}
                onChange={(v) => handleChange("height", v)}
                onCommit={(v) => handleCommit("height", "Height", v)}
                onFocus={() => handleDeferrableFocus("height")}
                onCancel={() => revertDeferrablePreview("height")}
              />
            </div>
          </>
        )}

        {/* ── Image ── */}
        {category === "image" && (
          <>
            <div className="wv-edit-section-label">Image</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Fit</span>
              <SelectControl
                value={imgFit}
                options={[
                  { value: "cover",      label: "Cover" },
                  { value: "contain",    label: "Contain" },
                  { value: "fill",       label: "Fill" },
                  { value: "none",       label: "None" },
                  { value: "scale-down", label: "Scale Down" },
                ]}
                onCommit={(v) => {
                  handleFocus("object-fit");
                  handleCommit("object-fit", "Fit", v);
                }}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Width</span>
              <NumberInput
                cssProperty="width"
                displayLabel="Width"
                value={imgWidth}
                unit="px"
                min={1}
                onChange={(v) => handleChange("width", v)}
                onCommit={(v) => handleCommit("width", "Width", v)}
                onFocus={() => handleDeferrableFocus("width")}
                onCancel={() => revertDeferrablePreview("width")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Height</span>
              <NumberInput
                cssProperty="height"
                displayLabel="Height"
                value={imgHeight}
                unit="px"
                min={1}
                onChange={(v) => handleChange("height", v)}
                onCommit={(v) => handleCommit("height", "Height", v)}
                onFocus={() => handleDeferrableFocus("height")}
                onCancel={() => revertDeferrablePreview("height")}
              />
            </div>
          </>
        )}

        {/* ── Stack ── */}
        {category === "stack" && (
          <>
            <div className="wv-edit-section-label">Size</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Width</span>
              <NumberInput
                cssProperty="width"
                displayLabel="Width"
                value={stackWidth}
                unit="px"
                min={1}
                onChange={(v) => handleChange("width", v)}
                onCommit={(v) => handleCommit("width", "Width", v)}
                onFocus={() => handleDeferrableFocus("width")}
                onCancel={() => revertDeferrablePreview("width")}
              />
            </div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Height</span>
              <NumberInput
                cssProperty="height"
                displayLabel="Height"
                value={stackHeight}
                unit="px"
                min={1}
                onChange={(v) => handleChange("height", v)}
                onCommit={(v) => handleCommit("height", "Height", v)}
                onFocus={() => handleDeferrableFocus("height")}
                onCancel={() => revertDeferrablePreview("height")}
              />
            </div>
            <div className="wv-edit-section-label">Layout</div>
            <div className="wv-prop-row">
              <span className="wv-prop-label">Layout</span>
              <div className="wv-layout-type-toggle wv-pe">
                {/* Horizontal stack */}
                <button
                  type="button"
                  className={`wv-layout-type-btn wv-pe${
                    cs.display.includes("flex") && flexDir === "row" ? " wv-layout-type-btn--active" : ""
                  }`}
                  title="Horizontal stack (flex row)"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleFocus("display");
                    handleFocus("flex-direction");
                    clearGridTemplateIfNeeded();
                    handleChange("display", "flex");
                    handleChange("flex-direction", "row");
                    handleCommit("display", "Display", "flex");
                    handleCommit("flex-direction", "Direction", "row");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="6" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="11" y="4" width="4" height="8" rx="1" fill="currentColor" opacity="0.9"/>
                  </svg>
                </button>
                {/* Vertical stack */}
                <button
                  type="button"
                  className={`wv-layout-type-btn wv-pe${
                    cs.display.includes("flex") && flexDir === "column" ? " wv-layout-type-btn--active" : ""
                  }`}
                  title="Vertical stack (flex column)"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleFocus("display");
                    handleFocus("flex-direction");
                    clearGridTemplateIfNeeded();
                    handleChange("display", "flex");
                    handleChange("flex-direction", "column");
                    handleCommit("display", "Display", "flex");
                    handleCommit("flex-direction", "Direction", "column");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="1" width="8" height="4" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="4" y="6" width="8" height="4" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="4" y="11" width="8" height="4" rx="1" fill="currentColor" opacity="0.9"/>
                  </svg>
                </button>
                {/* Grid */}
                <button
                  type="button"
                  className={`wv-layout-type-btn wv-pe${
                    isGridLayout ? " wv-layout-type-btn--active" : ""
                  }`}
                  title="Grid"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (isGridLayout) return;
                    const gtc = `repeat(${DEFAULT_GRID_COLUMNS}, minmax(0, 1fr))`;
                    handleFocus("display");
                    handleDeferrableFocus("grid-template-columns");
                    handleChange("display", "grid");
                    handleChange("grid-template-columns", gtc);
                    handleCommit("display", "Display", "grid");
                    handleCommit("grid-template-columns", "Grid columns", gtc);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
                    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
                  </svg>
                </button>
              </div>
            </div>
            {isGridLayout && (
              <div className="wv-prop-row">
                <span className="wv-prop-label">Columns</span>
                <NumberInput
                  cssProperty="grid-template-columns"
                  displayLabel="Columns"
                  value={gridColCount}
                  unit=""
                  min={1}
                  max={24}
                  onChange={(v) => {
                    const n = parseInt(v, 10);
                    if (!Number.isFinite(n)) return;
                    const clamped = Math.max(1, Math.min(24, n));
                    handleChange(
                      "grid-template-columns",
                      `repeat(${clamped}, minmax(0, 1fr))`,
                    );
                  }}
                  onCommit={(v) => {
                    const n = parseInt(v, 10);
                    if (!Number.isFinite(n)) return;
                    const clamped = Math.max(1, Math.min(24, n));
                    handleCommit(
                      "grid-template-columns",
                      "Grid columns",
                      `repeat(${clamped}, minmax(0, 1fr))`,
                    );
                  }}
                  onFocus={() => handleDeferrableFocus("grid-template-columns")}
                  onCancel={() => revertDeferrablePreview("grid-template-columns")}
                />
              </div>
            )}
            {isGridLayout ? (
              <>
                <div className="wv-prop-row">
                  <span className="wv-prop-label">Vertical gap</span>
                  <NumberInput
                    cssProperty="row-gap"
                    displayLabel="Vertical gap"
                    value={rowGap}
                    unit="px"
                    min={0}
                    onChange={(v) => handleChange("row-gap", v)}
                    onCommit={(v) => handleCommit("row-gap", "Vertical gap", v)}
                    onFocus={() => handleDeferrableFocus("row-gap")}
                    onCancel={() => revertDeferrablePreview("row-gap")}
                  />
                </div>
                <div className="wv-prop-row">
                  <span className="wv-prop-label">Horizontal gap</span>
                  <NumberInput
                    cssProperty="column-gap"
                    displayLabel="Horizontal gap"
                    value={colGap}
                    unit="px"
                    min={0}
                    onChange={(v) => handleChange("column-gap", v)}
                    onCommit={(v) => handleCommit("column-gap", "Horizontal gap", v)}
                    onFocus={() => handleDeferrableFocus("column-gap")}
                    onCancel={() => revertDeferrablePreview("column-gap")}
                  />
                </div>
              </>
            ) : (
              <div className="wv-prop-row">
                <span className="wv-prop-label">Gap</span>
                <NumberInput
                  cssProperty="gap"
                  displayLabel="Gap"
                  value={gapUnified}
                  unit="px"
                  min={0}
                  onChange={(v) => handleChange("gap", v)}
                  onCommit={(v) => handleCommit("gap", "Gap", v)}
                  onFocus={() => handleDeferrableFocus("gap")}
                  onCancel={() => revertDeferrablePreview("gap")}
                />
              </div>
            )}
            <div className="wv-edit-section-label">Alignment</div>
            <AlignmentControl
              justifyContent={justifyContent}
              alignItems={alignItems}
              onJustifyCommit={(v) => {
                handleFocus("justify-content");
                handleCommit("justify-content", "Main Axis Alignment", v);
              }}
              onAlignCommit={(v) => {
                handleFocus("align-items");
                handleCommit("align-items", "Cross Axis Alignment", v);
              }}
            />
          </>
        )}

        {/* ── Box section — rendered for all categories ── */}
        {BoxSection}
      </div>
    </div>
  );
}
