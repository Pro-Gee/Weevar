/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When `"true"`, theme prefs are not persisted and stale keys are cleared — for public demo hosting. */
  readonly VITE_WEEVAR_PUBLIC_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "virtual:weevar-config" {
  import type { WeevarRuntimeConfig } from "weevar/react";
  const config: WeevarRuntimeConfig;
  export default config;
}
