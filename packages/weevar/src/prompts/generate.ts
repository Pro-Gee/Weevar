import type {
  ElementIdentity,
  GeneratedPrompt,
  LayoutChange,
  LayoutType,
  TargetTool,
  WeevarRuntimeConfig,
} from "../engine/layoutTypes";

type PromptOptions = {
  targetTool: TargetTool | "cursor";
  config?: WeevarRuntimeConfig;
};

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
  const parentRef = baseRef(change.parent);
  const targetRef = baseRef(change.target);
  const file = change.parent.source?.file;
  const targetLine = change.target.source?.line;
  const anchor = displacementAnchor(change.siblings, change.toIndex);
  const pos = `position ${change.toIndex + 1} (${anchor})`;
  const where = file ? ` in ${file}` : "";
  const line = targetLine ? ` (${lineText(targetLine)})` : "";
  return `Reorder children of ${parentRef}${where}: move ${targetRef}${line} from position ${change.fromIndex + 1} to ${pos}. Preserve all props and styles.`;
}

function shortMove(change: Extract<LayoutChange, { kind: "move" }>): string {
  const targetRef = baseRef(change.target);
  const fromRef = baseRef(change.fromParent);
  const toRef = baseRef(change.toParent);
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
  return `Move ${targetRef}${line} from ${fromRef}${fromLoc ? ` (${fromLoc})` : ""} into ${toRef}${toLoc ? ` (${toLoc})` : ""} ${shortAnchor}. Preserve all props.`;
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

export function generatePrompt(
  change: LayoutChange,
  options: PromptOptions,
): GeneratedPrompt | null {
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
