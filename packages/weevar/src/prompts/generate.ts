import type {
  ElementIdentity,
  GeneratedPrompt,
  LayoutChange,
  LayoutType,
  StyleTweak,
  TargetTool,
  WeevarChange,
  WeevarRuntimeConfig,
} from "../engine/layoutTypes";

type PromptOptions = {
  targetTool: TargetTool | "cursor";
  config?: WeevarRuntimeConfig;
};

// ─── Tailwind lookup tables (prompt suggestions only — no DOM logic) ──

const TAILWIND_FONT_SIZE: Record<string, string> = {
  "12px": "text-xs",
  "14px": "text-sm",
  "16px": "text-base",
  "18px": "text-lg",
  "20px": "text-xl",
  "24px": "text-2xl",
  "30px": "text-3xl",
  "36px": "text-4xl",
  "48px": "text-5xl",
  "60px": "text-6xl",
  "72px": "text-7xl",
};

const TAILWIND_FONT_WEIGHT: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black",
};

const TAILWIND_BORDER_RADIUS: Record<string, string> = {
  "0px": "rounded-none",
  "2px": "rounded-sm",
  "4px": "rounded",
  "6px": "rounded-md",
  "8px": "rounded-lg",
  "12px": "rounded-xl",
  "16px": "rounded-2xl",
  "24px": "rounded-3xl",
};

const TAILWIND_OPACITY: Record<string, string> = {
  "0": "opacity-0",
  "0.05": "opacity-5",
  "0.1": "opacity-10",
  "0.2": "opacity-20",
  "0.25": "opacity-25",
  "0.3": "opacity-30",
  "0.4": "opacity-40",
  "0.5": "opacity-50",
  "0.6": "opacity-60",
  "0.7": "opacity-70",
  "0.75": "opacity-75",
  "0.8": "opacity-80",
  "0.9": "opacity-90",
  "0.95": "opacity-95",
  "1": "opacity-100",
};

const TAILWIND_TEXT_ALIGN: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

function tailwindSuggestion(cssProperty: string, value: string): string | null {
  switch (cssProperty) {
    case "font-size":
      return TAILWIND_FONT_SIZE[value] ?? null;
    case "font-weight":
      return TAILWIND_FONT_WEIGHT[value] ?? null;
    case "border-radius":
      return TAILWIND_BORDER_RADIUS[value] ?? null;
    case "opacity":
      return TAILWIND_OPACITY[value] ?? null;
    case "text-align":
      return TAILWIND_TEXT_ALIGN[value] ?? null;
    default:
      return null;
  }
}

function lineText(line: number): string {
  return `line ${line}`;
}

function formatLocation(source?: { file: string; line: number; col: number }): string {
  if (!source) return "";
  return `${source.file}:${source.line}`;
}

