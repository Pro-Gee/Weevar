import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "vite";
import { transformJsxWithWeevarSource } from "./babelAddSource";
import { probeTailwindHints } from "./tailwindProbe";

const VIRTUAL = "\0virtual:weevar-config";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) {
    const bv = over[key];
    const av = base[key];
    if (isPlainObject(bv) && isPlainObject(av)) {
      out[key] = deepMerge(av, bv);
    } else {
      out[key] = bv;
    }
  }
  return out;
}

async function loadOptionalJsConfig(cwd: string): Promise<Record<string, unknown>> {
  const mjsPath = path.join(cwd, "weevar.config.mjs");
  const jsPath = path.join(cwd, "weevar.config.js");
  const pick = fs.existsSync(mjsPath) ? mjsPath : fs.existsSync(jsPath) ? jsPath : null;
  if (!pick) return {};
  try {
    const href = pathToFileURL(pick).href + `?t=${Date.now()}`;
    const mod = (await import(href)) as { default?: unknown };
    const def = mod.default;
    return isPlainObject(def) ? def : {};
  } catch {
    return {};
  }
}

/** Merges `weevar.config.json` with optional `weevar.config.mjs` / `weevar.config.js` (JS wins on overlap). */
export async function loadMergedWeevarConfig(cwd: string): Promise<Record<string, unknown>> {
  const jsonPath = path.join(cwd, "weevar.config.json");
  let jsonObj: Record<string, unknown> = {};
  try {
    if (fs.existsSync(jsonPath)) {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as unknown;
      jsonObj = isPlainObject(parsed) ? parsed : {};
    }
  } catch {
    jsonObj = {};
  }
  const jsOverlay = await loadOptionalJsConfig(cwd);
  const merged = deepMerge(jsonObj, jsOverlay);

  const tw = await probeTailwindHints(cwd);

  if (tw.configPath || tw.tailwindPackagePresent || tw.contentGlobs?.length) {
    const prompts = isPlainObject(merged.prompts) ? { ...merged.prompts } : {};
    if (
      prompts.tailwindVerbatimClasses === undefined &&
      (tw.configPath || tw.tailwindPackagePresent)
    )
      prompts.tailwindVerbatimClasses = true;
    if (tw.contentGlobs?.length && prompts.tailwindContentGlobs === undefined)
      prompts.tailwindContentGlobs = tw.contentGlobs;
    if (tw.configPath && prompts.tailwindConfigPath === undefined)
      prompts.tailwindConfigPath = tw.configPath;
    merged.prompts = prompts;
  }
  return merged;
}

/**
 * Vite integration:
 * - `virtual:weevar-config` — merged JSON + optional JS config, Tailwind file hint.
 * - JSX/TSX transform — injects `data-wv-source` when missing (build-time source map).
 */
export function weevar(): Plugin {
  return {
    name: "weevar",
    enforce: "pre",
    resolveId(id) {
      if (id === "virtual:weevar-config") return VIRTUAL;
    },
    async load(id) {
      if (id !== VIRTUAL) return null;
      const data = await loadMergedWeevarConfig(process.cwd());
      return `export default ${JSON.stringify(data)};`;
    },
    transform(code, id) {
      if (!/\.(tsx|jsx)$/.test(id)) return null;
      if (id.includes("node_modules")) return null;
      const out = transformJsxWithWeevarSource(code, id, process.cwd());
      if (!out) return null;
      return { code: out.code, map: out.map ?? undefined };
    },
  };
}
