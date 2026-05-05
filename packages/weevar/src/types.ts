import type { WeevarRuntimeConfig } from "./engine/layoutTypes";

export type { WeevarRuntimeConfig };

export type WeevarKeybind = {
  /** e.g. 'e' with meta+shift */
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type WeevarProps = {
  /** Override default ⌘⇧E / Ctrl+Shift+E */
  keybind?: WeevarKeybind;
  /** Disable all interaction */
  disabled?: boolean;
  /** Runtime prompt / inspector options (merge with `virtual:weevar-config` if used). */
  config?: WeevarRuntimeConfig;
};
