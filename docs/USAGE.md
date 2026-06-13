# Usage Guide

Weevar V2 supports **layout editing** (drag to reorder/move) and **style editing** (edit tray) in one session. This guide covers the full overlay workflow, prompts, and configuration.

---

## Activate the overlay

- **Keyboard:** `Cmd/Ctrl + Shift + E` (default; customizable via `<Weevar keybind={…} />`)
- **UI:** Click the dock trigger on the edge of the viewport

The overlay mounts in a closed Shadow DOM layer so host page styles do not bleed into Weevar chrome.

---

## UI overview

### Dock

Vertical dock with tool shortcuts:

| Control | Key | Purpose |
|---------|-----|---------|
| Overview | **O** | Session summary, documentation link |
| Pointer / edit | **W** | Select elements, drag layout, open edit tray |
| Prompt | **P** | Generate and copy batched prompt |
| Settings | *(icon)* | Target tool and prompt style |

The tray footer shows the installed package version (e.g. `v1.1.0`).

### Overview tray

- **Total edits** — count of unique elements edited in the current session (layout + style).
- **Target tool** — currently selected AI assistant format.
- **Documentation** — link to [weevar.com](https://weevar.com).

### Pointer / edit mode

1. **Click** an element on the page to select it.
2. **Hover** other elements to see labels; selection shows corner markers and a drag handle.
3. **Edit tray** (right side) opens when an element is selected — style controls appear here.
4. **Drag** the top bar on the selection to move/reorder.

**Alt + hover:** With an element selected, hold **Alt** and hover another element to show the **spacing measure** overlay (gap between boxes).

### Prompt drawer

Opens when you press **P** or generate from the dock. Shows the full batched prompt with copy button. Empty state: **"No edits made yet"**.

### Settings tray

- **Target Tool:** Claude Code, Codex, or Generic
- **Prompt Style:** Short or Detailed

---

## Layout workflow

### Reorder (same parent)

1. Select an element.
2. Drag via the selection handle.
3. Drop at the desired index within the same container.
4. A live preview updates child order (flex-order preview where supported).

### Move (cross-container)

1. Select an element (or a **container** such as `.carousel-scroll`).
2. Drag into another valid layout parent (flex, grid, block, inline-block).
3. Drop at the target child index.

**Important:** When moving a **container with children**, the prompt identifies it by tag + class and child count, e.g. `<div.carousel-scroll> (4 element children)`, and instructs agents to move the **entire subtree unchanged**—not to split out individual slides or text nodes.

### Valid drop targets

Weevar walks up from the pointer hit to find a layout container that can accept the dragged element. `display: contents` nodes are skipped.

---

## Style workflow

### Selecting and committing

1. Enter pointer mode (**W**) and click an element.
2. Adjust values in the edit tray — changes preview live on the DOM.
3. **Commit** happens when you blur a field, pick a dropdown option, or click away from the tray (focus moves back to the page).

Each commit records a **style tweak** in the session. Multiple property changes in one commit action are grouped. Repeated edits on the same element merge (earliest `from`, latest `to` per property).

### Element categories

Weevar classifies elements to show relevant controls:

| Category | Detection (simplified) | Edit tray sections |
|----------|-------------------------|-------------------|
| **text** | Text tags (`p`, `h1`, headings, `button`, …) or leaf nodes with direct text | Typography, box, visibility, raw CSS |
| **image** | `img` | Fit, dimensions, box, visibility |
| **svg** | `svg` or inside SVG | SVG dimensions, fill/stroke, visibility |
| **stack** | Multiple children, or flex/grid display | Layout (type, direction, gap, columns, alignment), box, visibility |
| **generic** | Fallback | Limited colour/display/size, box, visibility |

### Box section

- **Width / height** — numeric px input, or **Fill container** / **Hug content** from the W/H label dropdown
- **Padding / margin** — unified or per-side (box control)
- **Border** — style, weight, colour; optional per-side weights
- **Radius** — uniform or per-corner
- **Opacity** — slider with commit

### Layout section (stack category)

- **Layout type** — block, flex, grid
- **Flex direction** — row / column (when flex)
- **Gap** — row/column gap controls
- **Grid columns** — template columns (when grid)
- **Alignment** — justify-content and align-items

### Raw CSS panel

Expand **CSS** at the bottom of the tray to see underlying property names and values for the element’s category. Useful for properties not exposed as dedicated controls.

---

## Session management

| Action | Key | Behavior |
|--------|-----|----------|
| Undo | **U** | Reverts last edit (layout or style); updates live DOM |
| Redo | **R** | Re-applies undone edit |
| Clear session | **D** | Removes all edits; clears selection and trays |

Undoing a **style tweak** restores the element’s computed styles to pre-commit values on the live DOM.

Destructive session actions dismiss open trays; re-open Prompt after undo/redo if needed.

---

## Prompt generation

### When to generate

Press **P** after one or more layout moves and/or style commits. Weevar builds a **batched prompt** from the full session in ordinal order.

### Short prompts

Dense prose, one numbered step per edit. Example fragments:

**Layout move:**
```text
Move <div.carousel-scroll> (4 element children) {src:src/App.tsx:204; …} from …
Move the entire element subtree (4 element children); do not split or recreate nested nodes.
```

**Style tweak:**
```text
Update styles on <button.pill> {src:…}: `border-radius` 999px → 8px. Preserve all props and event handlers.
```

### Detailed prompts

Markdown with headings, file/element lines, property tables (styles), constraints, and optional Tailwind column.

### Batched mixed sessions

Header example:

```text
11 changes (9 style updates, 2 layout moves) (apply in order; each step's positions are relative to the state after prior steps):
```

Global constraints remind agents to preserve props, avoid wrapper elements, move full subtrees, and apply steps in order.

### Target tool variants

| Tool | Notes |
|------|-------|
| **Claude Code** | Full paths in detailed prompts |
| **Codex** | Repeated `**File:**` lines omitted in multi-step detailed sections |
| **Generic** | Includes `<!-- TODO: include source snippets -->` placeholders |

### Source accuracy

Prompts include `{src:file:line; dom:…; h:…}` blocks when the Vite plugin (or equivalent) injects `data-wv-source`. Without source mapping, prompts still work but may show `src:source:unknown` and include a tip to install the plugin.

---

## Configuration

### Runtime props

```tsx
<Weevar
  disabled={false}
  keybind={{ key: "e", meta: true, shift: true }}
  config={{
    prompts: {
      tailwindVerbatimClasses: true,
    },
  }}
/>
```

### Project config files

The Vite plugin loads merged config from:

1. `weevar.config.json`
2. `weevar.config.mjs` or `weevar.config.js` (overrides JSON)

Exposed as `virtual:weevar-config` and merged with `<Weevar config={…} />`.

Example `weevar.config.json`:

```json
{
  "prompts": {
    "tailwindVerbatimClasses": true
  }
}
```

When Tailwind is detected, the plugin may auto-enable `tailwindVerbatimClasses` and record config path / content globs for prompt context.

---

## What Weevar does *not* do

- **Does not** write to your source files automatically
- **Does not** persist edits across page refresh
- **Does not** run in production bundles (no-op export)
- **Does not** edit React component props or state—only DOM/CSS preview + prompts

---

## Tips for best results

1. Use **`weevar/vite`** so prompts include file:line anchors.
2. For multi-step sessions, paste the **entire batched prompt** and ask the agent to apply steps **in order**.
3. When moving **containers** (carousels, cards, sections), select the wrapper element—not a child text node.
4. Use **Detailed** prompts for complex style batches; **Short** for quick chat paste.
5. **Clear session (D)** before starting a unrelated task to avoid mixing prompts.

---

## Related docs

- [Install](./INSTALL.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Compatibility](./COMPATIBILITY.md)
