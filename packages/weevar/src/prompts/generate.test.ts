import { describe, expect, it } from "vitest";
import type { ElementIdentity, LayoutChange, StyleTweak } from "../engine/layoutTypes";
import { generatePrompt } from "./generate";

const el = (overrides: Partial<ElementIdentity>): ElementIdentity => ({
  tag: "div",
  classList: [],
  contentHash: "0",
  label: "<div>",
  ...overrides,
});

describe("generatePrompt fixtures", () => {
  it("renders worked reorder short example with strict identifiers", () => {
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
    expect(out?.short).toContain("Reorder children of <Nav>");
    expect(out?.short).toContain("src/components/Header.tsx:14");
    expect(out?.short).toContain("move <SignInButton>");
    expect(out?.short).toContain("from child index 1");
    expect(out?.short).toContain("to child index 4");
    expect(out?.short).toContain("Resulting order:");
  });

  it("renders worked move short example with strict identifiers", () => {
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
    expect(out?.short).toContain("Move <CTAButton>");
    expect(out?.short).toContain("src/Sidebar.tsx:22");
    expect(out?.short).toContain("src/Hero.tsx:8");
    expect(out?.short).toContain("(child index 2)");
    expect(out?.short).toContain("at child index 3");
    expect(out?.short).toContain("Destination order after move:");
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

  it("still includes component names in strict refs", () => {
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
  });

  it("includes non-lossy source and dom anchors in short refs", () => {
    const target = el({
      componentName: "App",
      source: { file: "src/App.tsx", line: 176, col: 0 },
      domPath: [
        { tag: "div", index: 0 },
        { tag: "main", index: 1 },
        { tag: "section", index: 2 },
      ],
    });
    const parent = el({
      componentName: "App",
      source: { file: "src/App.tsx", line: 168, col: 0 },
      domPath: [
        { tag: "div", index: 0 },
        { tag: "main", index: 1 },
        { tag: "section", index: 0 },
      ],
    });
    const change: LayoutChange = {
      kind: "reorder",
      target,
      parent,
      fromIndex: 0,
      toIndex: 1,
      siblings: [el({ componentName: "App" }), target],
      layoutType: { display: "block" },
    };
    const out = generatePrompt(change, { targetTool: "claude-code" });
    expect(out?.short).toContain("src:src/App.tsx:168");
    expect(out?.short).toContain("src:src/App.tsx:176");
    expect(out?.short).toContain("dom:div[0]>main[1]>section[2]");
    expect(out?.short).toContain("h:0");
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

describe("StyleTweak prompts", () => {
  const baseTweak: StyleTweak = {
    kind: "style-tweak",
    target: {
      tag: "p",
      classList: ["text-sm", "font-normal"],
      contentHash: "abc123",
      label: "<Para>",
      domPath: [],
      componentName: "Para",
    },
    elementCategory: "text",
    changes: [
      {
        cssProperty: "font-size",
        displayLabel: "Font Size",
        fromValue: "14px",
        toValue: "18px",
      },
    ],
  };

  it("returns null for an empty changes array", () => {
    const empty: StyleTweak = { ...baseTweak, changes: [] };
    expect(generatePrompt(empty, { targetTool: "claude-code" })).toBeNull();
  });

  it("short prompt includes the component name", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p).not.toBeNull();
    expect(p!.short).toContain("Para");
  });

  it("short prompt includes before and after values with arrow", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.short).toContain("14px");
    expect(p!.short).toContain("18px");
    expect(p!.short).toContain("→");
  });

  it("short prompt includes the preserve instruction", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.short).toContain("Preserve all props");
  });

  it("short and detailed prompts surface effective border when borderSummary is set", () => {
    const tweak: StyleTweak = {
      ...baseTweak,
      borderSummary: "type solid, weight 1px, colour #112233",
      changes: [
        {
          cssProperty: "border-style",
          displayLabel: "Border Style",
          fromValue: "none",
          toValue: "solid",
        },
      ],
    };
    const p = generatePrompt(tweak, { targetTool: "claude-code" });
    expect(p!.short).toContain("Effective border:");
    expect(p!.short).toContain("type solid");
    expect(p!.detailed).toContain("**Effective border:**");
    expect(p!.detailed).toContain("colour #112233");
  });

  it("detailed prompt includes a table with before and after columns", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.detailed).toContain("| Font Size |");
    expect(p!.detailed).toContain("`14px`");
    expect(p!.detailed).toContain("`18px`");
  });

  it("detailed prompt does NOT include Tailwind column when disabled", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.detailed).not.toContain("Tailwind suggestion");
  });

  it("detailed prompt includes Tailwind column when enabled", () => {
    const p = generatePrompt(baseTweak, {
      targetTool: "claude-code",
      config: { prompts: { tailwindVerbatimClasses: true } },
    });
    expect(p!.detailed).toContain("Tailwind suggestion");
    expect(p!.detailed).toContain("text-sm");
    expect(p!.detailed).toContain("text-lg");
  });

  it("detailed prompt includes the Constraints section", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.detailed).toContain("## Constraints");
    expect(p!.detailed).toContain("Preserve all existing props");
  });

  it("detailed prompt includes the element tag", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.detailed).toContain("<p");
  });

  it("short prompt includes source file path when source is available", () => {
    const withSource: StyleTweak = {
      ...baseTweak,
      target: {
        ...baseTweak.target,
        source: { file: "src/components/Para.tsx", line: 12, col: 4 },
      },
    };
    const p = generatePrompt(withSource, { targetTool: "claude-code" });
    expect(p!.short).toContain("src/components/Para.tsx");
    expect(p!.short).toContain("12");
  });

  it("handles multiple property changes in one tweak", () => {
    const multi: StyleTweak = {
      ...baseTweak,
      changes: [
        {
          cssProperty: "font-size",
          displayLabel: "Font Size",
          fromValue: "14px",
          toValue: "18px",
        },
        {
          cssProperty: "font-weight",
          displayLabel: "Font Weight",
          fromValue: "400",
          toValue: "600",
        },
      ],
    };
    const p = generatePrompt(multi, { targetTool: "claude-code" });
    expect(p!.detailed).toContain("font-size");
    expect(p!.detailed).toContain("font-weight");
  });

  it("Tailwind suggestions map font-weight 400→600 correctly", () => {
    const multi: StyleTweak = {
      ...baseTweak,
      changes: [
        {
          cssProperty: "font-weight",
          displayLabel: "Font Weight",
          fromValue: "400",
          toValue: "600",
        },
      ],
    };
    const p = generatePrompt(multi, {
      targetTool: "claude-code",
      config: { prompts: { tailwindVerbatimClasses: true } },
    });
    expect(p!.detailed).toContain("font-normal");
    expect(p!.detailed).toContain("font-semibold");
  });

  it("meta block contains the correct change kind and targetTool", () => {
    const p = generatePrompt(baseTweak, { targetTool: "claude-code" });
    expect(p!.meta.change.kind).toBe("style-tweak");
    expect(p!.meta.targetTool).toBe("claude-code");
  });

  it("cursor targetTool is aliased to codex", () => {
    const p = generatePrompt(baseTweak, { targetTool: "cursor" });
    expect(p!.meta.targetTool).toBe("codex");
  });
});
