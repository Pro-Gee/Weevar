import pkg from "../package.json";

/** Semver from `package.json`. */
export const WEEVAR_VERSION: string = pkg.version;

/** Display label shown in tray footers (`v1.2.3`). */
export function weevarVersionLabel(): string {
  return `v${WEEVAR_VERSION}`;
}
