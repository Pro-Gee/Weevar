import { useCallback, useEffect, useRef, useState } from "react";
import {
  areStyleCommitValuesEquivalent,
  applySvgDimension,
  classifyElement,
  elementTypeLabel,
  normalizeFontWeightValue,
  readBorderValues,
  readBorderWidthValues,
  readBoxValues,
  readLineHeightAsPixelNumber,
  readPropertyValue,
  readRadiusValues,
  readCssColorForPicker,
  readSvgDimension,
  readSvgDimensionRaw,
  resolveSvgRoot,
  rgbToHex,
  supportsCssBackgroundColor,
} from "../engine/styleEngine";
import { roundTo2 } from "../engine/roundNumber";
import {
  dimensionSizingCssValue,
  readDimensionSizingMode,
} from "../engine/dimensionSizing";
import type { ElementCategory } from "../engine/layoutTypes";
import { AlignmentControl } from "./controls/AlignmentControl";
import { BorderControl } from "./controls/BorderControl";
import { BoxControl } from "./controls/BoxControl";
import { CardSelectControl } from "./controls/CardSelectControl";
import { ColorPicker } from "./controls/ColorPicker";
import { DimensionControl } from "./controls/DimensionControl";
import { NumberInput } from "./controls/NumberInput";
import { OpacityControl } from "./controls/OpacityControl";
import { RadiusControl } from "./controls/RadiusControl";
import { LayoutTypeControl, type LayoutType } from "./controls/LayoutTypeControl";
import { LayoutGapControl } from "./controls/LayoutGapControl";
import { LayoutColumnsControl } from "./controls/LayoutColumnsControl";
import { SegmentedControl } from "./controls/SegmentedControl";
import { WeightSelect } from "./controls/WeightSelect";
import { TypoLetterSpacingIcon, TypoLineHeightIcon, SectionCollapseIcon, SectionExpandIcon, SectionDivider } from "./controls/typographyIcons";

