import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { weevar } from "weevar/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

/**
 * Public demo (e.g. demo.weevar.com): build with `VITE_WEEVAR_PUBLIC_DEMO=true` so theme does not
 * persist and index.html skips reading localStorage before hydration.
 *
 * The overlay stays enabled because this app resolves `weevar/react` to `entry-dev.tsx`; the
 * published npm package uses `WeevarProd` (no-op) under production conditions instead.
 */
export default defineConfig({
  plugins: [weevar(), react()],
  server: {
    port: 5173,
    strictPort: process.env.PLAYWRIGHT === "1",
    host: process.env.PLAYWRIGHT === "1" ? "127.0.0.1" : undefined,
  },
  resolve: {
    alias: {
      "weevar/react": path.resolve(root, "../../packages/weevar/src/react/entry-dev.tsx"),
    },
  },
});
