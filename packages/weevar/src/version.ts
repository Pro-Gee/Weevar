declare const __WEEVAR_VERSION__: string;

/** Semver from `package.json`, injected at bundle time. */
export const WEEVAR_VERSION: string = __WEEVAR_VERSION__;

/** Display label shown in tray footers (`v1.2.3`). */
export function weevarVersionLabel(): string {
  return `v${WEEVAR_VERSION}`;
}
