# Technical Requirements Document

**Product:** Weevar
**Audience:** Engineers building the package
**Companion:** PRD.md

This document describes how to actually build the thing. It is opinionated about technology choices and explicit about tradeoffs. Where there is genuine ambiguity, both options are presented with a recommendation.

---

## 1. High-Level Architecture

Three logical layers:

```
┌─────────────────────────────────────────────────────┐
│  Host Integration Layer                              │
│  - <Weevar /> component (no-op in production)    │
│  - Optional Vite/Webpack/Next plugin (source maps)   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Overlay Runtime (Shadow DOM React island)          │
│  - Toolbar, panels, drop indicators                  │
│  - State machine (idle, hover, select, drag, panel)  │
│  - Renders OUTSIDE host React tree                   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Inspector Engine                                    │
│  - DOM/Fiber traversal & element identity            │
│  - Pointer event capture & hit-testing               │
│  - Drag interaction & drop targeting                 │
│  - DOM mutation registry & re-application            │
│  - Layout diffing                                    │
│  - Prompt generation                                 │
└─────────────────────────────────────────────────────┘
```

The Overlay Runtime and Inspector Engine ship as a single bundle. The Host Integration Layer is a thin wrapper that gates loading on `process.env.NODE_ENV === 'development'`.

## 2. Host Integration

### Primary integration: single component

```tsx
// app/layout.tsx (Next.js) or src/main.tsx (Vite/CRA)
import { Weevar } from 'weevar/react';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Weevar />
    </>
  );
}
```

The `Weevar` component:
- Returns `null` in production (early return on `process.env.NODE_ENV !== 'development'`).
- In development, mounts a Shadow DOM root on first interaction (lazy) — no work happens until the user activates the overlay.
- Accepts optional props: `keybind`, `position`, `disabled`.

### Production stripping

Two layers of defense to prevent shipping the runtime:

1. **Module-level guard:** the runtime entry checks `process.env.NODE_ENV` and exports a no-op stub in production. Bundlers will tree-shake the entire dependency graph away.
2. **Subpath imports:** `weevar/react` resolves to a different file in production via `package.json` `exports` conditions:
   ```json
   {
     "exports": {
       "./react": {
         "development": "./dist/react.dev.js",
         "default": "./dist/react.prod.js"
       }
     }
   }
   ```
   The prod file is ~50 bytes (just the no-op component).

### Optional plugin: source location enrichment

A Babel plugin (or Vite/SWC equivalent) that adds `data-wv-source="file:line:col"` attributes to JSX elements. React already provides `__source` via `@babel/plugin-transform-react-jsx-source` and exposes it via Fiber's `_debugSource` — we read from that first, fall back to the data attribute if Fiber access fails.

The plugin is **optional**. Without it, prompts use DOM-derived identity (selectors + class names) and are still useful, just less precise.

## 3. Overlay Rendering

**Strategy: Shadow DOM-isolated React island, rendered into a portal at `document.body`.**

```ts
// pseudo-code
const host = document.createElement('div');
host.id = '__weevar_host__';
host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483646;';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'closed' });
const root = createRoot(shadow.appendChild(document.createElement('div')));
root.render(<OverlayApp />);
```

### Why Shadow DOM (closed mode)

- **Style isolation in both directions.** Host CSS doesn't leak in (so our toolbar isn't affected by global `* { box-sizing: border-box; }` or aggressive resets); our styles don't leak out.
- **Closed mode** prevents accidental host-app access via `element.shadowRoot`.
- **DOM isolation.** React's reconciliation never traverses into a shadow root, so the host React app cannot accidentally manipulate our overlay.

### Rendering layers

The host element is `pointer-events: none` by default so it doesn't block interaction with the host app. Individual overlay elements (toolbar, panel, drag handle) opt in with `pointer-events: auto`. Bounding-box outlines and insertion bars stay non-interactive.

### Z-index strategy

Single fixed value `2147483646` (one less than max) on the shadow host. Inside the shadow root, we manage our own layering with stacking contexts. This protects against host apps that legitimately need very high z-indexes (full-screen modals, etc.) — we sit just below max, the user's content sits below us.

### CSS approach

