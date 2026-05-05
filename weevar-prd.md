# Product Requirements Document

**Product (working name):** Weevar
**Version:** v1 PRD, drafted for engineering handoff
**Status:** Pre-build; assumptions called out inline

---

## 1. Problem Statement

When designers and frontend engineers use AI coding tools (Claude Code, Cursor, Codex, etc.) to make UI changes, they have to translate something fundamentally **visual** into **prose**. The translation is lossy at every step:

- The user has a clear visual intent ("move this card under the hero, full-width on mobile")
- They write a prompt that approximates it
- The AI infers structure they didn't describe
- The result misses by 20-40% and they iterate via more prose

The lossy step is the prose. Browser DevTools lets you experiment visually, but the experiment is throwaway — the intent doesn't survive into a prompt. Design tools (Figma) capture intent but the intent is decoupled from the actual running code, components, and class names.

**The gap:** there is no tool that lets you manipulate the *running app's* live UI and turn that manipulation into a structured, code-aware prompt for an AI assistant.

## 2. Target Users

Three user segments, ranked by priority for V1:

1. **Frontend engineers using AI assistants for UI work** — primary. They already use Claude Code / Cursor and feel the friction of describing UI changes in prose. They have npm in their muscle memory.
2. **AI-first builders / "vibecoders"** — high-priority secondary. Building products primarily through AI assistants; weak on traditional CSS/layout intuition; benefit hugely from structured intent capture.
3. **Designers paired with engineers** — secondary. They can run a local dev server (or have one running on their machine) and want to communicate UI changes precisely without a Loom + paragraph.

**Explicit non-target for V1:** product managers without local dev environments, QA, end users.

## 3. Jobs to Be Done

- *When I want to change my app's UI, help me communicate the change to my AI coding assistant without writing prose that loses fidelity.*
- *When I'm exploring layout ideas, let me try them in the live app instantly and decide if I like them before committing.*
- *When I need to brief a teammate (or an AI) on a UI tweak, give me a way to show, not tell.*

## 4. User Stories

1. As an engineer, I install one npm package, add one component to my root layout, run my dev server, and have an overlay tool available — no config, no extension, no extra service.
2. As a user, I press a hotkey, hover over a button, see it outlined, click it, and see it selected with a small toolbar.
3. As a user, I drag the selected button to a new position in its parent container and watch the layout reflow in real time.
4. As a user, after I drop the element, I see a panel with a structured prompt describing the change. I copy it and paste it into Claude Code.
5. As a user, I refresh the page and the change is gone — the dev experience is non-destructive.
6. As a user with a Tailwind project, the generated prompt references the actual utility classes and component names from my codebase, not generic descriptions.
7. As a user, I can switch the prompt format between "short" and "detailed" depending on which AI tool I'm targeting.

## 5. UX Flow (step-by-step)

**Setup (one-time):**

1. `npm install --save-dev weevar`
2. Add `<Weevar />` to root layout (e.g. `app/layout.tsx`); the component renders nothing in production.
3. Optional: install Vite/Webpack/Next plugin for source location enrichment.

**Per-session usage:**

1. Run `npm run dev` as normal.
2. App loads; in the bottom-right corner a small dot indicator appears.
3. User presses **⌘⇧E** (or clicks the dot) to activate the overlay.
4. Cursor switches to a crosshair-like state; a thin toolbar slides in from the top.
5. User hovers over UI elements — each element under the cursor gets a 2px outline and a label tag showing its tag/component name.
6. User clicks an element. It becomes "selected": stronger outline, four corner markers, floating action panel above showing parent context and a drag handle.
7. User grabs the drag handle. As they drag:
   - The original element renders as a 30% opacity ghost in place
   - A miniature preview follows the cursor
   - Valid drop zones (sibling positions, other compatible containers) are highlighted with dashed outlines
   - Insertion bars appear between siblings to show where the element will land
   - Layout reflows in real time as they hover over different drop positions