function ordinal(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

function cssTagRef(id: ElementIdentity): string {
  if (!id.classList.length) return `<${id.tag}>`;
  return `<${id.tag}.${id.classList.join(".")}>`;
}

function baseRef(id: ElementIdentity): string {
  if (id.componentName) return `<${id.componentName}>`;
  return cssTagRef(id);
}

function withDisambiguation(id: ElementIdentity, force = false): string {
  const root = baseRef(id);
  if (!force && id.componentName) return root;
  if (id.textSnippet) return `${root.replace(/>$/, "")} "${id.textSnippet}">`;
  if (id.classList.length && id.componentName) return `${root.replace(/>$/, "")}.${id.classList[0]}>`;
  return root;
}

function jsxRef(id: ElementIdentity): string {
  return `${withDisambiguation(id).replace(/>$/, "")} />`;
}

function domPathTail(id: ElementIdentity, segments = 3): string {
  const tail = id.domPath?.slice(-segments) ?? [];
  if (!tail.length) return "";
  return tail.map((s) => `${s.tag}[${s.index}]`).join(">");
}

/** Braced `{src:…; dom:…; h:…}` anchor block used by `strictRef` and style prompts. */
function identityBlock(id: ElementIdentity): string {
  const srcPart = id.source ? `${id.source.file}:${id.source.line}` : "source:unknown";
  const path = domPathTail(id);
  const hash = `h:${id.contentHash}`;
  const inner = path
    ? [`src:${srcPart}`, `dom:${path}`, hash].join("; ")
    : [`src:${srcPart}`, hash].join("; ");
  return `{${inner}}`;
}

/**
 * Non-lossy identifier for short prompts:
 * keeps human-readable symbol + concrete source/path anchors for deterministic edits.
 */
function strictRef(id: ElementIdentity): string {
  const core = withDisambiguation(id, true);
  return `${core} ${identityBlock(id)}`;
}

function displacementAnchor(siblings: ElementIdentity[], toIndex: number): string {
  if (!siblings.length || siblings.length === 1) return "as the only child";
  if (toIndex <= 0) return "first";
  if (toIndex >= siblings.length - 1) return "last";
  const prev = siblings[toIndex - 1];
  return `after ${baseRef(prev)}`;
}

function detailedAnchor(siblings: ElementIdentity[], toIndex: number): string {
  if (!siblings.length || siblings.length === 1) return "only child";
  if (toIndex <= 0) return "first child";
  if (toIndex >= siblings.length - 1) {
    const prev = siblings[siblings.length - 2];
    return `last child, after ${jsxRef(prev)}`;
  }
  const prev = siblings[toIndex - 1];
  return `after ${jsxRef(prev)}`;
}

function formatLayoutType(layout: LayoutType): string {
  if (layout.display.includes("flex")) {
    return layout.flexDirection ? `flex-${layout.flexDirection}` : "flex";
  }
  return layout.display;
}

function moveSiblings(change: Extract<LayoutChange, { kind: "move" }>): ElementIdentity[] {
  return change.destinationSiblings ?? change.siblings ?? [];
}

function buildSiblingRenderData(siblings: ElementIdentity[]) {
  const counts = new Map<string, number>();
  for (const s of siblings) {
    const k = baseRef(s);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return siblings.map((s) => {
    const k = baseRef(s);
    const repeated = (counts.get(k) ?? 0) > 1;
    return withDisambiguation(s, repeated);
  });
}

function hasMissingSource(change: LayoutChange): boolean {
  if (change.kind === "reorder") return !change.target.source || !change.parent.source;
  return !change.target.source || !change.fromParent.source || !change.toParent.source;
}

function shortReorder(change: Extract<LayoutChange, { kind: "reorder" }>): string {
  const parentRef = strictRef(change.parent);
  const targetRef = strictRef(change.target);
  const file = change.parent.source?.file;
  const targetLine = change.target.source?.line;
  const anchor = displacementAnchor(change.siblings, change.toIndex);
  const pos = `child index ${change.toIndex} (position ${change.toIndex + 1}; ${anchor})`;
  const where = file ? ` in ${file}` : "";
  const line = targetLine ? ` (${lineText(targetLine)})` : "";
  const order = buildSiblingRenderData(change.siblings)
    .map((s, i) => `${i}: ${s}`)
    .join(" | ");
  return `Reorder children of ${parentRef}${where}: move ${targetRef}${line} from child index ${change.fromIndex} (position ${change.fromIndex + 1}) to ${pos}. Resulting order: ${order}. Preserve all props and styles.`;
}

function shortMove(change: Extract<LayoutChange, { kind: "move" }>): string {
  const targetRef = strictRef(change.target);
  const fromRef = strictRef(change.fromParent);
  const toRef = strictRef(change.toParent);
  const fromLoc = formatLocation(change.fromParent.source);
  const toLoc = formatLocation(change.toParent.source);
  const siblings = moveSiblings(change);
  const anchor = displacementAnchor(siblings, change.toIndex);
  const shortAnchor =
    anchor === "as the only child"
      ? "as the only child"
      : anchor === "first"
        ? "as the first child"
        : anchor === "last"
          ? "as the last child"
          : `as ${anchor}`;
  const targetLine = change.target.source?.line;
  const line = targetLine ? ` (${lineText(targetLine)})` : "";
  const order = buildSiblingRenderData(siblings)
    .map((s, i) => `${i}: ${s}`)
    .join(" | ");
  return `Move ${targetRef}${line} from ${fromRef}${fromLoc ? ` (${fromLoc})` : ""} (child index ${change.fromIndex}) into ${toRef}${toLoc ? ` (${toLoc})` : ""} at child index ${change.toIndex} (${shortAnchor}). Destination order after move: ${order}. Preserve all props.`;
}

function detailedReorder(change: Extract<LayoutChange, { kind: "reorder" }>, tool: PromptOptions["targetTool"]): string {
  const file = change.parent.source?.file ?? "unknown file";
  const containerLine = change.parent.source?.line;
  const targetLine = change.target.source?.line;
  const refs = buildSiblingRenderData(change.siblings);
  const showPath = tool !== "codex";
  const lines = change.siblings
    .map((s, i) => {
      const moved = s === change.target ? "   ← moved" : "";
      const loc = s.source
        ? showPath
          ? ` ${formatLocation(s.source)}`
          : ` line ${s.source.line}`
        : "";
      return `${i + 1}. ${refs[i]}${loc}${moved}`;
    })
    .join("\n");
  const heading = `# Reorder within ${baseRef(change.parent)}`;
  const fileLine = `**File:** ${file}`;
  const classSnippet = change.parent.classList.length
    ? ` — \`<${change.parent.tag} className="${change.parent.classList.join(" ")}">\``
    : "";
  const container = `**Container:** ${baseRef(change.parent)}${containerLine ? ` at line ${containerLine}` : ""}${classSnippet}`;
  const layout = `**Layout:** ${formatLayoutType(change.layoutType)}`;
  const move = [
    "## Move",
    `${jsxRef(change.target)}${targetLine ? ` (${lineText(targetLine)})` : ""}`,
    `From: index ${change.fromIndex} (${ordinal(change.fromIndex + 1)} child)`,
    `To:   index ${change.toIndex} (${detailedAnchor(change.siblings, change.toIndex)})`,
  ].join("\n");
  const constraints = [
    "## Constraints",
    `- Preserve all props on ${baseRef(change.target)}`,
    `- Don't modify the ${formatLayoutType(change.layoutType)} layout`,
    "- Don't introduce wrapper elements",
    "- Don't touch other components in this file",
  ].join("\n");

  const parts = [heading, "", fileLine, container, layout, "", move, "", "## New child order", lines, "", constraints];
  if (tool === "generic") {
    parts.push("", "## Current code", "<!-- TODO: include source snippet -->");
  }
  if (hasMissingSource(change)) {
    parts.push("", "_Tip: install `@weevar/vite-plugin` for source-accurate prompts._");
  }
  return parts.join("\n");
}

function detailedMove(change: Extract<LayoutChange, { kind: "move" }>, tool: PromptOptions["targetTool"]): string {
  const siblings = moveSiblings(change);
  const refs = buildSiblingRenderData(siblings);
  const showPath = tool !== "codex";
  const lines = siblings
    .map((s, i) => {
      const moved = s === change.target ? "   (moved)" : "";
      const loc = s.source
        ? showPath
          ? ` ${formatLocation(s.source)}`
          : ` line ${s.source.line}`
        : "";
      return `${i + 1}. ${refs[i]}${loc}${moved}`;
    })
    .join("\n");
  const source = `**Source:** ${baseRef(change.fromParent)}${change.fromParent.source ? ` in ${formatLocation(change.fromParent.source)}` : ""} (${formatLayoutType(change.fromLayoutType)} layout)`;
  const destination = `**Destination:** ${baseRef(change.toParent)}${change.toParent.source ? ` in ${formatLocation(change.toParent.source)}` : ""} (${formatLayoutType(change.toLayoutType)} layout)`;
  const anchor = displacementAnchor(siblings, change.toIndex);
  const move = [
    "## Move",
    `${jsxRef(change.target)}${change.target.source ? ` at ${formatLocation(change.target.source)}` : ""}`,
    `Remove from: ${baseRef(change.fromParent)}, index ${change.fromIndex}`,
    `Insert into: ${baseRef(change.toParent)}, index ${change.toIndex} (${anchor})`,
  ].join("\n");
  const constraints = [
    "## Constraints",
    `- Preserve all props on ${baseRef(change.target)}`,
    `- Don't modify ${baseRef(change.fromParent)} beyond removing the element`,
    `- Don't modify ${baseRef(change.toParent)}'s layout or styling`,
    "- Don't introduce wrapper elements",
  ].join("\n");

  const parts = [
    `# Move ${baseRef(change.target)} across containers`,
    "",
    source,
    destination,
    "",
    move,
    "",
    "## Destination order after move",
    lines || "1. (destination children unavailable)",
    "",
    constraints,
  ];
  if (tool === "generic") {
    parts.push("", "## Current code", "<!-- TODO: include source snippet -->");
  }
  if (hasMissingSource(change)) {
    parts.push("", "_Tip: install `@weevar/vite-plugin` for source-accurate prompts._");
  }
  return parts.join("\n");
}

function shortStyleTweak(change: StyleTweak): string {
  const ref = baseRef(change.target);
  const block = identityBlock(change.target);

  const displayChange = change.changes.find((c) => c.cssProperty === "display");
  const toDisplay = displayChange?.toValue ?? "";
  const relevantChanges = change.changes.filter((c) => {
    if (toDisplay === "grid" && c.cssProperty === "flex-direction") return false;
    return true;
  });

  const props = relevantChanges
    .map((c) => `\`${c.cssProperty}\` ${c.fromValue} → ${c.toValue}`)
    .join("; ");

  const borderNote = change.borderSummary
    ? ` Effective border: ${change.borderSummary}.`
    : "";

  return `Update styles on ${ref} ${block}: ${props}.${borderNote} Preserve all props and event handlers.`;
}

function detailedStyleTweak(change: StyleTweak, options: PromptOptions): string {
  const showTailwind = options.config?.prompts?.tailwindVerbatimClasses === true;
  const ref = baseRef(change.target);
  const src = change.target.source;
  const classes = change.target.classList;

  const fileLine = src ? `**File:** ${src.file}:${src.line}` : null;
  const block = identityBlock(change.target);
  const elementLine = classes.length
    ? `**Element:** <${change.target.tag} className="${classes.join(" ")}"> ${block}`
    : `**Element:** <${change.target.tag}> ${block}`;
  const categoryLine = `**Category:** ${change.elementCategory}`;

  const tableHeader = showTailwind
    ? "| Property | CSS property | Before | After | Tailwind suggestion |"
    : "| Property | CSS property | Before | After |";
  const tableSep = showTailwind
    ? "|---|---|---|---|---|"
    : "|---|---|---|---|";

  const rows = change.changes.map((c) => {
    const fromSug = showTailwind ? tailwindSuggestion(c.cssProperty, c.fromValue) : null;
    const toSug = showTailwind ? tailwindSuggestion(c.cssProperty, c.toValue) : null;
    const twCell = showTailwind
      ? ` | ${fromSug && toSug ? `\`${fromSug}\` → \`${toSug}\`` : "—"} |`
      : "";
    return `| ${c.displayLabel} | \`${c.cssProperty}\` | \`${c.fromValue}\` | \`${c.toValue}\` |${twCell}`;
  });

  const howToApply = showTailwind
    ? [
        "## How to apply",
        "",
        "**If using Tailwind CSS:** Replace class values using the Tailwind suggestion column.",
        "If the exact value doesn't exist in your config, use the nearest matching Tailwind utility.",
        "",
        "**If using plain CSS, CSS Modules, or inline styles:** Apply the \"After\" values directly.",
      ].join("\n")
    : 'Apply the "After" values for each CSS property listed to the target element.';

  const constraints = [
    "## Constraints",
    `- Only modify the specified properties on ${ref}`,
    "- Preserve all existing props, event handlers, and other styles",
    "- Do not introduce wrapper elements",
    "- Do not change the component's structure or other components in the file",
  ].join("\n");

  const parts: string[] = [
    `# Update styles on ${ref}`,
    "",
    ...(fileLine ? [fileLine] : []),
    elementLine,
    categoryLine,
    "",
    "## Style changes",
    tableHeader,
    tableSep,
    ...rows,
    ...(change.borderSummary
      ? ["", `**Effective border:** ${change.borderSummary}`]
      : []),
    "",
    howToApply,
    "",
    constraints,
  ];

  if (!src) {
    parts.push(
      "",
      "_Tip: install the weevar Vite plugin for source-accurate file and line references in prompts._",
    );
  }

  return parts.join("\n");
}

export function generatePrompt(
  change: WeevarChange,
  options: PromptOptions,
): GeneratedPrompt | null {
  if (change.kind === "style-tweak") {
    if (!change.changes.length) return null;
    const targetTool = options.targetTool === "cursor" ? "codex" : options.targetTool;
    return {
      short: shortStyleTweak(change),
      detailed: detailedStyleTweak(change, { ...options, targetTool }),
      meta: {
        targetTool,
        timestamp: Date.now(),
        change,
      },
    };
  }
  if (change.kind === "reorder" && change.fromIndex === change.toIndex) return null;
  if (
    change.kind === "move" &&
    change.fromParent === change.toParent &&
    change.fromIndex === change.toIndex
  )
    return null;

  const targetTool = options.targetTool === "cursor" ? "codex" : options.targetTool;
  const short = change.kind === "reorder" ? shortReorder(change) : shortMove(change);
  const detailed =
    change.kind === "reorder"
      ? detailedReorder(change, targetTool)
      : detailedMove(change, targetTool);

  return {
    short,
    detailed,
    meta: {
      targetTool,
      timestamp: Date.now(),
      change,
    },
  };
}

export function promptBody(p: GeneratedPrompt, len: "short" | "detailed"): string {
  return len === "short" ? p.short : p.detailed;
}
