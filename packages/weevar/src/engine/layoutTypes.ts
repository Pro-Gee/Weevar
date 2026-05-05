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

export type TargetTool = "claude-code" | "codex" | "generic";

export type PromptLength = "short" | "detailed";

export type GeneratedPrompt = {
  short: string;
  detailed: string;
  meta: {
    targetTool: TargetTool;
    timestamp: number;
    change: LayoutChange;
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
