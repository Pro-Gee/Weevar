import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as { version: string };

export default defineConfig({
  define: {
    __WEEVAR_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    benchmark: {
      include: ["src/**/*.bench.ts"],
    },
  },
});
