import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type TailwindHints = {
  /** Relative path to the resolved Tailwind config file, if any. */
  configPath?: string;
  /** Best-effort glob strings from `content:` (regex scan of JS/TS source). */
  contentGlobs?: string[];
  /** True when `tailwindcss` appears in package.json dependencies. */
  tailwindPackagePresent?: boolean;
};

const TAILWIND_CONFIG_NAMES = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs",
  "tailwind.config.ts",
];

function findTailwindConfigPath(cwd: string): string | undefined {
  for (const n of TAILWIND_CONFIG_NAMES) {
    const p = path.join(cwd, n);
    if (fs.existsSync(p)) return n;
  }
  return undefined;
}

function readTailwindPackageFlag(cwd: string): boolean {
  try {
    const pkgPath = path.join(cwd, "package.json");
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(
      pkg.dependencies?.tailwindcss ?? pkg.devDependencies?.tailwindcss,
    );
  } catch {
    return false;
  }
}

/** Pull quoted strings from the first top-level `content: [...]` block (best-effort). */
export function extractContentGlobsFromTailwindSource(src: string): string[] | undefined {
  const m = src.match(/content\s*:\s*\[([\s\S]*?)\]/);
  if (!m) return undefined;
  const inner = m[1];
  const globs: string[] = [];
  const strRe = /['"]([^'"]+)['"]/g;
  let sm: RegExpExecArray | null;
  while ((sm = strRe.exec(inner))) globs.push(sm[1]);
  return globs.length ? globs : undefined;
}

async function tryImportTailwindConfig(cwd: string): Promise<TailwindHints> {
  const rel = findTailwindConfigPath(cwd);
  if (!rel) return {};
  const abs = path.join(cwd, rel);
  const base: TailwindHints = {
    configPath: rel,
    tailwindPackagePresent: readTailwindPackageFlag(cwd),
  };
  if (rel.endsWith(".ts")) {
    try {
      const src = fs.readFileSync(abs, "utf8");
      const globs = extractContentGlobsFromTailwindSource(src);
      return globs?.length ? { ...base, contentGlobs: globs } : base;
    } catch {
      return base;
    }
  }
  try {
    const href = pathToFileURL(abs).href + `?t=${Date.now()}`;
    const mod = (await import(href)) as { default?: { content?: unknown } };
    const content = mod.default?.content;
    if (Array.isArray(content)) {
      const globs = content.filter((x): x is string => typeof x === "string");
      if (globs.length) return { ...base, contentGlobs: globs };
    }
  } catch {
    try {
      const src = fs.readFileSync(abs, "utf8");
      const globs = extractContentGlobsFromTailwindSource(src);
      return globs?.length ? { ...base, contentGlobs: globs } : base;
    } catch {
      return base;
    }
  }
  return base;
}

/** Resolve Tailwind presence and optional `content` hints for virtual config / prompts. */
export async function probeTailwindHints(cwd: string): Promise<TailwindHints> {
  const pkg = readTailwindPackageFlag(cwd);
  const cfgPath = findTailwindConfigPath(cwd);
  if (!cfgPath && !pkg) return {};
  const imported = await tryImportTailwindConfig(cwd);
  return {
    ...imported,
    tailwindPackagePresent: pkg || imported.tailwindPackagePresent,
    configPath: imported.configPath ?? cfgPath,
  };
}