function ElementPropsIcon() {
  return (
    <svg
      className="wv-edit-tray-props-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath="url(#wv_edit_props_clip)">
        <path
          d="M4.08333 4.6665L1.75 6.99984L4.08333 9.33317"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.91675 4.6665L12.2501 6.99984L9.91675 9.33317"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.16659 2.3335L5.83325 11.6668"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="wv_edit_props_clip">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

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
  text:    ["color", "background-color", "font-size", "font-weight", "font-family", "line-height", "letter-spacing", "text-align"],
  svg:     ["width", "height", "fill", "stroke"],
  image:   ["object-fit", "width", "height"],
  stack:   [
    "color",
    "background-color",
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
  generic: ["color", "background-color", "display", "width", "height"],
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
  const [boxSectionOpen, setBoxSectionOpen] = useState(true);
  const [layoutSectionOpen, setLayoutSectionOpen] = useState(true);
  const [visibilitySectionOpen, setVisibilitySectionOpen] = useState(true);
  const [, setTick] = useState(0);
  const fromValuesRef = useRef<Map<string, string>>(new Map());

  // Re-classify and reset tracking whenever the selected element changes
  useEffect(() => {
    setCategory(classifyElement(element));
    setCssOpen(false);
    setBoxSectionOpen(true);
    setLayoutSectionOpen(true);
    setVisibilitySectionOpen(true);

    // Pre-record ALL property baselines using getComputedStyle (not inline style)
    // so fromValue is always available even if onFocus doesn't fire before handleChange.
    // This is the only reliable way to capture the pre-interaction state for controls
    // like ColorPicker where the native picker dialog can interfere with focus events.
    const cs = getComputedStyle(element);
    const baseline = new Map<string, string>();
    const BASELINE_PROPS = [
      "color", "background-color", "font-size", "font-weight", "text-align",
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
      "border-width", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
      "border-style", "border-color",
      "border-radius",
      "border-top-left-radius", "border-top-right-radius",
      "border-bottom-right-radius", "border-bottom-left-radius",
      "opacity",
    ];
    for (const prop of BASELINE_PROPS) {
      const val = cs.getPropertyValue(prop).trim();
      if (val) baseline.set(prop, val);
    }
    if (classifyElement(element) === "svg") {
      const root = resolveSvgRoot(element);
      if (root) {
        const w = readSvgDimensionRaw(element, "width");
        const h = readSvgDimensionRaw(element, "height");
        if (w) baseline.set("svg-width", w);
        if (h) baseline.set("svg-height", h);
      }
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

  const svgDimSnapshotKey = (prop: "width" | "height") => `svg-${prop}`;

  const handleSvgDimensionFocus = useCallback(
    (prop: "width" | "height") => {
      fromValuesRef.current.set(svgDimSnapshotKey(prop), readSvgDimensionRaw(element, prop));
    },
    [element],
  );

  const revertSvgDimensionPreview = useCallback(
    (prop: "width" | "height") => {
      const raw = (
        fromValuesRef.current.get(svgDimSnapshotKey(prop)) ?? readSvgDimensionRaw(element, prop)
      ).trim();
      applySvgDimension(element, prop, raw);
      setTick((n) => n + 1);
    },
    [element],
  );

  const handleSvgDimensionChange = useCallback(
    (prop: "width" | "height", value: string) => {
      applySvgDimension(element, prop, value);
      setTick((n) => n + 1);
    },
    [element],
  );

  const handleSvgDimensionCommit = useCallback(
    (prop: "width" | "height", displayLabel: string, value: string) => {
      const root = resolveSvgRoot(element);
      if (!root) return;

      const snapKey = svgDimSnapshotKey(prop);
      const trimmed = value.trim();
      const pxVal = /px$/i.test(trimmed) ? trimmed : `${trimmed}px`;
      const rawFrom = (fromValuesRef.current.get(snapKey) ?? readSvgDimensionRaw(element, prop)).trim();

      if (areStyleCommitValuesEquivalent(prop, rawFrom, pxVal)) {
        applySvgDimension(element, prop, pxVal);
        fromValuesRef.current.set(snapKey, pxVal);
        setTick((n) => n + 1);
        return;
      }

      applySvgDimension(element, prop, pxVal);
      onStyleCommit(root, prop, displayLabel, rawFrom, pxVal);
      fromValuesRef.current.set(snapKey, pxVal);
      setTick((n) => n + 1);
    },
    [element, onStyleCommit],
  );

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
      setTick((n) => n + 1);
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

  const handleBorderWidthCommit = useCallback(
    (
      axis: "all" | "top" | "right" | "bottom" | "left",
      value: number,
    ) => {
      const val = `${value}px`;
      const sides: Array<[string, string]> =
        axis === "all"
          ? [
              ["border-top-width", val],
              ["border-right-width", val],
              ["border-bottom-width", val],
              ["border-left-width", val],
            ]
          : [[`border-${axis}-width`, val]];
      for (const [cssProperty, cssValue] of sides) {
        const displayLabel =
          axis === "all"
            ? "Border Weight"
            : `Border Weight ${axis.charAt(0).toUpperCase()}${axis.slice(1)}`;
        handleCommit(cssProperty, displayLabel, cssValue);
      }
    },
    [handleCommit],
  );

  const handleBorderWidthChange = useCallback(
    (axis: "all" | "top" | "right" | "bottom" | "left", value: number) => {
      const val = `${value}px`;
      const sides =
        axis === "all"
          ? ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"]
          : [`border-${axis}-width`];
      for (const p of sides) handleChange(p, val);
    },
    [handleChange],
  );

  const snapshotBorderWidth = useCallback(
    (axis: "all" | "top" | "right" | "bottom" | "left") => {
      if (axis === "all") {
        handleDeferrableFocus("border-top-width");
        handleDeferrableFocus("border-right-width");
        handleDeferrableFocus("border-bottom-width");
        handleDeferrableFocus("border-left-width");
      } else {
        handleDeferrableFocus(`border-${axis}-width`);
      }
    },
    [handleDeferrableFocus],
  );

  const revertBorderWidthPreview = useCallback(
    (axis: "all" | "top" | "right" | "bottom" | "left") => {
      if (axis === "all") {
        revertDeferrablePreview("border-top-width");
        revertDeferrablePreview("border-right-width");
        revertDeferrablePreview("border-bottom-width");
        revertDeferrablePreview("border-left-width");
      } else {
        revertDeferrablePreview(`border-${axis}-width`);
      }
    },
    [revertDeferrablePreview],
  );

  // ─── Read current values from the element ────────────────────────────
  const cs = getComputedStyle(element);

  const fontSize      = parseFloat(readPropertyValue(element, "font-size")) || 14;
  const fontWeight    = readFontWeightNumber(element);
  const rawAlign      = readPropertyValue(element, "text-align") || "left";
  const textAlign     = (["left", "center", "right"].includes(rawAlign) ? rawAlign : "left") as "left" | "center" | "right";
  const lineHeight = readLineHeightAsPixelNumber(element);
  const letterSpacing = parseFloat(readPropertyValue(element, "letter-spacing")) || 0;
  const fontColor = readCssColorForPicker(element, "color");
  const backgroundColor = readCssColorForPicker(element, "background-color");

  const showBackgroundColour = supportsCssBackgroundColor(category);

  const readBoxDimension = (prop: "width" | "height"): number => {
    const parsed = parseFloat(readPropertyValue(element, prop));
    if (Number.isFinite(parsed) && parsed > 0) return roundTo2(parsed);
    const computed = parseFloat(cs.getPropertyValue(prop));
    if (Number.isFinite(computed) && computed > 0) return roundTo2(computed);
    const rect = element.getBoundingClientRect();
    const px = prop === "width" ? rect.width : rect.height;
    return roundTo2(px);
  };

  const boxWidth = readBoxDimension("width");
  const boxHeight = readBoxDimension("height");
  const widthMode = readDimensionSizingMode(element, "width");
  const heightMode = readDimensionSizingMode(element, "height");

  const handleDimensionModeCommit = useCallback(
    (prop: "width" | "height", mode: "fill" | "hug", displayLabel: string) => {
      handleDeferrableFocus(prop);
      handleCommit(prop, displayLabel, dimensionSizingCssValue(mode));
    },
    [handleDeferrableFocus, handleCommit],
  );

  const handleDimensionRestoreFixed = useCallback(
    (prop: "width" | "height") => {
      handleDeferrableFocus(prop);
      const parsed = parseFloat(readPropertyValue(element, prop));
      const px =
        Number.isFinite(parsed) && parsed > 0
          ? roundTo2(parsed)
          : roundTo2(
              element.getBoundingClientRect()[prop === "width" ? "width" : "height"],
            );
      handleChange(prop, `${px}px`);
    },
    [handleChange, handleDeferrableFocus, element],
  );

  const svgWidth = readSvgDimension(element, "width");
  const svgHeight = readSvgDimension(element, "height");

  const imgFit    = readPropertyValue(element, "object-fit") || "fill";
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
  const borderWidths  = readBorderWidthValues(element);
  const radiusVals    = readRadiusValues(element);
  const opacityParsed = parseFloat(readPropertyValue(element, "opacity"));
  const opacity = Number.isFinite(opacityParsed) ? opacityParsed : 1;

  const layoutType: LayoutType = isGridLayout
    ? "grid"
    : flexDir === "column"
      ? "column"
      : "row";

  const handleLayoutTypeSelect = useCallback(
    (type: LayoutType) => {
      if (type === "grid") {
        if (isGridLayout) return;
        const gtc = `repeat(${DEFAULT_GRID_COLUMNS}, minmax(0, 1fr))`;
        handleFocus("display");
        handleDeferrableFocus("grid-template-columns");
        handleChange("display", "grid");
        handleChange("grid-template-columns", gtc);
        handleCommit("display", "Display", "grid");
        handleCommit("grid-template-columns", "Grid columns", gtc);
        return;
      }
      handleFocus("display");
      handleFocus("flex-direction");
      clearGridTemplateIfNeeded();
      const direction = type === "column" ? "column" : "row";
      handleChange("display", "flex");
      handleChange("flex-direction", direction);
      handleCommit("display", "Display", "flex");
      handleCommit("flex-direction", "Direction", direction);
    },
    [
      isGridLayout,
      handleFocus,
      handleDeferrableFocus,
      handleChange,
      handleCommit,
      clearGridTemplateIfNeeded,
    ],
  );

  // ─── CSS panel: read computed values for the relevant properties ──────
  const cssPanelLines = (CSS_PANEL_PROPS[category] ?? [])
    .map((prop) => ({ prop, value: cs.getPropertyValue(prop).trim() }))
    .filter((l) => l.value && l.value !== "normal" && l.value.length > 0);

  // ─── Element type label for tray header ───────────────────────────────
  const trayTitle = elementTypeLabel(element, category);

  // ─── Shared Box section (rendered for every element category) ─────────
  const BoxSection = (
    <div className="wv-style-section wv-box-section">
      <div className="wv-style-section-head">
        <span className="wv-style-section-title">Box</span>
        <button
          type="button"
          className="wv-style-section-toggle wv-pe"
          aria-expanded={boxSectionOpen}
          aria-label={boxSectionOpen ? "Collapse box section" : "Expand box section"}
          onClick={() => setBoxSectionOpen((open) => !open)}
        >
          {boxSectionOpen ? <SectionCollapseIcon /> : <SectionExpandIcon />}
        </button>
      </div>
      {boxSectionOpen && (
        <div className="wv-box-section-body">
          <div className="wv-box-section-fields">
            {category !== "image" && category !== "stack" && (
              <DimensionControl
                width={boxWidth}
                height={boxHeight}
                widthMode={widthMode}
                heightMode={heightMode}
                widthDisplayLabel="Box Width"
                heightDisplayLabel="Box Height"
                onDimensionChange={(prop, v) => handleChange(prop, v)}
                onDimensionCommit={(prop, v) =>
                  handleCommit(prop, prop === "width" ? "Box Width" : "Box Height", v)}
                onDimensionFocus={(prop) => handleDeferrableFocus(prop)}
                onDimensionCancel={(prop) => revertDeferrablePreview(prop)}
                onDimensionModeCommit={(prop, mode) =>
                  handleDimensionModeCommit(
                    prop,
                    mode,
                    prop === "width" ? "Box Width" : "Box Height",
                  )}
                onDimensionRestoreFixed={handleDimensionRestoreFixed}
              />
            )}
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
            {showBackgroundColour && (
              <ColorPicker
                variant="card"
                cardLabel="Colour"
                value={backgroundColor}
                styleCommitTarget={element}
                selectionDismissSignal={element}
                onChange={(v, target) => handleChange("background-color", v, target)}
                onCommit={(v, target, fromSnap) =>
                  handleCommit("background-color", "Background Colour", v, target, fromSnap)}
                onFocus={() => handleFocus("background-color")}
              />
            )}
          </div>
          <BorderControl
            style={borderVals.style}
            color={borderVals.color}
            widths={borderWidths}
            styleCommitTarget={element}
            selectionDismissSignal={element}
            onStyleChange={(v) => handleChange("border-style", v)}
            onStyleCommit={(v) => handleCommit("border-style", "Border Style", v)}
            onColorChange={(v, target) => handleChange("border-color", v, target)}
            onColorCommit={(v, target, fromSnap) =>
              handleCommit("border-color", "Border Colour", v, target, fromSnap)}
            onWidthChange={handleBorderWidthChange}
            onWidthCommit={handleBorderWidthCommit}
            onFocusStyle={() => handleFocus("border-style")}
            onFocusWidth={snapshotBorderWidth}
            onCancelWidth={revertBorderWidthPreview}
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
        </div>
      )}
    </div>
  );

  const VisibilitySection = (
    <div className="wv-style-section wv-visibility-section">
      <div className="wv-style-section-head">
        <span className="wv-style-section-title">Visibility</span>
        <button
          type="button"
          className="wv-style-section-toggle wv-pe"
          aria-expanded={visibilitySectionOpen}
          aria-label={visibilitySectionOpen ? "Collapse visibility section" : "Expand visibility section"}
          onClick={() => setVisibilitySectionOpen((open) => !open)}
        >
          {visibilitySectionOpen ? <SectionCollapseIcon /> : <SectionExpandIcon />}
        </button>
      </div>
      {visibilitySectionOpen && (
        <div className="wv-visibility-section-body">
          <OpacityControl
            value={opacity}
            onChange={(v) => handleChange("opacity", String(v))}
            onCommit={(v) => handleCommit("opacity", "Opacity", String(v))}
            onFocus={() => handleDeferrableFocus("opacity")}
            onCancel={() => revertDeferrablePreview("opacity")}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`wv-edit-tray wv-pe${hidden ? " wv-edit-tray--hidden" : ""}`}
      aria-hidden={hidden}
    >
      {/* Header row: element type + properties toggle */}
      <div className="wv-edit-tray-head">
        <span className="wv-edit-tray-title">{trayTitle}</span>
        <button
          type="button"
          className={`wv-edit-tray-props-btn wv-pe${cssOpen ? " wv-edit-tray-props-btn--active" : ""}`}
          title="Toggle element properties"
          aria-label="Toggle element properties"
          aria-expanded={cssOpen}
          onClick={() => setCssOpen((s) => !s)}
        >
          <ElementPropsIcon />
        </button>
      </div>

      {/* Computed properties — visible when toggled open */}
      {cssOpen && (
        <div className="wv-edit-props-card">
          {cssPanelLines.length > 0 ? (
            cssPanelLines.map((l) => (
              <p key={l.prop} className="wv-edit-props-line">
                <span className="wv-edit-props-key">{l.prop}:</span>
                <span className="wv-edit-props-val"> {l.value};</span>
              </p>
            ))
          ) : (
            <p className="wv-edit-props-empty">No relevant styles found.</p>
          )}
        </div>
      )}

      {/* Type-specific controls */}
      <div className="wv-edit-controls">

        {/* ── Text ── */}
        {category === "text" && (
          <>
            <div className="wv-typo-stack">
              <div className="wv-typo-card">
                <span className="wv-typo-card-label">Font Size</span>
                <NumberInput
                  cssProperty="font-size"
                  displayLabel="Font Size"
                  value={fontSize}
                  unit="px"
                  min={1}
                  max={999}
                  variant="card"
                  onChange={(v) => handleChange("font-size", v)}
                  onCommit={(v) => handleCommit("font-size", "Font Size", v)}
                  onFocus={() => handleDeferrableFocus("font-size")}
                  onCancel={() => revertDeferrablePreview("font-size")}
                />
              </div>
              <WeightSelect
                variant="card"
                cardLabel="Font Weight"
                value={fontWeight}
                onChange={(v) => handleChange("font-weight", String(v))}
                onCommit={(v) => handleCommit("font-weight", "Font Weight", String(v))}
                onFocus={() => handleFocus("font-weight")}
                onCancel={() => revertDeferrablePreview("font-weight")}
              />
              <SegmentedControl
                variant="card"
                value={textAlign}
                onCommit={(v) => {
                  handleFocus("text-align");
                  handleCommit("text-align", "Font Alignment", v);
                }}
              />
              <div className="wv-typo-dual-row">
                <div className="wv-typo-icon-card">
                  <TypoLineHeightIcon />
                  <NumberInput
                    cssProperty="line-height"
                    displayLabel="Line Height"
                    value={lineHeight}
                    unit="px"
                    min={0}
                    max={500}
                    step={0.5}
                    variant="card"
                    onChange={(v) => handleChange("line-height", v)}
                    onCommit={(v) => handleCommit("line-height", "Line Height", v)}
                    onFocus={() => handleDeferrableFocus("line-height")}
                    onCancel={() => revertDeferrablePreview("line-height")}
                  />
                </div>
                <div className="wv-typo-icon-card">
                  <TypoLetterSpacingIcon />
                  <NumberInput
                    cssProperty="letter-spacing"
                    displayLabel="Letter Spacing"
                    value={letterSpacing}
                    unit="px"
                    min={-20}
                    max={50}
                    step={0.5}
                    variant="card"
                    onChange={(v) => handleChange("letter-spacing", v)}
                    onCommit={(v) => handleCommit("letter-spacing", "Letter Spacing", v)}
                    onFocus={() => handleDeferrableFocus("letter-spacing")}
                    onCancel={() => revertDeferrablePreview("letter-spacing")}
                  />
                </div>
              </div>
              <ColorPicker
                variant="card"
                cardLabel="Font"
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
            <DimensionControl
              width={svgWidth}
              height={svgHeight}
              sizingModes={false}
              widthDisplayLabel="SVG Width"
              heightDisplayLabel="SVG Height"
              onDimensionChange={handleSvgDimensionChange}
              onDimensionCommit={(prop, value) =>
                handleSvgDimensionCommit(
                  prop,
                  prop === "width" ? "SVG Width" : "SVG Height",
                  value,
                )}
              onDimensionFocus={handleSvgDimensionFocus}
              onDimensionCancel={revertSvgDimensionPreview}
            />
          </>
        )}

        {/* ── Image ── */}
        {category === "image" && (
          <>
            <div className="wv-typo-stack">
              <DimensionControl
                width={boxWidth}
                height={boxHeight}
                widthMode={widthMode}
                heightMode={heightMode}
                widthDisplayLabel="Image Width"
                heightDisplayLabel="Image Height"
                onDimensionChange={(prop, v) => handleChange(prop, v)}
                onDimensionCommit={(prop, v) =>
                  handleCommit(prop, prop === "width" ? "Image Width" : "Image Height", v)}
                onDimensionFocus={(prop) => handleDeferrableFocus(prop)}
                onDimensionCancel={(prop) => revertDeferrablePreview(prop)}
                onDimensionModeCommit={(prop, mode) =>
                  handleDimensionModeCommit(
                    prop,
                    mode,
                    prop === "width" ? "Image Width" : "Image Height",
                  )}
                onDimensionRestoreFixed={handleDimensionRestoreFixed}
              />
              <CardSelectControl
                label="Fit"
                value={imgFit}
                options={[
                  { value: "cover", label: "Cover" },
                  { value: "contain", label: "Contain" },
                  { value: "fill", label: "Fill" },
                  { value: "none", label: "None" },
                  { value: "scale-down", label: "Scale Down" },
                ]}
                onFocus={() => handleFocus("object-fit")}
                onCommit={(v) => handleCommit("object-fit", "Fit", v)}
              />
            </div>
          </>
        )}

        {/* ── Stack ── */}
        {category === "stack" && (
          <>
            <DimensionControl
              width={boxWidth}
              height={boxHeight}
              widthMode={widthMode}
              heightMode={heightMode}
              widthDisplayLabel="Box Width"
              heightDisplayLabel="Box Height"
              onDimensionChange={(prop, v) => handleChange(prop, v)}
              onDimensionCommit={(prop, v) =>
                handleCommit(prop, prop === "width" ? "Box Width" : "Box Height", v)}
              onDimensionFocus={(prop) => handleDeferrableFocus(prop)}
              onDimensionCancel={(prop) => revertDeferrablePreview(prop)}
              onDimensionModeCommit={(prop, mode) =>
                handleDimensionModeCommit(
                  prop,
                  mode,
                  prop === "width" ? "Box Width" : "Box Height",
                )}
              onDimensionRestoreFixed={handleDimensionRestoreFixed}
            />
            <SectionDivider />
            <div className="wv-style-section wv-layout-section">
              <div className="wv-style-section-head">
                <span className="wv-style-section-title">Layout</span>
                <button
                  type="button"
                  className="wv-style-section-toggle wv-pe"
                  aria-expanded={layoutSectionOpen}
                  aria-label={layoutSectionOpen ? "Collapse layout section" : "Expand layout section"}
                  onClick={() => setLayoutSectionOpen((open) => !open)}
                >
                  {layoutSectionOpen ? <SectionCollapseIcon /> : <SectionExpandIcon />}
                </button>
              </div>
              {layoutSectionOpen && (
                <div className="wv-layout-section-body">
                  <LayoutTypeControl
                    value={layoutType}
                    onSelect={handleLayoutTypeSelect}
                  />
                  {isGridLayout && (
                    <LayoutColumnsControl
                      value={gridColCount}
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
                  )}
                  <LayoutGapControl
                    mode={isGridLayout ? "grid" : "flex"}
                    flexDirection={flexDir.includes("column") ? "column" : "row"}
                    gap={gapUnified}
                    rowGap={rowGap}
                    colGap={colGap}
                    onGapChange={(v) => handleChange("gap", v)}
                    onGapCommit={(v) => handleCommit("gap", "Gap", v)}
                    onGapFocus={() => handleDeferrableFocus("gap")}
                    onGapCancel={() => revertDeferrablePreview("gap")}
                    onRowGapChange={(v) => handleChange("row-gap", v)}
                    onRowGapCommit={(v) => handleCommit("row-gap", "Vertical gap", v)}
                    onRowGapFocus={() => handleDeferrableFocus("row-gap")}
                    onRowGapCancel={() => revertDeferrablePreview("row-gap")}
                    onColGapChange={(v) => handleChange("column-gap", v)}
                    onColGapCommit={(v) => handleCommit("column-gap", "Horizontal gap", v)}
                    onColGapFocus={() => handleDeferrableFocus("column-gap")}
                    onColGapCancel={() => revertDeferrablePreview("column-gap")}
                  />
                  <AlignmentControl
                    justifyContent={justifyContent}
                    alignItems={alignItems}
                    flexDirection={flexDir}
                    onJustifyCommit={(v) => {
                      handleFocus("justify-content");
                      handleCommit("justify-content", "Main Axis Alignment", v);
                    }}
                    onAlignCommit={(v) => {
                      handleFocus("align-items");
                      handleCommit("align-items", "Cross Axis Alignment", v);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Box section — rendered for all categories ── */}
        <SectionDivider />
        {BoxSection}
        <SectionDivider />
        {VisibilitySection}
      </div>
    </div>
  );
}
