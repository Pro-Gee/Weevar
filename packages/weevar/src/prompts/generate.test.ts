import { describe, expect, it } from "vitest";
import type { ElementIdentity, LayoutChange } from "../engine/layoutTypes";
import { generatePrompt } from "./generate";

const el = (overrides: Partial<ElementIdentity>): ElementIdentity => ({
  tag: "div",
  classList: [],
  contentHash: "0",
  label: "<div>",
  ...overrides,
});

describe("generatePrompt fixtures", () => {
  it("renders worked reorder short example verbatim", () => {
    const change: LayoutChange = {
      kind: "reorder",
      target: el({
        componentName: "SignInButton",
        tag: "button",
        source: { file: "src/components/Header.tsx", line: 24, col: 0 },
      }),
      parent: el({
        componentName: "Nav",
        tag: "nav",
        source: { file: "src/components/Header.tsx", line: 14, col: 0 },
      }),
      fromIndex: 1,
      toIndex: 4,
      siblings: [
        el({ componentName: "Logo", source: { file: "src/components/Header.tsx", line: 18, col: 0 } }),
        el({ componentName: "SearchInput", source: { file: "src/components/Header.tsx", line: 20, col: 0 } }),
        el({ componentName: "NavLinks", source: { file: "src/components/Header.tsx", line: 22, col: 0 } }),
        el({ componentName: "NotificationsBell", source: { file: "src/components/Header.tsx", line: 23, col: 0 } }),
        el({ componentName: "SignInButton", source: { file: "src/components/Header.tsx", line: 24, col: 0 } }),
      ],
      layoutType: { display: "flex", flexDirection: "row" },
    };

    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toBe(
      "Reorder children of <Nav> in src/components/Header.tsx: move <SignInButton> (line 24) from position 2 to position 5 (last). Preserve all props and styles.",
    );
  });

  it("renders worked move short example verbatim", () => {
    const change: LayoutChange = {
      kind: "move",
      target: el({
        componentName: "CTAButton",
        source: { file: "src/Sidebar.tsx", line: 34, col: 0 },
      }),
      fromParent: el({
        componentName: "Sidebar",
        source: { file: "src/Sidebar.tsx", line: 22, col: 0 },
      }),
      toParent: el({
        componentName: "Hero",
        source: { file: "src/Hero.tsx", line: 8, col: 0 },
      }),
      fromIndex: 2,
      toIndex: 3,
      destinationSiblings: [
        el({ componentName: "Headline", source: { file: "src/Hero.tsx", line: 12, col: 0 } }),
        el({ componentName: "Subheadline", source: { file: "src/Hero.tsx", line: 14, col: 0 } }),
        el({ componentName: "HeroImage", source: { file: "src/Hero.tsx", line: 16, col: 0 } }),
        el({ componentName: "CTAButton", source: { file: "src/Sidebar.tsx", line: 34, col: 0 } }),
      ],
      fromLayoutType: { display: "block" },
      toLayoutType: { display: "flex", flexDirection: "column" },
    };

    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toBe(
      "Move <CTAButton> (line 34) from <Sidebar> (src/Sidebar.tsx:22) into <Hero> (src/Hero.tsx:8) as the last child. Preserve all props.",
    );
  });

  it("renders detailed reorder sections", () => {
    const change: LayoutChange = {
      kind: "reorder",
      target: el({
        componentName: "SignInButton",
        source: { file: "src/components/Header.tsx", line: 24, col: 0 },
      }),
      parent: el({
        componentName: "Nav",
        source: { file: "src/components/Header.tsx", line: 14, col: 0 },
        classList: ["flex", "gap-6", "items-center"],
      }),
      fromIndex: 1,
      toIndex: 4,
      siblings: [
        el({ componentName: "Logo", source: { file: "src/components/Header.tsx", line: 18, col: 0 } }),
        el({ componentName: "SearchInput", source: { file: "src/components/Header.tsx", line: 20, col: 0 } }),
        el({ componentName: "NavLinks", source: { file: "src/components/Header.tsx", line: 22, col: 0 } }),
        el({ componentName: "NotificationsBell", source: { file: "src/components/Header.tsx", line: 23, col: 0 } }),
        el({ componentName: "SignInButton", source: { file: "src/components/Header.tsx", line: 24, col: 0 } }),
      ],
      layoutType: { display: "flex", flexDirection: "row" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.detailed).toContain("# Reorder within <Nav>");
    expect(out?.detailed).toContain("## New child order");
    expect(out?.detailed).toContain("## Constraints");
  });

  it("renders detailed move sections", () => {
    const change: LayoutChange = {
      kind: "move",
      target: el({
        componentName: "CTAButton",
        source: { file: "src/Sidebar.tsx", line: 34, col: 0 },
      }),
      fromParent: el({
        componentName: "Sidebar",
        source: { file: "src/Sidebar.tsx", line: 22, col: 0 },
      }),
      toParent: el({
        componentName: "Hero",
        source: { file: "src/Hero.tsx", line: 8, col: 0 },
      }),
      fromIndex: 2,
      toIndex: 3,
      destinationSiblings: [
        el({ componentName: "Headline", source: { file: "src/Hero.tsx", line: 12, col: 0 } }),
        el({ componentName: "Subheadline", source: { file: "src/Hero.tsx", line: 14, col: 0 } }),
        el({ componentName: "HeroImage", source: { file: "src/Hero.tsx", line: 16, col: 0 } }),
        el({ componentName: "CTAButton", source: { file: "src/Sidebar.tsx", line: 34, col: 0 } }),
      ],
      fromLayoutType: { display: "block" },
      toLayoutType: { display: "flex", flexDirection: "column" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.detailed).toContain("# Move <CTAButton> across containers");
    expect(out?.detailed).toContain("## Destination order after move");
    expect(out?.detailed).toContain("## Constraints");
  });
});

describe("generatePrompt edge cases", () => {
  it("uses tag+classes when component name missing", () => {
    const change: LayoutChange = {
      kind: "reorder",
      target: el({ tag: "div", classList: ["flex", "gap-4"] }),
      parent: el({ componentName: "Header" }),
      fromIndex: 0,
      toIndex: 1,
      siblings: [el({ componentName: "Logo" }), el({ tag: "div", classList: ["flex", "gap-4"] })],
      layoutType: { display: "flex", flexDirection: "row" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toContain("<div.flex.gap-4>");
  });

  it("appends source tip in detailed output when source is missing", () => {
    const change: LayoutChange = {
      kind: "reorder",
      target: el({ componentName: "Button" }),
      parent: el({ componentName: "Header" }),
      fromIndex: 0,
      toIndex: 1,
      siblings: [el({ componentName: "Link" }), el({ componentName: "Button" })],
      layoutType: { display: "flex", flexDirection: "row" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.detailed).toContain("_Tip: install `@weevar/vite-plugin` for source-accurate prompts._");
  });

  it("describes single-child destination as only child", () => {
    const change: LayoutChange = {
      kind: "move",
      target: el({ componentName: "CTAButton" }),
      fromParent: el({ componentName: "Sidebar" }),
      toParent: el({ componentName: "Hero" }),
      fromIndex: 0,
      toIndex: 0,
      destinationSiblings: [el({ componentName: "CTAButton" })],
      fromLayoutType: { display: "block" },
      toLayoutType: { display: "flex", flexDirection: "column" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toContain("as the only child");
  });

  it("disambiguates repeated sibling names", () => {
    const navA = el({ componentName: "NavItem", textSnippet: "Dashboard" });
    const navB = el({ componentName: "NavItem", textSnippet: "Settings" });
    const change: LayoutChange = {
      kind: "reorder",
      target: navB,
      parent: el({ componentName: "Nav" }),
      fromIndex: 1,
      toIndex: 0,
      siblings: [navB, navA],
      layoutType: { display: "flex", flexDirection: "column" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.detailed).toContain('<NavItem "Settings">');
    expect(out?.detailed).toContain('<NavItem "Dashboard">');
  });

  it("returns null for same-position reorder", () => {
    const change: LayoutChange = {
      kind: "reorder",
      target: el({ componentName: "A" }),
      parent: el({ componentName: "P" }),
      fromIndex: 2,
      toIndex: 2,
      siblings: [],
      layoutType: { display: "block" },
    };
    expect(generatePrompt(change, { targetTool: "claude-code" })).toBeNull();
  });

  it("prefers component name over classes by default", () => {
    const button = el({
      componentName: "Button",
      classList: ["primary", "lg"],
    });
    const change: LayoutChange = {
      kind: "reorder",
      target: button,
      parent: el({ componentName: "Toolbar" }),
      fromIndex: 0,
      toIndex: 1,
      siblings: [el({ componentName: "IconButton" }), button],
      layoutType: { display: "flex", flexDirection: "row" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toContain("<Button>");
    expect(out?.short).not.toContain("<Button.primary>");
  });
});

describe("tool variants", () => {
  const change: LayoutChange = {
    kind: "reorder",
    target: el({ componentName: "SignInButton", source: { file: "src/components/Header.tsx", line: 24, col: 0 } }),
    parent: el({ componentName: "Nav", source: { file: "src/components/Header.tsx", line: 14, col: 0 } }),
    fromIndex: 1,
    toIndex: 2,
    siblings: [
      el({ componentName: "Logo", source: { file: "src/components/Header.tsx", line: 18, col: 0 } }),
      el({ componentName: "NotificationsBell", source: { file: "src/components/Header.tsx", line: 23, col: 0 } }),
      el({ componentName: "SignInButton", source: { file: "src/components/Header.tsx", line: 24, col: 0 } }),
    ],
    layoutType: { display: "flex", flexDirection: "row" },
  };

  it("produces distinct detailed outputs for tool variants", () => {
    const claude = generatePrompt(change, { targetTool: "claude-code" })!;
    const codex = generatePrompt(change, { targetTool: "codex" })!;
    const generic = generatePrompt(change, { targetTool: "generic" })!;
    expect(claude.detailed).not.toBe(codex.detailed);
    expect(generic.detailed).toContain("## Current code");
  });
});
