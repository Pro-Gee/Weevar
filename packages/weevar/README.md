# Weevar

A dev-only overlay for React apps that lets you **rearrange layout** and **edit styles** in the browser—then turns those changes into structured prompts for AI coding assistants.

Weevar runs locally while your dev server is active. Nothing ships to production until you apply the generated prompts to your source code.

**Current version:** see the tray footer (`v1.2.0` at time of this release).

---

## What Weevar does

| Capability | Description |
|------------|-------------|
| **Layout moves** | Drag elements to reorder within a container or move them across sections. Live DOM preview with flex-order hints. |
| **Style edits** | Select an element and adjust typography, box model, borders, radius, opacity, layout (flex/grid), and more in the edit tray. |
| **Prompt generation** | Copy a short or detailed prompt describing every edit in your session—layout and style combined. |
| **Session controls** | Undo, redo, and clear edits; batched prompts preserve order and relative indices. |

Runtime changes are **preview-only**. Refreshing the page restores your source-defined UI. Prompts are how edits become permanent in code.

---

## Quick start

### 1. Install

```bash
npm install weevar
```

### 2. Mount the overlay

```tsx
import { Weevar } from "weevar/react";

export function Root() {
  return (
    <>
      <App />
      <Weevar />
    </>
  );
}
```

### 3. Add the Vite plugin (recommended)

The plugin injects `data-wv-source` attributes so prompts include accurate file and line anchors.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { weevar } from "weevar/vite";

export default defineConfig({
  plugins: [weevar(), react()],
});
```

### 4. Run dev and toggle Weevar

```bash
npm run dev
```

Press **⌘⇧E** (Mac) or **Ctrl+Shift+E** (Windows/Linux), or click the dock trigger.

---

## Requirements

- **Node.js** `>= 18.18`
- **React** and **React DOM** `>= 17`
- **Development mode** — a dev server (Vite, Next dev, etc.), not a production build
- **Bundler integration** recommended for best prompt accuracy (`weevar/vite`, or `weevar/swc` / `weevar/webpack-loader`)

See [Install guide](https://github.com/Pro-Gee/Weevar/blob/main/docs/INSTALL.md) for Next.js, Webpack, and config file options.

---

## Workflow

1. **Toggle Weevar** on your running dev app.
2. **Overview (`O`)** — see session stats and open documentation.
3. **Pointer / edit mode (`W`)** — click an element on the page:
   - **Drag** the selection handle to reorder or move layout.
   - **Edit tray** — adjust styles; commits are recorded in the session.
4. **Hold Alt** (with an element selected) and hover another element to **measure spacing** between them.
5. **Prompt (`P`)** — generate and copy the batched prompt for your AI tool.
6. **Paste** the prompt into Cursor, Claude Code, Codex, or another assistant to update source files.

---

## Layout editing

- **Reorder** — drag within the same flex/grid/block parent; drop zones show insertion index.
- **Cross-container move** — drag into another valid layout parent; prompts include source/destination parents and child indices.
- **Container moves** — moving a parent (e.g. a `.carousel-scroll` wrapper) generates prompts that instruct agents to move the **full subtree**, not individual text nodes inside it.

Prompts use **DOM-first refs** when classes exist (e.g. `<div.carousel-scroll> (4 element children)`) plus `{src:…; dom:…; h:…}` anchor blocks for deterministic edits.

---

## Style editing

When you select an element in pointer mode, the **edit tray** opens with controls matched to element type:

| Category | Typical elements | Controls |
|----------|------------------|----------|
| **text** | `p`, `h1`–`h6`, `span`, `button`, … | Font size, weight, alignment, colour, line height, letter spacing |
| **image** | `img` | Object fit, width, height |
| **svg** | `svg` and descendants | Width, height, fill, stroke |
| **stack** | Flex/grid containers, multi-child wrappers | Layout type, direction, gap, grid columns, alignment, plus box/colour controls |
| **generic** | Everything else | Colour, background, display, width, height |

**Box controls** include padding, margin, border (style, weight, colour, per-side weights), corner radius (uniform or per-corner), opacity, and **W/H sizing** with **Fixed**, **Fill container** (`100%`), or **Hug content** (`auto`).

Style commits merge on the same element within a session. Prompts list each CSS property as `` `property` before → after ``.

---

## Prompts

### Short vs detailed

Configure in **Settings → Prompt Style**:

- **Short** — compact numbered steps; ideal for chat paste.
- **Detailed** — Markdown sections, property tables for styles, constraints, optional Tailwind suggestions.

### Target tool

**Settings → Target Tool** tailors output for **Claude Code**, **Codex**, or **Generic** assistants.

### Batched sessions

Multiple layout moves and style tweaks produce one ordered prompt. Headers look like:

`11 changes (9 style updates, 2 layout moves) (apply in order; …)`

Each step’s indices are relative to the state **after prior steps** are applied.

### Tailwind

If the Vite plugin detects Tailwind in your project, detailed style prompts can include a **Tailwind suggestion** column. Override via `weevar.config.json` — see [Usage](https://github.com/Pro-Gee/Weevar/blob/main/docs/USAGE.md).

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **⌘⇧E** / **Ctrl+Shift+E** | Toggle Weevar overlay |
| **O** | Overview tray |
| **W** | Pointer / edit mode |
| **P** | Generate prompt |
| **U** | Undo last edit |
| **R** | Redo |
| **D** | Clear session |
| **Alt** (held) | Spacing measure between selected and hovered elements |
| **Esc** | Cancel drag / dismiss overlays |

Shortcuts are ignored while focus is in an input or textarea (edit tray fields).

Custom toggle keybind:

```tsx
<Weevar keybind={{ key: "e", meta: true, shift: true }} />
```

---

## Package exports

| Import | Purpose |
|--------|---------|
| `weevar/react` | `<Weevar />` overlay (dev entry; production resolves to no-op) |
| `weevar/vite` | Vite plugin — source injection + `virtual:weevar-config` |
| `weevar/swc` | SWC integration |
| `weevar/webpack-loader` | Webpack loader |

---

## Production safety

The published **`weevar/react`** production export is a **no-op** — the overlay does not mount in production builds. Always verify your production bundle as part of release checks.

---

## Documentation

- [Install](https://github.com/Pro-Gee/Weevar/blob/main/docs/INSTALL.md)
- [Usage](https://github.com/Pro-Gee/Weevar/blob/main/docs/USAGE.md)
- [Troubleshooting](https://github.com/Pro-Gee/Weevar/blob/main/docs/TROUBLESHOOTING.md)
- [Compatibility](https://github.com/Pro-Gee/Weevar/blob/main/docs/COMPATIBILITY.md)
- [Security](https://github.com/Pro-Gee/Weevar/blob/main/docs/SECURITY.md)
- [Changelog](https://github.com/Pro-Gee/Weevar/blob/main/CHANGELOG.md)
- [Weevar.com](https://weevar.com)

---

## License

MIT — © 2026 Gideon Adeyemi
