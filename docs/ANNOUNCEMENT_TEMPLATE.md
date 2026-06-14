# Weevar v2.0.0 Announcement Template

Customize bracketed fields before publishing.

---

## Headline

**Weevar v2.0.0 — layout moves + live style editing, with smarter AI prompts**

---

## TL;DR

- Dev-only React overlay: **drag to rearrange** and **edit styles** in the browser
- One session, one prompt — layout moves and CSS tweaks batched for AI assistants
- DOM-first prompt refs and container subtree instructions so agents apply moves correctly
- Production-safe no-op runtime; Vite plugin for file:line accuracy

---

## What's new in v2.0.0

### Style editing (V2)

- **Edit tray** when you select any element — typography, box model, borders, radius, opacity, flex/grid layout
- **W/H sizing:** Fixed px, **Fill container**, or **Hug content**
- **Custom tray dropdowns** — card-style controls, scroll-safe menus
- **Alt + hover** spacing measure between elements

### Smarter prompts

- Refs like `<figure.gallery-cell>` instead of generic component names
- Container moves show `(N element children)` and **move full subtree** instructions
- Style prompts: `` `border-radius` 14px → 32px `` with optional Tailwind suggestions
- Mixed sessions: `11 changes (9 style updates, 2 layout moves)` with ordered steps

### Session UX

- Overview shows **Total edits** (layout + style)
- Prompt empty state: **No edits made yet**
- Undo / redo for style and layout

---

## Upgrade

```bash
npm install weevar@2.0.0
```

Rebuild your dev server. Tray footer should show **v2.0.0**.

---

## Getting started

```bash
npm install weevar
```

```tsx
import { Weevar } from "weevar/react";

<>
  <App />
  <Weevar />
</>
```

```ts
// vite.config.ts
import { weevar } from "weevar/vite";
plugins: [weevar(), react()];
```

Press **⌘⇧E** (Mac) or **Ctrl+Shift+E** (Windows/Linux).

---

## Docs

- [README](https://github.com/Pro-Gee/Weevar/blob/main/README.md)
- [Install](https://github.com/Pro-Gee/Weevar/blob/main/docs/INSTALL.md)
- [Usage](https://github.com/Pro-Gee/Weevar/blob/main/docs/USAGE.md)
- [Changelog](https://github.com/Pro-Gee/Weevar/blob/main/CHANGELOG.md)
- [weevar.com](https://weevar.com)

---

## Known limits

- Development only; prompts do not auto-write code
- Chromium-first browser validation
- Style preview on DOM — map prompts back to your CSS/Tailwind system

---

## Feedback

Issues and repro steps: [github.com/Pro-Gee/Weevar/issues](https://github.com/Pro-Gee/Weevar/issues)

---

## Social snippets (optional)

**Twitter / X (280 chars):**

> Weevar v2 is out — rearrange layout AND edit styles in your React app, then copy one prompt for your AI editor. Smarter container moves, edit tray, Fill/Hug sizing. Dev-only, MIT. npm install weevar@2.0.0

**LinkedIn (short):**

> Weevar v2.0 adds live style editing alongside layout moves, with batched prompts designed for Cursor, Claude Code, and Codex. Try it in your Vite React app: npm install weevar@2.0.0
