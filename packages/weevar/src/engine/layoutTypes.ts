export type DomPathSegment = {
  tag: string;
  index: number;
  classes?: string[];
};

export type SourceLocation = {
  file: string;
  line: number;
  col: number;
};

export type FiberPathSegment = {
  componentName?: string;
  key?: string | number | null;
  index: number;
  source?: SourceLocation;
};

export type ElementIdentity = {
  fiberPath?: FiberPathSegment[];
  source?: SourceLocation;
  domPath: DomPathSegment[];
  tag: string;
  classList: string[];
  contentHash: string;
  label: string;
  componentName?: string;
  testId?: string;
  textSnippet?: string;
  /** Direct element children (for container disambiguation in prompts). */
  childElementCount?: number;
  /** True when fiber chain includes a host portal (prompts / debugging). */
  inPortal?: boolean;
};

export type LayoutType = {
  display: string;
  flexDirection?: string;
};

export type LayoutChangeReorder = {
  kind: "reorder";
  target: ElementIdentity;
  parent: ElementIdentity;
  fromIndex: number;
  toIndex: number;
  siblings: ElementIdentity[];
  layoutType: LayoutType;
};

export type LayoutChangeMove = {
  kind: "move";
  target: ElementIdentity;
  fromParent: ElementIdentity;
  toParent: ElementIdentity;
  fromIndex: number;
  toIndex: number;
  /** New order in destination after move. */
  destinationSiblings?: ElementIdentity[];
  /** Back-compat with older builders. */
  siblings?: ElementIdentity[];
  fromLayoutType: LayoutType;
  toLayoutType: LayoutType;
};

export type LayoutChange = LayoutChangeReorder | LayoutChangeMove;

export type ElementCategory = "text" | "svg" | "image" | "stack" | "generic";

/** One committed change to a single CSS property on one element. */
export type StylePropertyChange = {
  /** Exact CSS property name e.g. "font-size", "border-radius" */
  cssProperty: string;
  /** Human-readable label shown in the prompt e.g. "Font Size" */
  displayLabel: string;
  /** Computed value before user edited e.g. "14px" */
  fromValue: string;
  /** Committed value after edit e.g. "18px" */
  toValue: string;
};

/** A committed style edit: one or more property changes on one element in one commit action. */
export type StyleTweak = {
  kind: "style-tweak";
  target: ElementIdentity;
  elementCategory: ElementCategory;
  /** All CSS properties changed in this single commit action. */
  changes: StylePropertyChange[];
  /**
   * When a border-* property was committed and the resulting border is visible:
   * concise type / weight / colour for prompts (DOM snapshot after commit).
   */
  borderSummary?: string;
};

/**
 * All change kinds tracked by Weevar.
 * V1 had only LayoutChange (reorder | move).
 * V2 adds style-tweak.
 */
export type WeevarChange = LayoutChange | StyleTweak;

export type BatchedChange = {
  ordinal: number;
  change: WeevarChange;
  badgeAnchor: ElementIdentity;
  capturedAt: number;
};

/** Canonical V2 session type — tracks all change kinds (moves + style tweaks). */
export type EditSession = {
  changes: BatchedChange[];
  startedAt: number;
};

/** @deprecated Use EditSession. Alias kept so existing references continue to compile. */
export type MoveSession = EditSession;

export type TargetTool = "claude-code" | "codex" | "generic";

export type PromptLength = "short" | "detailed";

export type GeneratedPrompt = {
  short: string;
  detailed: string;
  meta: {
    targetTool: TargetTool;
    timestamp: number;
    change: WeevarChange;
  };
};

/** Optional overrides (serializable). Functions can be added later via vite virtual module. */
export type WeevarPromptConfig = {
  /** When true, prompts include parent class strings verbatim (Tailwind-friendly). */
  tailwindVerbatimClasses?: boolean;
  /** From `tailwind.config` `content` when the Vite plugin can resolve it. */
  tailwindContentGlobs?: string[];
  /** e.g. `tailwind.config.ts` for prompt context. */
  tailwindConfigPath?: string;
};

export type WeevarRuntimeConfig = {
  prompts?: WeevarPromptConfig;
};
