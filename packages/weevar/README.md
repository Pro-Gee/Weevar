# Weevar

A dev tool that lets you rearrange your UI visually in the browser—then turns those changes into prompts for AI to implement in code.

Weevar is **development-only**: it runs as an overlay in your React app while you work locally. Nothing ships to production by until you push.


## Installation

```bash
npm install weevar
```

Mount in your app root:

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

### Vite

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { weevar } from "weevar/vite";

export default defineConfig({
  plugins: [weevar(), react()],
});
```

Run your dev server and press **⌘⇧E** (Mac) or **Ctrl+Shift+E** (Windows/Linux) to toggle the overlay.

## Requirements

- **Node.js** `>= 18.18`
- A **React** app (`react` / `react-dom` **>= 17**)
- **Development mode** (run your usual dev server—e.g. Vite, Next dev—not a production build)
- **Bundler integration** is recommended for the best experience (see **Vite** below); other setups may need extra configuration—see the [Install](https://github.com/Pro-Gee/Weevar/blob/main/docs/INSTALL.md) guide.

## How it works

1. Run your app in dev mode.
2. Turn on the overlay (shortcut below).
3. Click and drag elements to rearrange them.
4. See the layout update instantly.

When you’re done, the tool generates a prompt.

Paste that into your AI coding tool, and it updates your code.

## What you can do right now

- Reorder elements within a layout.
- Move elements between sections.
- Experiment with layout structure visually.

This version is focused on **layout and structure** only.

## Why this is useful

Explaining layout changes is harder than it sounds:

- “Put this under that.”
- “Move this to the right but keep it aligned.”
- “Reorder these cards.”

Instead of describing it, you move things directly and let Weevar translate that into a structured prompt.

## Documentation

Full guides live in the repository:

- [Install](https://github.com/Pro-Gee/Weevar/blob/main/docs/INSTALL.md)
- [Usage](https://github.com/Pro-Gee/Weevar/blob/main/docs/USAGE.md)
- [Troubleshooting](https://github.com/Pro-Gee/Weevar/blob/main/docs/TROUBLESHOOTING.md)
- [Compatibility](https://github.com/Pro-Gee/Weevar/blob/main/docs/COMPATIBILITY.md)
- [Security](https://github.com/Pro-Gee/Weevar/blob/main/docs/SECURITY.md)
- [Weevar.com](https://weevar.com)

## License

© 2026 Gideon Adeyemi. All rights reserved.

licensed under the MIT License.
