# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.2.0] - 2026-05-22

Documentation and polish release following **Weevar V2 (1.1.0)**.

### Changed

- **Documentation:** Rewrote `README.md`, `packages/weevar/README.md`, and all guides under `docs/` for V2 — layout + style editing, edit tray, prompts, shortcuts, configuration, troubleshooting, compatibility, security, release gates, and smoke matrix.
- **Prompt empty state:** Updated copy from “No element moved yet” to **“No edits made yet”** to match the Overview **Total edits** label and V2 session model (layout + style).

### Added

- **`docs/RELEASE_NOTES_v1.2.0.md`** — release notes for this documentation pass.

## [1.1.0] - 2026-05-22

Major feature release: **Weevar V2** adds live style editing alongside layout moves, a redesigned edit tray, and significantly more reliable prompt output for AI-assisted code changes.

### Added — Style editing (V2)

- **Edit tray** (`EditTray`): select any element in pointer mode and edit styles in a docked tray without leaving the page. Changes are previewed live on the DOM and committed into the session as structured `StyleTweak` records.
- **Element classification** (`classifyElement`): elements are categorized as `text`, `svg`, `image`, `stack`, or `generic`, which determines which controls appear in the tray.
- **Style engine** (`styleEngine.ts`): reads and applies computed CSS values, normalizes colors (including alpha), parses font weights, handles SVG dimensions, border/radius/box reads, and skips no-op commits via `areStyleCommitValuesEquivalent`.
- **Category-specific controls:**
  - **Text:** font size, weight, family, line height, letter spacing, text alignment, font colour
  - **Box (all categories):** width/height with **Fixed / Fill container / Hug content** sizing modes, padding, margin, border style/weight/colour (including per-side border weights), corner radius (uniform or per-corner), opacity
  - **Image:** `object-fit`, width, height
  - **SVG:** width, height, fill, stroke
  - **Stack (flex/grid containers):** layout type (block / flex / grid), flex direction, gap, grid columns, main/cross axis alignment (`justify-content`, `align-items`), plus stack-appropriate box and colour controls
  - **Generic:** colour, background, display, width, height
- **Raw CSS panel:** expandable per-category list of underlying CSS properties for direct value inspection and commits.
- **Colour picker** (`ColorPicker`): hex + alpha slider, transparent handling, integration with border and font colour fields.
- **Spacing measure overlay** (`SpacingMeasureOverlay`): hold **Alt** while an element is selected and hover another element to visualize gap/spacing between them.
- **Style tweak prompts:** `generatePrompt` now handles `StyleTweak` changes — short prompts list `property before → after` values; detailed prompts include a property table, element category, optional Tailwind utility suggestions (when `config.prompts.tailwindVerbatimClasses` is enabled), and an effective-border summary when border properties were edited.
- **Border summary in prompts:** when border style/weight/colour commits produce a visible border, prompts include a concise `Effective border: type …, weight …, colour …` line.

### Added — Session & prompt model (V2)

- **`WeevarChange` union:** sessions now track layout moves/reorders **and** style tweaks in one list.
- **`EditSession`:** canonical V2 session type (replaces the V1-only move session concept). `MoveSession` remains as a deprecated alias for backward compatibility.
- **`StylePropertyChange` / `StyleTweak` types** in `layoutTypes.ts` for structured style commit data.
- **`childElementCount` on `ElementIdentity`:** captured at identity build time for container disambiguation in prompts.
- **`elementText.ts`:** shared helpers for text-like tag detection and direct-text extraction (excluding nested element text).
- **Style tweak merging:** multiple commits on the same element in one session collapse into a single `StyleTweak` (earliest `fromValue`, latest `toValue` per property).
- **Mixed batched prompts:** `generateBatchedPrompt` labels sessions accurately (e.g. `11 changes (9 style updates, 2 layout moves)`) and applies order-relative index notes when layout steps are present.

### Added — Edit tray UI components

- **`TrayDropdown` / `TrayDropdownMenu`:** custom full-width dropdowns replacing native `<select>` overlays in the tray — card-style triggers, inline absolute menus (scroll with the tray), toggle-on-trigger-click dismiss, subtle item hover states, and correct `menuRef` wiring for selection.
- **Control library:** `AlignmentControl`, `BorderControl`, `BoxControl`, `CardSelectControl`, `ColorPicker`, `DimensionControl`, `LayoutColumnsControl`, `LayoutGapControl`, `LayoutTypeControl`, `NumberInput`, `OpacityControl`, `RadiusControl`, `SegmentedControl`, `SelectControl`, `WeightSelect`, plus icon sets for alignment, box spacing, layout gap/type, and typography.
- **`dimensionSizing.ts`:** Fill (`100%`) / Hug (`auto`) / Fixed px modes for width and height; W/H label buttons open sizing menus from the dimension row.
- **Tray footer version label** now reflects `1.1.0` after build (injected via `tsup` from `package.json`).

### Changed — Prompt reliability (layout moves)

Prompt output was overhauled so agents can apply multi-step layout changes without misinterpreting container moves as text/content moves.

