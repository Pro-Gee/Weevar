# Install Guide

## Requirements

- Node `>=18.18`
- React app in development mode

## 1) Install package

```bash
npm install weevar
```

## 2) Mount runtime component

```tsx
import { Weevar } from "weevar/react";

<>
  <App />
  <Weevar />
</>
```

## 3) Add bundler integration (recommended)

### Vite

```ts
import { weevar } from "weevar/vite";
plugins: [weevar(), react()];
```

## 4) Start app

```bash
npm run dev
```

Use `Cmd/Ctrl + Shift + E` to toggle Weevar.

## Package export paths

- `weevar/react`
- `weevar/vite`
- `weevar/swc`
- `weevar/webpack-loader`
