# Weevar

Weevar is a dev-only UI overlay for React apps. You move elements directly in the running page, then copy a structured prompt for AI coding assistants.

## Status

Public beta toward stable `v1.0`.

## Quickstart

```bash
npm install weevar
```

In your app root:

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

For Vite projects:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { weevar } from "weevar/vite";

export default defineConfig({
  plugins: [weevar(), react()],
});
```

Run your dev server and press `Cmd/Ctrl + Shift + E`.

## Documentation

- [Install Guide](docs/INSTALL.md)
- [Usage Guide](docs/USAGE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Security and Privacy](docs/SECURITY.md)
- [Release Checklist](docs/RELEASE.md)

## What Weevar does

- Select and move live UI elements in development
- Show visual drop targets and insertion bars
- Track changes and generate structured prompts
- Copy prompts in short/detailed formats

## Current constraints

- Dev-only runtime; no production behavior by design
- Chromium-first validation
- Layout move/reorder focus (not full style editor)
- React-first support

## Contributing

Internal development commands:

```bash
npm run dev
npm run test
npm run test:e2e:setup
npm run test:e2e
npm run release:check
```

## License

MIT
