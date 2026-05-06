import type { GeneratedPrompt, MoveSession, TargetTool } from "../engine/layoutTypes";
import { generatePrompt } from "./generate";

function stripShortConstraint(short: string): string {
  return short.replace(/\s+Preserve[^.]*\.\s*$/i, "").trim();
}

function stripDetailedHeadingAndConstraints(detailed: string): string {
  const noHeading = detailed.replace(/^#\s+[^\n]+\n+/, "");
  return noHeading.replace(/\n## Constraints[\s\S]*$/m, "").trim();
}

function firstFilePath(changeText: string): string | undefined {
  const m = changeText.match(/\*\*File:\*\*\s+([^\n]+)/);
  return m?.[1]?.trim();
}

function maybeOmitRepeatedFileForCodex(
  sectionBody: string,
  tool: TargetTool,
  prevFile?: string,
): { body: string; file?: string } {
  const file = firstFilePath(sectionBody);
  if (tool !== "codex") return { body: sectionBody, file };
  if (!file || !prevFile || file !== prevFile) return { body: sectionBody, file };
  return {
    body: sectionBody.replace(/\*\*File:\*\*[^\n]*\n?/m, "").trim(),
    file,
  };
}

export function generateBatchedPrompt(
  session: MoveSession,
  options: { targetTool: TargetTool },
): GeneratedPrompt | null {
  if (!session.changes.length) return null;
  if (session.changes.length === 1) {
    return generatePrompt(session.changes[0].change, { targetTool: options.targetTool });
  }

  const sorted = [...session.changes].sort((a, b) => a.ordinal - b.ordinal);
  const perMove = sorted
    .map((c) => ({
      ordinal: c.ordinal,
      p: generatePrompt(c.change, { targetTool: options.targetTool }),
    }))
    .filter((x): x is { ordinal: number; p: GeneratedPrompt } => Boolean(x.p));

  if (!perMove.length) return null;

  const shortItems = perMove
    .map((x) => `${x.ordinal}. ${stripShortConstraint(x.p.short)}.`)
    .join("\n\n");
  const short =
    `${perMove.length} layout changes (apply in order; each step's positions are relative to the state after prior steps):\n\n` +
    `${shortItems}\n\n` +
    `Preserve all props and styles. Don't introduce wrapper elements.`;

  let prevFile: string | undefined;
  const sections = perMove
    .map((x) => {
      const body = stripDetailedHeadingAndConstraints(x.p.detailed);
      const adjusted = maybeOmitRepeatedFileForCodex(body, options.targetTool, prevFile);
      prevFile = adjusted.file ?? prevFile;
      const withGeneric =
        options.targetTool === "generic"
          ? `${adjusted.body}\n\n<!-- TODO: include source snippets -->`
          : adjusted.body;
      return `## ${x.ordinal}. ${withGeneric}`;
    })
    .join("\n\n---\n\n");

  const detailed =
    `# Multi-step layout change (${perMove.length} moves)\n\n` +
    `Apply these changes in the order listed below. Each section's positions and\n` +
    `indices are relative to the state of the page **after the preceding sections\n` +
    `have been applied**, not the original state.\n\n` +
    `---\n\n` +
    `${sections}\n\n` +
    `---\n\n` +
    `## Global constraints\n\n` +
    `- Preserve all props on every moved element\n` +
    `- Don't introduce wrapper elements anywhere\n` +
    `- Don't modify any layout, spacing, or styling on the containers\n` +
    `- Apply changes strictly in the order listed. Each section's indices reflect\n` +
    `the state *after* prior sections are applied\n` +
    `- If a move references a position that doesn't exist in your current view of\n` +
    `the file, the prior sections may not have been applied yet — apply them in\n` +
    `order before continuing`;

  return {
    short,
    detailed,
    meta: {
      targetTool: options.targetTool,
      timestamp: Date.now(),
      change: perMove[perMove.length - 1].p.meta.change,
    },
  };
}
