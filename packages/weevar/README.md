# Weevar

Weevar is a **development-only** UI overlay for React apps. Move elements directly on the running page, then copy a structured prompt for AI coding assistants.

## Quickstart

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

Run your dev server and press **⌘⇧E** (Mac) or **Ctrl+Shift+E** (Windows/Linux).

## Documentation

Full guides live in the repository:

- [Install](https://github.com/weevar/weevar/blob/main/docs/INSTALL.md)
- [Usage](https://github.com/weevar/weevar/blob/main/docs/USAGE.md)
- [Troubleshooting](https://github.com/weevar/weevar/blob/main/docs/TROUBLESHOOTING.md)
- [Compatibility](https://github.com/weevar/weevar/blob/main/docs/COMPATIBILITY.md)
- [Security](https://github.com/weevar/weevar/blob/main/docs/SECURITY.md)

## Features

- Select and move live UI elements in development
- Visual drop targets and insertion hints
- Track layout changes and generate structured prompts

## Constraints

- Intended for **development** only
- React-first; Chromium is the primary test target
- Focus on layout moves/reorders (not a general style editor)

## License

MIT
