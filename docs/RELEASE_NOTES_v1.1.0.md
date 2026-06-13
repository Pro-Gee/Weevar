# Release Notes — weevar v1.1.0

**Release date:** 2026-05-22  
**npm:** `weevar@1.1.0`  
**Codename:** V2 (layout + style editing)

Full changelog: [CHANGELOG.md](../CHANGELOG.md#110---2026-05-22)

---

## Summary

Weevar v1.1.0 is a major feature release. You can now **edit CSS visually** in the same session as **layout moves**, then copy a **single batched prompt** for your AI coding tool. Prompt generation was overhauled so container moves (e.g. carousels, scroll regions) produce instructions agents can follow without splitting subtrees.

---

## Highlights

### 1. Edit tray and style commits

Select any element in pointer mode (**W**) to open the edit tray:

- Typography, colours, box model, borders, radius, opacity
- Flex/grid layout controls for container elements
- Image object-fit and SVG dimensions
- **Fill / Hug / Fixed** width and height sizing
- Raw CSS property panel per element category

Changes preview on the live DOM and record as **`StyleTweak`** entries in the session.

### 2. Layout moves (enhanced)

Drag-to-reorder and cross-container moves work as in v1.0, with improved prompts:

- DOM-first refs: `<div.carousel-scroll>` not `<App "caption text…">`
- Child count labels: `(4 element children)`
- Explicit subtree instructions for container moves

### 3. Unified session and prompts

- **EditSession** tracks layout + style (`WeevarChange` union)
- Style commits on the same element merge per property
- Batched headers: `N changes (X style updates, Y layout moves)`
- Short and Detailed prompt modes; Claude Code / Codex / Generic targets
- Optional Tailwind utility suggestions in detailed style tables

### 4. Overlay UX

- Overview: **Total edits** count
- Prompt empty state: **No edits made yet**
- Alt-key spacing measure overlay
- Custom tray dropdowns (selection, dismiss, scroll fixes)
- Version label in tray footer from `package.json` at build time

---

## Breaking changes

**None** for typical `<Weevar />` + `weevar/vite` integrations.

### TypeScript consumers

- `generatePrompt` accepts **`WeevarChange`** (not only `LayoutChange`)
- Prefer **`EditSession`** over deprecated **`MoveSession`** alias

### Prompt format

Short move/style lines are **more explicit** (longer). Agents tuned on v1.0.x prose may need no code changes — expect richer refs and subtree notes.

---

## Upgrade steps

```bash
npm install weevar@1.1.0
```

1. Restart dev server
2. Confirm tray footer shows **v1.1.0**
3. Keep `weevar()` in Vite plugins for best `{src:file:line}` anchors
4. Review [Usage guide](./USAGE.md) for new shortcuts (**W** pointer, **O** overview)

---

## Verification

| Check | Command / action |
|-------|------------------|
| Unit tests | `npm run test -w weevar` (115 tests) |
| E2E | `npm run test:e2e` (5 specs) |
| Pack | `npm pack -w weevar --dry-run` |

---

## Files in npm tarball

- `dist/**` (CJS, ESM, TypeScript declarations)
- `README.md`
- `LICENSE`
- `package.json`

Playground and repo docs are **not** published to npm; see GitHub for full documentation.

---

## Contributors & license

MIT © 2026 Gideon Adeyemi

Issue tracker: [github.com/Pro-Gee/Weevar/issues](https://github.com/Pro-Gee/Weevar/issues)
