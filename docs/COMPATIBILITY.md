# Compatibility

Supported environments, integrations, and known limitations for Weevar **v1.1.0+**.

---

## Frameworks

| Framework | Support | Notes |
|-----------|---------|-------|
| **React** | 17, 18, 19 | Required |
| **React DOM** | 17+ | Required |
| **Next.js** | App Router / Pages | Mount `<Weevar />` in dev; use client component where needed |
| **Remix, CRA, etc.** | Best effort | Works if React dev mount + bundler integration are configured |

Weevar reads the **React fiber tree** for component names and optional source from the Vite transform. Custom renderers or non-standard React roots may reduce prompt accuracy.

---

## Bundlers and integrations

| Tool | Package export | Status |
|------|----------------|--------|
| **Vite** | `weevar/vite` | **Recommended** — source injection, config virtual module, Tailwind probe |
| **SWC** | `weevar/swc` | Supported |
| **Webpack** | `weevar/webpack-loader` | Supported |

Without a bundler plugin, layout/style editing still works; prompts rely on DOM path + content hash instead of `file:line` sources.

---

## CSS and styling stacks

| Stack | Layout edits | Style edits | Prompt notes |
|-------|--------------|-------------|--------------|
| **Plain CSS / CSS Modules** | Yes | Yes | Detailed prompts list CSS property before/after |
| **Tailwind CSS** | Yes | Yes | Optional Tailwind column in detailed prompts when enabled |
| **CSS-in-JS** (styled-components, emotion, …) | Yes | Partial | Live preview mutates computed/inline styles; prompts describe CSS values, not JS API calls |
| **Inline styles in JSX** | Yes | Yes | Commits may map to inline style properties on the DOM node |

Style edits preview on the **DOM**. Applying prompts may require translating CSS values back into your styling system (classes, tokens, theme objects).

---

## Layout systems

Weevar drag-and-drop works with common layout modes:

- `display: flex` / `inline-flex`
- `display: grid` / `inline-grid`
- `display: block` / `inline-block`

`display: contents` nodes are not valid drop containers. Complex nested layouts may restrict valid drop targets.

---

## Element types

| Type | Layout drag | Style tray |
|------|-------------|------------|
| HTML elements | Yes | Category-based controls |
| SVG elements | Yes | SVG-specific controls |
| `img` | Yes | Object-fit, dimensions |
| Text nodes | Parent element selected | Text category when appropriate |
| Portal-rendered content | Yes | Fiber chain notes portal in identity (debugging) |

---

## Browser support

| Browser | Status |
|---------|--------|
| **Chrome / Edge / Chromium** | Primary validation target |
| **Firefox** | Best effort |
| **Safari** | Best effort |

Shadow DOM, pointer capture, and `getComputedStyle` behavior vary slightly across engines.

---

## Environment

| Environment | Supported |
|-------------|-----------|
| Local dev server | **Yes** |
| Production build | **No** (no-op export; do not rely on overlay) |
| SSR-only pages without hydration | Overlay waits for hydration before activation |
| Mobile / narrow viewports | Usable but not optimized; precision pointer recommended |

---

## AI coding tools

Prompt **target tool** setting formats output for:

- Claude Code
- Codex (Cursor uses Codex formatting when configured)
- Generic assistants

Weevar does not call external APIs; you copy prompts into your tool of choice.

---

## Known limitations

1. **No automatic code write** — prompts are the handoff to your AI workflow.
2. **No cross-page sessions** — refresh or navigation clears runtime edits (session is in-memory).
3. **No component prop editing** — only DOM structure (moves) and CSS (style tweaks).
4. **Chromium-first QA** — report cross-browser issues with repro steps.
5. **Heavy CSS resets** — rare host resets may affect preview fidelity; Shadow DOM isolates Weevar chrome, not your app content.
6. **Same-position no-ops** — dropping at the original index does not create a prompt entry.

---

## Version compatibility

| weevar version | Session type | Change kinds |
|----------------|--------------|--------------|
| 1.0.x | Layout only | `reorder`, `move` |
| 1.1.x+ | Layout + style | `reorder`, `move`, `style-tweak` |

`MoveSession` type alias remains for TypeScript backward compatibility; prefer `EditSession` in new code.

---

## Related

- [Install](./INSTALL.md)
- [Usage](./USAGE.md)
- [Security](./SECURITY.md)
