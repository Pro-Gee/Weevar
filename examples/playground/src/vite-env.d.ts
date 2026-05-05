/// <reference types="vite/client" />

declare module "virtual:weevar-config" {
  import type { WeevarRuntimeConfig } from "weevar/react";
  const config: WeevarRuntimeConfig;
  export default config;
}
