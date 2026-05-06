import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const packageDir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as { version: string };

export default defineConfig({
  entry: {
    "react.dev": "src/react/entry-dev.tsx",
    "react.prod": "src/react/entry-prod.tsx",
    vite: "src/vite/plugin.ts",
    swc: "src/swc/index.ts",
    "webpack-loader": "src/vite/webpackLoader.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    entry: {
      "react.dev": "src/react/entry-dev.tsx",
      "react.prod": "src/react/entry-prod.tsx",
      vite: "src/vite/plugin.ts",
      swc: "src/swc/index.ts",
      "webpack-loader": "src/vite/webpackLoader.ts",
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "vite",
    "node:fs",
    "node:path",
    "node:url",
    "@babel/core",
    "@babel/types",
    "@babel/preset-react",
    "@babel/preset-typescript",
    "@swc/core",
  ],
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV ?? "development",
      ),
      __WEEVAR_VERSION__: JSON.stringify(pkg.version),
    };
  },
});