- **DOM-first element refs:** when an element has CSS classes, prompts use `<tag.class1.class2>` (e.g. `<div.carousel-scroll>`, `<figure.gallery-cell>`) instead of the React component name alone (`<App>`).
- **Container child counts:** elements with children are labeled `(N element children)` — e.g. `<div.carousel-scroll> (4 element children)` — so it is clear the move target is a container, not its text content.
- **Text snippets only on text-like tags:** `textSnippet` in identity capture uses **direct text node content** on text-like tags (`p`, `h1`, `button`, etc.), not merged descendant text. Fixes cases where a carousel strip was labeled `"Venice, worn varnish.Wool, har"` instead of being identified as a scroll container.
- **Subtree move instructions (short prompts):** container moves append: *Move the entire element subtree (N element children); do not split or recreate nested nodes.*
- **Subtree section (detailed move prompts):** adds an explicit **Subtree** block and constraint: *child index refers to the container element, not its text content*.
- **Batched global constraint:** multi-step prompts include *When a move lists element children on the target, cut and paste the full subtree unchanged*.
- **Style short prompts:** prefer tag+class refs when classes exist (e.g. `Update styles on <button.pill> …` instead of `<App>`).
- **Move preserve wording:** updated to *Preserve all props and nested structure unchanged*.

### Changed — Overlay UX

- Overview stat label renamed from **Total moved** to **Total edits** (counts layout moves and style tweaks).
- Edit tray focus handling: blurring tray inputs when clicking back on the page so pending values commit before pointer selection changes (`blurWeevarOverlayFocusIfPointerOutside` in `hitTest.ts`).
- Extensive **overlay stylesheet** expansion (~1,900 new lines) for the V2 tray, dropdowns, controls, spacing measure, and refined dock/tray layout.
- Prompt panel and shadow app updated to route style commits through `onStyleCommit`, revert preview on undo, and merge batched changes correctly across kinds.

### Fixed

- **Tray dropdown selection:** options now update the bound value reliably (`menuRef` passed directly to dismiss hook, not as an array).
- **Tray dropdown visibility:** menus render inline below triggers (not portaled with `position: fixed`), fixing invisibility inside the transformed tray layer.
- **Tray dropdown scroll:** menus move with the tray when scrolling.
- **Drag/session edge cases:** fixes for erratic drag behaviour during overlay interaction (pointer capture, preview cleanup).
- **Grid + flex-direction prompt noise:** style short prompts omit `flex-direction` when `display` is committed to `grid`.
- **Style revert on undo:** committed style tweaks revert live DOM preview to pre-commit values when undone from the session.

### Tests

- **115 unit tests** passing, including new/expanded coverage for:
  - `styleEngine` (color normalization, border reads, classification, SVG dimensions)
  - `generatePrompt` / `generateBatchedPrompt` (style tweaks, DOM-first refs, container move regression, Tailwind column)
  - `EditTray.weight` (custom weight dropdown interaction)
  - `DimensionControl`, `arrangementMapping`, `roundNumber`
- **5 Playwright e2e tests** passing (trigger presence, reload stability, keyboard shortcut, documentation link, stale host reclaim).

### Repository-only (not in npm tarball)

The monorepo `examples/playground` was updated in parallel for V2 dogfooding and demo deployment. These changes are **not** published with the `weevar` package:

- Desktop-only gate below 1024px viewport (Weevar not mounted on mobile/narrow windows)
- Playground shell, light-mode default for public demo builds, Open Graph / favicon metadata
- Removed public demo alert banner; desktop-only note layout tweaks

---

### Migration notes (1.0.x → 1.1.0)

- **No breaking API changes** for existing integrations: `import { Weevar } from "weevar/react"` and `weevar/vite` usage remain the same.
- **`MoveSession` is deprecated** in favour of `EditSession`; the alias remains so existing TypeScript imports compile.
- **`generatePrompt` now accepts `WeevarChange`** (layout or style). Callers passing only `LayoutChange` should update types if they import them directly.
- **Prompt text format has changed** (richer refs, subtree notes). Agents tuned on 1.0.x short prompts may need no code changes — expect longer, more explicit move instructions.
- **Recommended:** use the Vite plugin (`weevar/vite`) for `{src:file:line}` anchors in prompts; without it, `{src:source:unknown}` fallbacks still work but are less precise.

### Upgrade

```bash
npm install weevar@1.1.0
```

Rebuild your dev server after upgrading so the overlay bundle picks up the new tray and prompt logic.

## [1.0.2] - 2026-05-07

### Changed

- Expanded npm/readme product narrative, requirements, and workflow description.
- Point GitHub documentation links and `repository` / `bugs` URLs at the real repo (`Pro-Gee/Weevar`).

## [1.0.1] - 2026-05-06

### Added

- Tray footer version label derived from `packages/weevar/package.json` at build time (`tsup` / Vitest); playground dev injects the same via Vite `define`.
- MIT `LICENSE` at repo root and under `packages/weevar` so the registry tarball includes license text.

### Fixed

- Ship `packages/weevar/README.md` in the npm tarball so the npm package page shows install and usage documentation.
- Playground E2E expectations aligned with current playground UI and documentation button behavior.

## [1.0.0] - 2026-05-06

### Added
- Public launch documentation set:
  - `README.md`
  - `docs/INSTALL.md`
  - `docs/USAGE.md`
  - `docs/TROUBLESHOOTING.md`
  - `docs/COMPATIBILITY.md`
  - `docs/SECURITY.md`
  - `docs/RELEASE.md`
  - `docs/LAUNCH_GATES.md`
  - `docs/SMOKE_MATRIX.md`
  - `docs/ANNOUNCEMENT_TEMPLATE.md`
- Release checklist and release-note draft:
  - `CHANGELOG.md`
  - `docs/RELEASE_NOTES_v1.0.0.md`
- Package/release scripts for verification and dry-run checks.
- E2E coverage for:
  - documentation-link popup behavior
  - stale Weevar-owned host reclaim behavior

### Changed
- Overlay host ownership/HMR lifecycle handling to reduce stale overlay instances.
- Prompt/session and overview UX refinements from pre-launch stabilization.
- Trigger badge count aligned with Overview `Total moved` unique-element count.

### Fixed
- Dev lifecycle issues causing stale overlay instances during hot reload.
