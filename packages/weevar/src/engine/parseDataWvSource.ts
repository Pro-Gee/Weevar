import type { SourceLocation } from "./layoutTypes";

function decodeBase64Json(raw: string): SourceLocation | undefined {
  try {
    const bin = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const j = JSON.parse(bin) as { file?: string; line?: number; col?: number };
    if (!j?.file || !Number.isFinite(j.line)) return undefined;
    return { file: String(j.file), line: Number(j.line), col: Number(j.col ?? 0) };
  } catch {
    return undefined;
  }
}

/** `data-wv-source` = base64(JSON.stringify({file,line,col})) from optional tooling. */
export function parseDataWvSource(el: Element): SourceLocation | undefined {
  const raw = el.getAttribute("data-wv-source");
  if (!raw) return undefined;
  return decodeBase64Json(raw);
}

export function encodeDataWvSource(loc: SourceLocation): string {
  const json = JSON.stringify({
    file: loc.file,
    line: loc.line,
    col: loc.col,
  });
  return btoa(unescape(encodeURIComponent(json)));
}
