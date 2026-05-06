import { describe, expect, it } from "vitest";
import type { ElementIdentity, LayoutChange, MoveSession } from "../engine/layoutTypes";
import { generateBatchedPrompt } from "./generateBatched";

const el = (overrides: Partial<ElementIdentity>): ElementIdentity => ({
  tag: "div",
  classList: [],
  contentHash: "0",
  label: "<div>",
  ...overrides,
});

function reorderChange(file: string, parentName: string, targetName: string, fromIndex: number, toIndex: number): LayoutChange {
  return {
    kind: "reorder",
    target: el({ componentName: targetName, source: { file, line: 20 + toIndex, col: 0 } }),
    parent: el({ componentName: parentName, source: { file, line: 10, col: 0 }, classList: ["flex"] }),
    fromIndex,
    toIndex,
    siblings: [
      el({ componentName: "A", source: { file, line: 11, col: 0 } }),
      el({ componentName: "B", source: { file, line: 12, col: 0 } }),
      el({ componentName: targetName, source: { file, line: 20 + toIndex, col: 0 } }),
    ],
    layoutType: { display: "flex", flexDirection: "row" },
  };
}

describe("generateBatchedPrompt", () => {
  it("returns null for empty sessions", () => {
    const session: MoveSession = { changes: [], startedAt: Date.now() };
    expect(generateBatchedPrompt(session, { targetTool: "claude-code" })).toBeNull();
  });

  it("returns single-move prompt unchanged", () => {
    const change = reorderChange("src/A.tsx", "Nav", "Btn", 1, 2);
    const session: MoveSession = {
      startedAt: Date.now(),
      changes: [{ ordinal: 1, change, badgeAnchor: change.target, capturedAt: Date.now() }],
    };
    const out = generateBatchedPrompt(session, { targetTool: "claude-code" });
    expect(out?.short.startsWith("Reorder children of")).toBe(true);
    expect(out?.detailed.startsWith("# Reorder within")).toBe(true);
  });

  it("builds combined output for cross-file sessions", () => {
    const c1 = reorderChange("src/Header.tsx", "Nav", "SignInButton", 1, 2);
    const c2 = reorderChange("src/Footer.tsx", "Footer", "SocialLinks", 0, 2);
    const session: MoveSession = {
      startedAt: Date.now(),
      changes: [
        { ordinal: 1, change: c1, badgeAnchor: c1.target, capturedAt: Date.now() },
        { ordinal: 2, change: c2, badgeAnchor: c2.target, capturedAt: Date.now() },
      ],
    };
    const out = generateBatchedPrompt(session, { targetTool: "claude-code" });
    expect(out?.short).toContain("2 layout changes");
    expect(out?.short).toContain("\n1. ");
    expect(out?.short).toContain("\n2. ");
    expect(out?.detailed).toContain("# Multi-step layout change (2 moves)");
    expect(out?.detailed).toContain("## 1.");
    expect(out?.detailed).toContain("## 2.");
    expect(out?.detailed).toContain("## Global constraints");
  });

  it("omits repeated file line for codex consecutive same-file changes", () => {
    const c1 = reorderChange("src/Header.tsx", "Nav", "A", 0, 1);
    const c2 = reorderChange("src/Header.tsx", "Nav", "B", 1, 2);
    const session: MoveSession = {
      startedAt: Date.now(),
      changes: [
        { ordinal: 1, change: c1, badgeAnchor: c1.target, capturedAt: Date.now() },
        { ordinal: 2, change: c2, badgeAnchor: c2.target, capturedAt: Date.now() },
      ],
    };
    const out = generateBatchedPrompt(session, { targetTool: "codex" });
    const fileCount = (out?.detailed.match(/\*\*File:\*\*/g) ?? []).length;
    expect(fileCount).toBe(1);
  });

  it("supports re-moved element and preserved ordinals", () => {
    const c1 = reorderChange("src/Header.tsx", "Nav", "Item", 0, 2);
    const c2 = reorderChange("src/Header.tsx", "Nav", "Other", 1, 0);
    const c3 = reorderChange("src/Header.tsx", "Nav", "Item", 2, 1);
    const session: MoveSession = {
      startedAt: Date.now(),
      changes: [
        { ordinal: 1, change: c1, badgeAnchor: c1.target, capturedAt: Date.now() },
        { ordinal: 2, change: c2, badgeAnchor: c2.target, capturedAt: Date.now() },
        { ordinal: 3, change: c3, badgeAnchor: c3.target, capturedAt: Date.now() },
      ],
    };
    const out = generateBatchedPrompt(session, { targetTool: "claude-code" });
    expect(out?.detailed).toContain("## 1.");
    expect(out?.detailed).toContain("## 2.");
    expect(out?.detailed).toContain("## 3.");
  });

  it("undo-then-add keeps contiguous ordinals", () => {
    const c1 = reorderChange("src/Header.tsx", "Nav", "Item1", 0, 1);
    const c2 = reorderChange("src/Header.tsx", "Nav", "Item2", 1, 2);
    const c3 = reorderChange("src/Header.tsx", "Nav", "Item3", 0, 2);
    const session: MoveSession = {
      startedAt: Date.now(),
      changes: [
        { ordinal: 1, change: c1, badgeAnchor: c1.target, capturedAt: Date.now() },
        { ordinal: 2, change: c2, badgeAnchor: c2.target, capturedAt: Date.now() },
      ],
    };
    session.changes.pop();
    session.changes.push({ ordinal: 2, change: c3, badgeAnchor: c3.target, capturedAt: Date.now() });
    const out = generateBatchedPrompt(session, { targetTool: "claude-code" });
    expect(out?.detailed).toContain("## 1.");
    expect(out?.detailed).toContain("## 2.");
    expect(out?.detailed).not.toContain("## 3.");
  });
});
