import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { weevar } from "weevar/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

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
