# Install Guide

This guide covers installing Weevar in a React app, enabling source-accurate prompts, and optional configuration.

---

## Requirements

| Requirement | Version / notes |
|-------------|-----------------|
| Node.js | `>= 18.18` |
| React | `>= 17` |
| React DOM | `>= 17` |
| Environment | **Development only** — dev server running, not production build |

Weevar is validated primarily in **Chromium-based** browsers. Firefox and Safari are best-effort.

---

## 1) Install the package

```bash
npm install weevar
```

Dev dependency is fine if you only use Weevar locally:

```bash
npm install --save-dev weevar
```

---

## 2) Mount the runtime component

Add `<Weevar />` once at your app root (alongside your main app tree):

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

### Next.js (App Router example)

In `app/layout.tsx` or a client wrapper:

```tsx
"use client";

import { Weevar } from "weevar/react";

export function WeevarClient() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Weevar />;
}
```

Mount `<WeevarClient />` in your root layout. Production builds should not mount the overlay; the prod export is also a no-op.

### Optional runtime config

```tsx
<Weevar
  config={{
    prompts: { tailwindVerbatimClasses: true },
  }}
/>
```

See [Usage](./USAGE.md#configuration) for `weevar.config.json` and merge behavior.

### Custom toggle shortcut

```tsx
<Weevar keybind={{ key: "w", meta: true, alt: true }} />
```

Default: **⌘⇧E** / **Ctrl+Shift+E**.

---

## 3) Bundler integration (strongly recommended)

Source mapping makes prompts reference exact files and lines (`src/App.tsx:182`). Without it, prompts fall back to DOM paths and content hashes.

### Vite (recommended)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { weevar } from "weevar/vite";

export default defineConfig({
  plugins: [
    weevar(), // enforce: "pre" — run before React transform
    react(),
  ],
});
```

The plugin:

- Injects `data-wv-source` on JSX elements when missing (Babel transform at build time)
- Serves `virtual:weevar-config` — merged `weevar.config.*` + Tailwind detection

Import config in your app if needed:

```tsx
import weevarFileConfig from "virtual:weevar-config";
// pass to <Weevar config={weevarFileConfig} /> when using typed merge
```

### SWC

Use the `weevar/swc` export to integrate with SWC-based pipelines. See package types and monorepo examples for wiring.

### Webpack

Use the `weevar/webpack-loader` export in your loader chain for JSX/TSX files.

---

## 4) Project configuration files

Optional files at project root:

| File | Purpose |
|------|---------|
| `weevar.config.json` | Static JSON config |
| `weevar.config.mjs` / `weevar.config.js` | JS config; overrides JSON on conflict |

Example:

```json
{
  "prompts": {
    "tailwindVerbatimClasses": true,
    "tailwindConfigPath": "tailwind.config.ts"
  }
}
```

When Tailwind is present, the Vite plugin may auto-populate Tailwind-related prompt options if not explicitly set.

---

## 5) Start the dev server

```bash
npm run dev
```

Open the URL printed by your dev server (often `http://localhost:5173`).

Toggle Weevar:

- **⌘⇧E** / **Ctrl+Shift+E**, or
- Click the dock trigger

---

## Package export paths

| Subpath | Description |
|---------|-------------|
| `weevar/react` | `<Weevar />` component |
| `weevar/vite` | Vite plugin |
| `weevar/swc` | SWC plugin helpers |
| `weevar/webpack-loader` | Webpack loader |

Published tarball includes `dist/**`, `README.md`, and `LICENSE` only.

---

## Verify installation

1. Dev server running; `<Weevar />` mounted.
2. Toggle overlay — dock appears.
3. Press **W**, click an element — edit tray opens.
4. Drag an element — live reorder preview.
5. Press **P** — prompt drawer opens (empty until you make edits).

If prompts show `src:source:unknown`, add or fix the Vite plugin (step 3).

---

## Monorepo / linked package development

When developing Weevar from source in a monorepo:

```bash
npm run build -w weevar
npm run dev -w playground   # or your example app
```

Ensure only **one** `tsup --watch` process writes `packages/weevar/dist`. Playground may alias `weevar/react` to `entry-dev.tsx` for hot development.

---

## Next steps

- [Usage guide](./USAGE.md) — full workflow, shortcuts, prompts
- [Troubleshooting](./TROUBLESHOOTING.md) — common issues
- [Compatibility](./COMPATIBILITY.md) — framework and browser notes