8. User drops the element.
9. A 380px panel slides in from the right side:
   - Header: "Reorder within `<Header>`" or "Move from `<Sidebar>` → `<Main>`"
   - Before/after diagram (bounding boxes only, schematic)
   - Structured prompt in a scrollable code block
   - Tabs: **Short** | **Detailed**
   - Target tool selector: **Claude Code** | **Cursor** | **Generic**
   - Buttons: **Copy** | **Regenerate** | **Discard**
10. User clicks Copy, switches to terminal, pastes into Claude Code.
11. User refreshes the browser — all changes reset.

**Cancellation paths:**

- **Esc** at any point cancels the current operation.
- "Discard" in the panel reverts the DOM mutation.
- Page refresh resets all state.

## 6. Feature Prioritization

### MVP (1–2 weeks, target: usable internally)

- npm package, single-component install
- Dev-only mount (no-op in production)
- Toggle keybind + floating activator
- Element hover highlighting (DOM-based)
- Click-to-select with visual outline
- Drag-and-drop within the same flex/block container (reorder only)
- Real-time DOM reorder during drag (with the React-reconciliation caveat documented in TRD)
- Layout diff capture for reorder operations
- Template-based prompt generation using DOM info (tag, classes, text snippet, hierarchy path)
- Copy to clipboard

### V1 (weeks 3–6, target: shippable to early users)

- Cross-container moves (e.g. element from sidebar to main)
- React Fiber integration for stable element identity across re-renders
- Source location annotation via Babel/Vite/Next plugin (file:line:col in prompts)
- Component name in prompts ("Move `<NavItem>` …" instead of "Move `<a class='…'>` …")
- Tailwind-class awareness — recognize utility classes and reference them precisely
- Prompt template variants per target tool (Claude Code, Cursor, Generic)
- Multi-element selection (limited: same-parent siblings)
- Persist activation state across in-app navigation

### V2 (later)

- Style edits (spacing, typography scale, color from tokens)
- Resize/alignment operations
- Vue and Svelte adapters
- Optional source-code mutation (codemod, behind explicit opt-in flag)
- Capture sequences (multi-step changes in one prompt)
- VS Code companion: paste prompt directly into editor without clipboard
- Team prompt sharing (export/import capture as JSON)

## 7. Non-Goals (V1)

These are out of scope and we will say no to them:

- **Persistent source code modification.** V1 is preview + intent capture. Mutation comes V2 with explicit safeguards.
- **Production runtime.** This is a dev tool. It must be impossible to ship to production.
- **Style editing.** Layout reordering only. No color picker, no typography panel.
- **Visual regression testing.** Different problem.
- **Design system / component library editing.** We don't touch the source of truth.
- **Browser extension.** Embedded only.
- **General-purpose page builder.** We're not building Webflow.
- **Cross-browser support.** V1 targets Chromium-based browsers. Firefox/Safari best-effort.

## 8. Success Metrics

Ranked by what matters most:

1. **Prompt acceptance rate** — of generated prompts, what % does the user copy? If they don't copy, the prompt is too vague or too verbose. *Target: >70% by V1.*
2. **AI execution success** — of copied prompts pasted into Claude Code/Cursor, what % produce code the user accepts? Measured via post-action survey or instrumented if possible. *Target: >60% by V1.*
3. **Activation rate** — of npm installs, what % open the overlay 3+ times in week 1? *Target: 40%.*
4. **Engagement** — prompts generated per active user per week. *Target: 5+.*
5. **Performance overhead** — measured on a representative React app, dev server time-to-interactive overhead. *Hard cap: <8%.*
6. **Stability** — sessions where the overlay breaks the host app. *Hard cap: <0.5% of activated sessions.*

## 9. Risks and Unknowns

### Product risks

