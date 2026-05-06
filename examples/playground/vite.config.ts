import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { weevar } from "weevar/vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const weevarPkgPath = path.resolve(root, "../../packages/weevar/package.json");
const weevarVersion = JSON.parse(readFileSync(weevarPkgPath, "utf8")).version as string;

export default defineConfig({
  define: {
    __WEEVAR_VERSION__: JSON.stringify(weevarVersion),
  },
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
