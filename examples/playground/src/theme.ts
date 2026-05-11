export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "pg-theme";

/** Build-time flag: set `VITE_WEEVAR_PUBLIC_DEMO=true` for demo.weevar.com–style deploys (no theme persistence; clears stale keys on load). */
export function isPublicDemoBuild(): boolean {
  return import.meta.env.VITE_WEEVAR_PUBLIC_DEMO === "true";
}

/** Avoid inheriting `pg-theme` from a prior non-demo session on the same origin. */
export function clearPublicDemoStalePrefs(): void {
  if (!isPublicDemoBuild()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredTheme(): ThemeMode {
  if (isPublicDemoBuild()) return "light";
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "light";
}

export function persistTheme(mode: ThemeMode) {
  if (isPublicDemoBuild()) return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Syncs `<html data-theme>` for CSS; omit attribute when following OS. */
export function applyDomTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}