- **Prompt quality is the whole product.** If the AI tool can't act on the prompt, nothing else matters. The risk is that DOM-derived prompts lack semantic context (component names, intent). Mitigation: invest in source location + Fiber integration earlier than planned if MVP prompts feel too generic in dogfooding.
- **Users may prefer existing tools.** Cursor has its own "compose" mode. Browser DevTools is free and familiar. Differentiation must be the *combination* of (a) live manipulation in the actual app, not a sandbox, and (b) prompt output, not arbitrary code edits.
- **Drag-drop UX is genre-defining.** If it feels janky on common layouts (a Tailwind dashboard, a Next.js marketing site), users will bounce immediately. UX polish is not optional.

### Technical risks

- **React reconciliation will fight us.** Mutating the DOM directly works until React re-renders the parent. Mitigation strategies in TRD; some use cases may simply not work and we should be honest about it.
- **Stable element identity across re-renders is the linchpin.** If we lose track of which element the user selected, every interaction breaks. The Fiber-based identity scheme has to work or V1 is unshippable.
- **Performance on large apps.** A dashboard with 5,000 DOM nodes and active animations is a different beast than a marketing page. We must lazy-track and only inspect on demand.

### Unknowns / assumptions to validate

- **Assumption:** Users want short prompts more than detailed ones. *Validate by* offering both and tracking which gets copied more.
- **Assumption:** Targeting Claude Code first is correct because of overlap with Anthropic-aware audience. *Validate by* checking which AI tool early users actually paste into.
- **Assumption:** Tailwind awareness is high-leverage. *Validate by* segmenting early users; if Tailwind is dominant, ship that integration in V1.
- **Unknown:** How well does this work with shadcn/ui, Radix, Headless UI, and other component libraries that wrap children in portals? Need a spike in Week 2.

---

# Appendix: UX & Interaction Design Guidance

This is the felt-experience spec. The PRD says *what*; this says *how it should feel*.

## A.1 Overall feel

Three adjectives, in priority order: **invisible, snappy, forgiving.**

- **Invisible when off.** Zero visual footprint other than an 8px floating dot in the corner. No badges, no toasts, no announcements.
- **Snappy when on.** Every interaction must respond inside one frame (16ms). No animation longer than 150ms. Hover feedback is instant. The user should feel like they're touching the UI directly, not steering a remote.
- **Forgiving.** Esc cancels anything. Refresh resets everything. No interaction can break the host app or lose the user's session.

The mental model is "DevTools inspect mode, but for layout, with a prompt at the end." Not "Figma in your browser" — Figma's interaction model is too heavyweight for this context.

## A.2 Activation & toolbar

- **Off state:** 8px circular dot in the bottom-right corner. Subtle. Hover reveals "Press ⌘⇧E to activate" tooltip after 800ms.
- **On state:** Top-center floating toolbar, 36px tall, rounded, dark glass background. Contains:
  - Pointer tool (default selected)
  - Status text ("Hover an element" / "Selected: `<Header>`" / "Dragging…")
  - Settings dropdown (target tool, prompt format default)
  - Close button
- Toolbar uses translucent background (`backdrop-filter: blur(12px)`) so it doesn't dominate the page.

## A.3 Hover state

- 2px outline, color `#0099FF`, opacity 0.6
- 0.05 opacity tinted fill
- Floating label in the top-left corner of the hovered element:
  - DOM-only mode: `div.flex.gap-4`
  - Component-aware mode: `<NavItem>` (when Fiber integration is on)
- Label is 11px, monospace, dark background, rounded 4px
- Updates throttled to requestAnimationFrame; no flicker

## A.4 Selected state

- Solid 2px outline at full saturation `#0099FF`
- Four small corner markers (4×4 squares) in matching color — visual only in V1, not interactive
- **Drag handle**: 16×16 dot-grid icon in the top-left, slightly outside the bounding box. This is the *only* place from which a drag begins. Clicking the element body does not start a drag — it just maintains selection. This prevents accidental drags during exploration.
- **Floating action panel** anchored above the selection (or below if no room above), 240px wide:
  - Path: `Body > Header > NavItem` (clickable parent links)
  - Layout type pill: `flex-row` / `grid-3col` / `block`
  - Action: "Move…" button (alternative entry to drag mode for keyboard users — V2)