Inside the shadow root: vanilla CSS in a `<style>` tag, with CSS custom properties for theming. No CSS-in-JS framework needed; bundle size matters and the styling surface is small. Consider `goober` only if dynamic styling becomes painful.

## 4. Event Handling

### Capture-phase document listeners

When the overlay is **active**, attach `pointerdown`, `pointermove`, `pointerup`, `keydown`, and `wheel` listeners on `document` in capture phase. This lets us inspect events before the host app sees them.

```ts
document.addEventListener('pointerdown', handler, { capture: true, passive: false });
```

Per state, we either:
- **Pass through** (do nothing — host app handles normally).
- **Inspect and pass through** (e.g. update hover indicator without preventing the click).
- **Capture and stop** (e.g. while in active drag, prevent the host from receiving any pointer events).

### State machine

Five states, explicit transitions:

```
       activate            hover element          click handle
idle ──────────────► active ──────────────► select ─────────────► drag
                                                                     │
                                                       drop ◄────────┘
                                                         │
                                                         ▼
                                                       panel ──┬──► copy → idle (overlay still active)
                                                               └──► discard → active
```

`Esc` from any non-idle state returns to either `active` (cancel drag) or `idle` (deactivate).

### Why not native HTML5 drag-and-drop?

- Limited styling (browser-imposed drag image, can't customize cursor preview)
- Inconsistent across browsers
- No good touch story
- Can't be programmatically cancelled cleanly
- Image dragging fights us on every text-containing element

We implement custom drag using pointer events. This is ~150 lines of code and fully controllable.

## 5. DOM Inspection & Element Identity

This is the hardest engineering problem in the project. **If element identity isn't stable across re-renders, the rest of the product doesn't work.**

### The problem

When React reconciles, DOM nodes can be:
- Replaced (different element type, key change)
- Re-parented (same key, different position)
- Detached temporarily (hidden via conditional rendering)

A user selects an element, and 50ms later React re-renders and the DOM node we held a reference to is gone. We need to relocate it.

### Multi-layer identity scheme

For every selected/tracked element, we compute an `ElementIdentity`:

```ts
type ElementIdentity = {
  // Layer 1: React Fiber path (most stable, only available with React)
  fiberPath?: FiberPathSegment[];

  // Layer 2: Source location (very stable if Babel plugin is installed)
  source?: { file: string; line: number; col: number };

  // Layer 3: DOM-derived path (always available, breaks on structural changes)
  domPath: DomPathSegment[];

  // Layer 4: Content fingerprint (text content hash, for tiebreaking)
  contentHash: string;

  // Component info (display purposes mostly)
  componentName?: string;
  tag: string;
  classList: string[];
  testId?: string;
};

type FiberPathSegment = {
  componentName?: string;  // 'NavItem' or 'div'
  key?: string | number;   // React key prop if any
  index: number;            // position in parent's children
  source?: { file, line, col };
};

type DomPathSegment = {
  tag: string;
  index: number;            // nth-child within parent
  classes?: string[];       // for tiebreaking only, not equality
};
```

### Resolving identity to a current DOM node

Try in order until one succeeds:

1. **Fiber path lookup**: walk from a known fiber root, matching componentName + key + index at each level. If found, return its `stateNode` (the DOM element).
2. **Source location lookup**: query `document.querySelectorAll('[data-wv-source="file:line:col"]')`. If exactly one match, use it.
3. **DOM path lookup**: traverse the `domPath` from `document.body`. If the path resolves and the resulting element's content hash matches, use it.
4. **Content hash search**: scan the document for any element with matching text + tag + classes. Last resort; may be slow.

If all four fail, the element is considered gone — clear selection, show toast.

### Reading React Fiber

React doesn't expose Fiber officially, but the access is well-known and stable across major versions:

```ts
function getFiberFromDOM(node: Element): Fiber | null {
  const key = Object.keys(node).find(
    k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
  );
  return key ? (node as any)[key] : null;
}
```

For the React DevTools hook (an alternative, more "official" path):

```ts
const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
// hook.renderers gives us access to fiber roots
```

We use the `__reactFiber$` key as primary; the DevTools hook is a fallback. **Document this is React-internal and may break.** Test against React 17, 18, and 19. The integration is small enough that adapting to changes is cheap.

### Building the Fiber path

Walk up via `fiber.return` until we hit the root, recording each segment. Component name from `fiber.type` (string for host components, function/class name for components). Source from `fiber._debugSource` (only present in dev builds).

## 6. Drag and Drop Implementation

### Initiation

Drag begins on `pointerdown` on the drag handle (not the element body — see UX spec). Capture pointer with `setPointerCapture` so move events keep coming even outside the original target.

### During drag

- Throttle `pointermove` to `requestAnimationFrame`.
- On each frame:
  1. Hide the cursor preview briefly, call `document.elementFromPoint(x, y)`, restore preview. (Standard trick for hit-testing under custom cursors.)
  2. Walk up from the hit element looking for valid drop containers.
  3. Compute insertion index within that container based on cursor position relative to siblings.
  4. Update insertion bar position (CSS, no DOM mutation).
  5. **Optionally** apply DOM reorder live (see § 7) for true real-time reflow.

### Valid drop targets

For V1, a "valid drop target" is:
- Any DOM element that's a flex/grid/block container (i.e. not a leaf), AND
- Visible (non-zero bounding rect, not `display: none`), AND
- Not inside the dragged element itself (no self-drops), AND
- Not the same exact position the element already occupies.

### Computing insertion index

For flex-row containers: project sibling midpoints onto the X axis, find which side of which midpoint the cursor lies.
For flex-column / block: same on Y axis.
For grid: more complex — compute which grid cell the cursor is in. **V1: treat grid as block-flow (insert before/after children in source order).** True grid-cell logic in V2.

### Auto-scroll

When cursor is within 60px of a scrollable ancestor's edge, scroll that ancestor at a rate of `(60 - distance) * 0.5` px/frame.

### Recommendation: don't pull in `dnd-kit` or `react-dnd`

Both are excellent libraries but solve a different problem (drag-drop *within your own React tree* with React state for source/target). We're operating *on someone else's React tree* and need to compute drop targets from the live DOM, not from a static set of registered droppables. A custom implementation is ~200 LOC.

## 7. Safe Runtime DOM Mutation

This is the second-hardest engineering problem. We need to reflect drag operations in the live UI without breaking React.

### The fundamental conflict

React's mental model: "I own the DOM children of any element I rendered. If you change them, on my next render I will overwrite your changes."

Our requirement: "Move this DOM node to a new position so the user sees a real layout reflow."

There is no magic solution. There are tradeoffs.

### Strategy A: CSS-only preview (V1 default)

Don't actually reorder DOM nodes. Instead:
- For flex containers with `order` available, set `order` CSS on each child to achieve the visual reorder. This requires no DOM manipulation and React doesn't fight us.
- For block flow, render an absolute-positioned ghost of the element at the drop position; show insertion indicator; the actual layout doesn't reflow until the prompt is applied externally.

**Pros:** zero conflict with React. Stable. Simple.
**Cons:** Doesn't show real layout reflow. The "real-time DOM updates during interaction" requirement is partially met (visual indicator, not real reflow).

### Strategy B: Direct DOM mutation + MutationObserver re-application

Actually move the DOM node:

```ts
function applyReorder(target: Element, newParent: Element, index: number) {
  const ref = newParent.children[index] ?? null;
  newParent.insertBefore(target, ref);
}
```

Then, install a `MutationObserver` on the (potentially) affected parents. If React reverts our change (parent's `childList` mutation puts the original order back), we re-apply our mutation immediately. We register all "pending" mutations in a registry; each one is re-applied as needed.

**Pros:** Real reflow, true to the spec.
**Cons:** Fragile. React may produce visual flicker as it renders, then we re-apply. Some mutations are unrecoverable (key prop changes will move components, not just DOM nodes). Conditional rendering can remove nodes entirely.

### Strategy C: Hybrid (recommended for V1)

- **During drag:** Strategy A (CSS-only). No DOM mutations. Fast, conflict-free, visually clear via insertion bars and layout reflow via `order`.
- **On drop:** Strategy B for elements that aren't React-controlled fragments — apply DOM mutation, install MutationObserver to re-apply for the duration the user is in the panel state.
- **On panel discard or page navigation:** clear all pending mutations, restore original DOM order from snapshot.

This gives users real visual feedback during exploration (CSS `order` is genuinely re-flowing), and persistent change feedback while they decide whether to copy the prompt. If the change vanishes due to React re-render and re-application cycle, that's information for the user — they might want a more careful prompt.

### Snapshot for restoration

Before any mutation, snapshot the relevant parent's `childNodes` array (just node references in order). On reset, restore.

```ts
type MutationSnapshot = {
  parent: Element;
  originalChildren: Node[];  // weak references, but parent retains them
};
```

### Why React.createPortal-based mutations don't help

You might think: "Can we use a React portal to render a copy at the new position?" No — portals require host React access, which we don't have, and they wouldn't suppress the original-position rendering.

## 8. Avoiding React Reconciliation Conflicts

Beyond the mutation strategy, several practical guidelines:

- **Never modify children of a component we know to be a `React.Fragment`** — fragments don't have a stable host node.
- **Pause animations during drag.** Inject a class on the host that sets `* { transition: none !important; animation-play-state: paused !important; }`. Restore on drag end. Otherwise, transitions interfere with bounding rect calculations.
- **Watch for hydration.** During SSR hydration, DOM mutations cause hydration mismatches and trigger client re-render. Wait for hydration to complete (signal: presence of React root in `__reactContainer$xxx`) before allowing activation.
- **React 18 concurrent features.** Concurrent rendering can produce intermediate DOM states. Our identity scheme should tolerate brief inconsistency; we already retry resolution on each interaction.
- **StrictMode double-invocation in dev.** Test with StrictMode on. Our overlay should mount idempotently.

## 9. Layout Diffing

After a drop, capture before/after states and produce a structured `LayoutChange`:

```ts
type LayoutChange =
  | {
      kind: 'reorder';
      target: ElementIdentity;
      parent: ElementIdentity;
      fromIndex: number;
      toIndex: number;
      siblings: ElementIdentity[];  // in new order
      layoutType: LayoutType;
    }
  | {
      kind: 'move';
      target: ElementIdentity;
      fromParent: ElementIdentity;
      toParent: ElementIdentity;
      fromIndex: number;
      toIndex: number;
      fromLayoutType: LayoutType;
      toLayoutType: LayoutType;
    };

type LayoutType = {
  display: 'flex' | 'grid' | 'block' | 'inline-flex' | 'inline-grid' | 'inline-block';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gridTemplate?: string;
};
```

Layout type comes from `getComputedStyle(parent)`. We capture this at drop time, snapshot, and pass to the prompt generator.

## 10. Prompt Generation

Templates by `LayoutChange.kind` × target tool. Two formats per template (short / detailed).

### Short format example (reorder, Claude Code)

```
In <NavBar> (src/components/NavBar.tsx:14), move <SignInButton> to be the last
item in the flex row instead of the second item. Don't change styles or behavior
beyond what's needed for the new order.
```

### Detailed format example (reorder, Claude Code)

```
Reorder a child within a flex container.

File: src/components/NavBar.tsx
Component: NavBar (line 14)
Container: <nav className="flex gap-6 items-center">

Move: <SignInButton /> (currently at index 1)
To: index 4 (last position, after <NotificationsBell />)

New sibling order:
  1. <Logo />
  2. <SearchInput />
  3. <NavLinks />
  4. <NotificationsBell />
  5. <SignInButton />

Constraints:
- Preserve all existing props and styles
- Preserve the gap-6 spacing
- Don't introduce new wrapper elements
- Don't modify any other components
```

### Format for a cross-container move

```
Move <CTAButton> from <Sidebar> (src/Sidebar.tsx:22) to <Hero> (src/Hero.tsx:8).
Place it as the last child of <Hero>'s inner content div (className="hero-content").
Hero is a flex column; the button should appear below the existing <Headline />
and <Subheadline />. Preserve all CTAButton props.
```

### Tool-specific variants

- **Claude Code:** include file paths, line numbers, full component context. Claude Code reads the codebase, so be specific.
- **Cursor:** similar but Cursor's context is the open editor — be more terse and assume it sees the file already.
- **Generic:** describe purely in component-tree terms; useful when source location isn't available.

### Templates as user-overridable

Ship templates as JSON files in the package. Allow a `weevar.config.js` in the user's project to override:

```js
export default {
  prompts: {
    reorder: {
      short: (change) => `...custom template...`
    }
  }
};
```

### Tailwind class awareness

When the source location plugin is installed and Tailwind is detected (presence of `tailwind.config.{js,ts}` or PostCSS config), do:
- In prompt context, list the parent's actual utility classes verbatim (don't paraphrase `flex gap-6` as "horizontal layout with medium spacing").
- This matters because the AI tool can match utility patterns directly.

## 11. Data Models (consolidated)

```ts
// Identity (covered in §5)
type ElementIdentity = { … };

// Layout context for an element
type LayoutContext = {
  parent: ElementIdentity;
  siblingIds: string[];
  ownIndex: number;
  layoutType: LayoutType;
};

// Captured change
type LayoutChange = { … };

// Pending DOM mutation
type PendingMutation = {
  id: string;
  appliedAt: number;
  apply: () => void;       // re-applies the mutation
  revert: () => void;      // restores original
  observer?: MutationObserver;
};

// Generated prompt
type GeneratedPrompt = {
  short: string;
  detailed: string;
  meta: {
    targetTool: 'claude-code' | 'cursor' | 'generic';
    timestamp: number;
    change: LayoutChange;
  };
};

// Overlay state
type OverlayState =
  | { kind: 'idle' }
  | { kind: 'active' }
  | { kind: 'hover'; element: ElementIdentity }
  | { kind: 'select'; element: ElementIdentity }
  | { kind: 'drag'; element: ElementIdentity; current: { parent, index } | null }
  | { kind: 'panel'; change: LayoutChange; prompt: GeneratedPrompt };
```

## 12. Performance

### Targets

- Idle (overlay off): zero measurable overhead on host app. No event listeners attached.
- Active (overlay on, no interaction): <1ms per frame.
- Hovering: <2ms per frame (one rAF-throttled hit-test + outline update).
- Dragging: <8ms per frame on a 1000-element page. (Frame budget is 16ms; we leave half for the host app.)
- Bundle size: <80KB gzipped for the dev runtime.

### Tactics

- **Lazy mount** the Shadow DOM and React island only on first activation.
- **No event listeners** attached when idle.
- **rAF-throttled** pointer events.
- **`elementFromPoint`** for hit testing, not full traversal — it's O(1) in the tree depth.
- **Avoid `getBoundingClientRect`** in hot paths — it forces layout. Cache and use `IntersectionObserver` where possible.
- **WeakMap for fiber-to-identity caches**, scoped per session.
- **Don't traverse the whole DOM at startup.** Identify elements on demand only.

### Bundle composition (estimate)

- React (peerDep): not bundled.
- Overlay UI: ~25KB
- Inspector engine: ~15KB
- CSS: ~3KB
- Misc: ~5KB
- Total: ~50KB gzipped target; 80KB hard cap.

## 13. Edge Cases

- **iframes**: V1 ignores cross-origin iframes (cannot inspect). Same-origin iframes: optionally bridge via postMessage, but defer to V2. For V1, show a hint when hovering over an iframe.
- **React Portals**: portals render to a different DOM location but the fiber tree is contiguous. Our fiber-based identity handles them correctly. DOM-path identity will fail — log and fall back to fiber.
- **Conditional rendering** during drag: cancel drag, show toast.
- **CSS animations**: paused via injected `* { animation-play-state: paused !important; }` during drag. Restored after.
- **Scroll containers**: use the nearest scrollable ancestor for auto-scroll, not always the document.
- **`position: fixed/sticky` elements**: still selectable. Drag mode shows a hint that flow-reordering may not produce expected results; prompt is generated as "move to a new fixed position relative to viewport" rather than reorder.
- **Server-rendered apps before hydration**: gate activation on hydration completion (probe for `__reactContainer$xxx` on a known root, with timeout).
- **Web Components / custom elements with shadow DOM**: V1 treats them as opaque (selectable as a whole, not their internals).
- **Components rendered into different React roots** (multi-root apps): each root gets its own fiber walker; identity scheme is root-aware.
- **`display: contents`**: parent has no box of its own; for layout purposes treat as transparent.

## 14. Security Considerations

- **Dev-only enforcement**: production exports are no-ops; bundle does not contain runtime code in production. Verify in CI by running a production build of the example app and grepping for runtime symbols.
- **No network calls.** The runtime makes zero network requests by default. (V2 may add opt-in telemetry.)
- **No remote code execution.** Templates are interpolated, not `eval`'d.
- **PII in prompts.** Visible page content can include user data (names, emails, etc.). Prompts include text snippets — show the user the prompt before they copy. Optionally provide a "redact text content" toggle that replaces user-rendered text with `[content]` placeholders in prompts.
- **Shadow DOM closed mode** prevents host code from inspecting our overlay state.
- **Clipboard write** uses the standard clipboard API and triggers a user gesture each time (no silent copying).
- **CSP**: the package must work in apps with strict Content Security Policy. Avoid inline styles where possible — use stylesheet construction inside Shadow DOM (which is exempt from page-level CSP for inline styles in shadow roots).

## 15. Extensibility

### Framework adapters

The Inspector Engine has a small `FrameworkAdapter` interface:

```ts
interface FrameworkAdapter {
  getElementIdentity(node: Element): ElementIdentity;
  resolveIdentity(identity: ElementIdentity): Element | null;
  getComponentName(node: Element): string | undefined;
  getSourceLocation(node: Element): SourceLocation | undefined;
}
```

V1 ships with `ReactAdapter`. V2 adds `VueAdapter` (uses `__vueParentComponent` on DOM nodes), `SvelteAdapter` (uses `__svelte_meta` if `dev` mode is on).

### Class system / styling adapters

```ts
interface StylingAdapter {
  describe(element: Element): { kind: 'tailwind'|'css-modules'|'styled'|'plain'; classes: string[]; tokens?: Record<string,string> };
}
```

V1: PlainAdapter (just classList) and TailwindAdapter (auto-detected, identifies utility classes).

### Prompt template overrides

Already covered in §10. Project-level config via `weevar.config.{js,ts}`.

### Inspector plugins (V2+)

Plugin API for inspecting non-layout properties:

```ts
interface InspectorPlugin {
  name: string;
  matchesElement?: (el: Element) => boolean;
  onSelect?: (el: Element, ctx) => void;
  toolbarActions?: ToolbarAction[];
}
```

---

# Implementation Plan

## Phased Roadmap

### Week 1 — MVP foundation

- Day 1–2: package scaffolding (TS, dual ESM/CJS via tsup, peerDeps for React 17/18/19), example app, dev/prod build conditions in `package.json` exports.
- Day 2–3: `<Weevar />` component, lazy Shadow DOM mount, toolbar UI shell, ⌘⇧E toggle.
- Day 3–4: hover detection, bounding box outline, throttled hit-testing.
- Day 4–5: click selection, selected state UI, action panel UI (no functionality yet).
- Day 5: idle state machine wiring.

**Exit criteria:** install package in example app, hit ⌘⇧E, hover any element to see outline + label, click to select, click elsewhere to deselect. No drag yet.

### Week 2 — MVP drag + prompt

- Day 1–2: drag handle UI, pointer-event-driven custom drag, ghost rendering, insertion bar UI.
- Day 2–3: drop target computation (same-parent reorder only), `order` CSS-based live preview during drag.
- Day 3–4: drop commit (DOM `insertBefore`), MutationObserver re-application, snapshot/restore.
- Day 4–5: layout diff capture, basic prompt generator (DOM-only identity, hard-coded templates), copy-to-clipboard.
- Day 5: discard flow, panel UI completion.

**Exit criteria:** end-to-end demo: install → activate → select a button → drag it to a new position in the same flex row → see live reflow → drop → see prompt → copy to clipboard. Prompt may be generic but readable.

### V1 — Weeks 3–6

- **Week 3:** Babel/Vite/SWC plugin for source location annotation. React Fiber integration. Component-name-aware identity and prompts.
- **Week 4:** Cross-container moves. Drop targets across the full page. Identity resolution after re-render testing.
- **Week 5:** Tailwind detection and class-aware prompts. Multiple prompt formats (Claude Code / Cursor / Generic). Project-level config file.
- **Week 6:** Edge case handling (portals, fixed positioning, hydration). Performance pass. Polish UX (animations, panel transitions, edge auto-scroll).

**Exit criteria:** ship to ~20 early users via private link. Collect copy-to-clipboard rate, AI execution success self-report.

### V2 — Months 2+

Driven by V1 metrics, but tentatively:

- Vue & Svelte adapters
- Style editing (spacing, typography from tokens)
- Resize/alignment operations
- Optional source-code mutation via codemod
- Capture sequences (multi-step)
- VS Code extension companion (skip clipboard)
- Telemetry (opt-in) for prompt quality measurement

## What can realistically be built in 1–2 weeks

The MVP scope above is deliberately tight. Two weeks gets you:

✅ Working overlay in dev mode
✅ Element selection with stable identity *for elements that don't re-render*
✅ Drag-and-drop within same parent
✅ Live visual reflow via CSS `order`
✅ Generated prompt good enough to paste into Claude Code

❌ NOT included in 2 weeks:
- Cross-container moves (week 3)
- Source location plugin (week 3)
- Tailwind awareness (week 5)
- Polished UX

This is honest. If the team is two engineers, week 1 can be done in 3 days; if solo, two weeks is realistic.

## Suggested Libraries / Tools

**Use:**
- `tsup` — bundle the package (fast, ESM/CJS dual output, TypeScript native)
- React 18 `createRoot` — for the overlay React tree inside Shadow DOM
- Native browser APIs: `MutationObserver`, `ResizeObserver`, `IntersectionObserver`, `setPointerCapture`
- `goober` (only if needed for dynamic styles) — 1KB CSS-in-JS

**Don't use:**
- `react-dnd` / `dnd-kit` — wrong fit; we're not building drag-drop *for our React tree*
- Native HTML5 drag-and-drop — bad UX
- `styled-components` / `emotion` — bundle bloat, not needed
- A state management library — `useReducer` + the explicit state machine in §4 is enough
- `react-router` — we don't have routes

**Tooling:**
- Vitest for unit tests
- Playwright for e2e against an example Next.js app
- Storybook (or a simple example site) for overlay-in-isolation development

## Hardest Technical Problems (ranked)

These are where the project will live or die. Allocate disproportionate engineering attention here.

1. **Stable element identity across React re-renders.** Without this, every interaction breaks the second the host app updates. The Fiber-based scheme is well-trodden territory but full of subtle edge cases (StrictMode, concurrent rendering, key prop changes). *Spend a full week getting this right with a comprehensive test suite, even though it lives in week 3.*

2. **Prompt quality.** This is a product/eng joint problem. The generated prompt has to actually drive correct AI behavior. Component name + source location + explicit constraints + Tailwind awareness are all necessary; less than that produces vague prompts. *Test prompts against Claude Code on real apps weekly.*

3. **Real-time DOM mutation without breaking React.** The hybrid CSS-`order` + DOM-mutation-with-MutationObserver scheme is the right approach but has pathological cases (heavy parent re-rendering, key prop changes mid-drag). *Document the failure modes honestly in the README.*

4. **Drag UX across diverse layouts.** Flex, grid, block, absolute, sticky, fixed, `display: contents`, transforms, scrollable containers — each behaves differently. The drag interaction must feel correct on a Tailwind dashboard, a Next.js marketing page, and a `position: absolute` slide deck app. *Maintain a "kitchen sink" example app that exercises every layout type, and run the full UX flow on it before any release.*

5. **Performance on large apps.** A real production app has 2000–10000 DOM nodes and active animations. Lazy tracking, rAF throttling, and avoiding forced layouts in hot paths are mandatory. *Benchmark on a real customer app (with permission) before V1 ship.*

6. **The Babel/Vite/SWC plugin trio.** Source location is a force multiplier for prompt quality. Three plugins for three ecosystems is real work. *Consider shipping just the Vite plugin in V1 (covers most modern apps including Next.js 14+), add others on demand.*

---

*End of TRD. See PRD.md for product spec and UX design guidance.*