## A.5 Drag state

The drag interaction is the core of the product and deserves disproportionate attention:

- **Original element**: stays in place at 30% opacity (a "ghost"). This is critical — users need to see the source position to understand the change.
- **Cursor preview**: a small (max 200×120) translucent thumbnail of the element follows the cursor, offset 12px down-right. If the element is large, scale down; if small, render at actual size.
- **Drop zones**:
  - All valid parent containers gain a 1px dashed outline in `#0099FF` at 0.4 opacity
  - The currently-targeted parent gains a 0.05 opacity tint
- **Insertion indicator**: between siblings, a 3px solid `#0099FF` bar appears at the exact insertion point. For flex-row, it's vertical; flex-column, horizontal; grid, follows the grid axis. Animated subtle pulse (400ms cycle) so it reads as active.
- **Auto-scroll**: when the cursor is within 60px of a viewport edge during drag, page scrolls at a speed proportional to proximity.
- **Cancel**: Esc at any point reverts to pre-drag state.
- **Reflow during drag**: as the user moves between drop targets, the host UI reflows in real time so the user can preview the result. (This is the hard technical part — see TRD.)

## A.6 Diff & prompt panel

After a successful drop, slide in from the right edge, 380px wide, full height minus toolbar.

Sections, top to bottom:

1. **Header**: change description in plain language: "Reorder `<NavItem>` within `<Header>`" or "Move `<CTA>` from `<Sidebar>` to `<Main>`". 14px medium weight.
2. **Before/After schematic**: a small (full-width × 80px) diagram showing two boxes with the element's position highlighted. Schematic, not a screenshot.
3. **Tabs**: **Short** | **Detailed**.
4. **Prompt body**: monospace, 12px, dark code-block style, scrollable. Selectable. Max ~12 lines visible.
5. **Target tool selector**: dropdown with `Claude Code`, `Cursor`, `Generic`. Changes the prompt format live.
6. **Action row**: `Copy` (primary), `Regenerate`, `Discard change`.

The Copy button's success state matters: brief 1-second checkmark, no toast, no overlay. Get out of the way.

## A.7 Visual design

- Color palette: neutral dark UI (`#0F1115` background, `#1A1D24` panels, `#2A2E38` borders), accent `#0099FF`, success `#00C896`, danger `#FF4D4F`.
- Typography: 13px UI text (system font stack), 11px labels, 12px monospace for code.
- Corners: 6px on panels, 4px on small elements, 999px (pill) on tags.
- Shadows: subtle, single layer (`0 4px 16px rgba(0,0,0,0.3)`).
- No skeuomorphism, no gradients other than slight backdrop blur.
- Iconography: 14×14 stroke icons, 1.5px stroke weight (Lucide or hand-rolled).

## A.8 What this should NOT feel like

- Not a website. The chrome should look like an editor, not a marketing page.
- Not a game. No celebratory animations, no confetti, no easter eggs in V1.
- Not a wizard. No multi-step flows, no "are you sure?" modals. Direct manipulation.
- Not a Figma plugin. Don't import Figma's mental model wholesale; this is closer to DevTools.

## A.9 Edge cases the UX must handle gracefully

- **Element disappears mid-drag** (conditional rendering): cancel drag, show toast "Element no longer exists in the layout".
- **Drop on invalid target**: snap back, no error state.
- **Selection on element that re-renders during selection**: try to re-locate via Fiber identity; if that fails, clear selection silently.
- **Selection on `position: fixed` or `sticky` element**: still selectable, but drag mode is restricted to "absolute reposition" only, not flow-based reorder. Show a hint: "Fixed-position element — moves freely."
- **Tiny elements (<24px)**: outline still visible (drawn outside the box), label appears nearby instead of inside.
- **Overflowing elements**: the bounding box used for hit-testing matches the actual rendered bounds, including overflow.

---

*End of PRD. See TRD.md for technical specification and implementation plan.*
