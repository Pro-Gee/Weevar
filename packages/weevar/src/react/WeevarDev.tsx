import { createRoot, type Root } from "react-dom/client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { waitForReactHydration } from "../engine/hydration";
import { WEEVAR_BOOT_DOT_CLASS, WEEVAR_HOST_ID } from "../engine/hitTest";
import { WeevarShadowApp } from "../overlay/WeevarShadowApp";
import type { WeevarKeybind, WeevarProps } from "../types";

let warnedAboutLegacyBootDot = false;
let warnedAboutForeignHostOwner = false;
const WEEVAR_HOST_OWNER_ATTR = "data-wv-owner";
const WEEVAR_OWNER_TOKEN_GLOBAL_KEY = "__weevar_host_owner_token__";
const WEEVAR_HOST_OWNER_TOKEN = (() => {
  const g = globalThis as typeof globalThis & {
    [WEEVAR_OWNER_TOKEN_GLOBAL_KEY]?: string;
  };
  if (!g[WEEVAR_OWNER_TOKEN_GLOBAL_KEY]) {
    g[WEEVAR_OWNER_TOKEN_GLOBAL_KEY] = `weevar-${Math.random().toString(36).slice(2)}`;
  }
  return g[WEEVAR_OWNER_TOKEN_GLOBAL_KEY];
})();

const defaultMatchKeybind = (e: KeyboardEvent): boolean => {
  if (e.repeat) return false;
  if (e.key.toLowerCase() !== "e" || !e.shiftKey) return false;
  return e.metaKey || e.ctrlKey;
};

function matchCustomKeybind(e: KeyboardEvent, k: WeevarKeybind): boolean {
  if (e.repeat) return false;
  if (e.key.toLowerCase() !== k.key.toLowerCase()) return false;
  if (k.meta && !e.metaKey) return false;
  if (k.ctrl && !e.ctrlKey) return false;
  if (k.shift && !e.shiftKey) return false;
  if (k.alt && !e.altKey) return false;
  return true;
}

export function Weevar(props: WeevarProps) {
  const { disabled, keybind, config } = props;
  const [sessionOn, setSessionOn] = useState(false);

  useEffect(() => {
    if (disabled) setSessionOn(false);
  }, [disabled]);
  const reactRootRef = useRef<Root | null>(null);
  const hostRef = useRef<HTMLElement | null>(null);

  const cleanupLegacyBootDots = useCallback(() => {
    const staleDots = document.querySelectorAll(`.${WEEVAR_BOOT_DOT_CLASS}`);
    if (!staleDots.length) return;
    staleDots.forEach((dot) => dot.remove());
    if (import.meta.env.DEV && !warnedAboutLegacyBootDot) {
      warnedAboutLegacyBootDot = true;
      console.warn(
        `[weevar] Removed ${staleDots.length} stale legacy boot dot node(s).`,
      );
    }
  }, []);

  const ensureShadowHost = useCallback((): boolean => {
    if (reactRootRef.current) return true;
    cleanupLegacyBootDots();

    const existingHost = document.getElementById(WEEVAR_HOST_ID) as HTMLElement | null;
    if (existingHost) {
      const owner = existingHost.getAttribute(WEEVAR_HOST_OWNER_ATTR);
      if (owner && owner !== WEEVAR_HOST_OWNER_TOKEN) {
        if (import.meta.env.DEV && !warnedAboutForeignHostOwner) {
          warnedAboutForeignHostOwner = true;
          console.warn(
            "[weevar] Existing overlay host is owned by another instance; skipping host takeover.",
          );
        }
        return false;
      }
      existingHost.remove();
    }

    const host = document.createElement("div");
    host.id = WEEVAR_HOST_ID;
    host.setAttribute(WEEVAR_HOST_OWNER_ATTR, WEEVAR_HOST_OWNER_TOKEN);
    host.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "closed" });
    const mount = document.createElement("div");
    shadow.appendChild(mount);
    const root = createRoot(mount);
    hostRef.current = host;
    reactRootRef.current = root;
    return true;
  }, [cleanupLegacyBootDots]);

  const activate = useCallback(async () => {
    if (disabled) return;
    await waitForReactHydration();
    if (!ensureShadowHost()) return;
    setSessionOn(true);
  }, [disabled, ensureShadowHost]);

  const toggleSession = useCallback(async () => {
    if (disabled) return;
    await waitForReactHydration();
    if (!ensureShadowHost()) return;
    setSessionOn((s) => !s);
  }, [disabled, ensureShadowHost]);

  useEffect(() => {
    if (disabled) return;
    cleanupLegacyBootDots();
    void ensureShadowHost();
  }, [disabled, cleanupLegacyBootDots, ensureShadowHost]);

  useEffect(() => {
    if (disabled) return;
    if (!reactRootRef.current && !ensureShadowHost()) return;
    reactRootRef.current?.render(
      <WeevarShadowApp
        sessionOn={sessionOn}
        setSessionOn={setSessionOn}
        disabled={disabled}
        config={config}
      />,
    );
  }, [disabled, ensureShadowHost, sessionOn, config]);

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as Node | null;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable)
          return;
      }
      const match = keybind
        ? matchCustomKeybind(e, keybind)
        : defaultMatchKeybind(e);
      if (!match) return;
      e.preventDefault();
      void toggleSession();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, keybind, toggleSession]);

  useEffect(() => {
    return () => {
      const ownedHost = hostRef.current;
      const root = reactRootRef.current;
      hostRef.current = null;
      reactRootRef.current = null;
      window.setTimeout(() => {
        root?.unmount();
        if (
          ownedHost &&
          ownedHost.getAttribute(WEEVAR_HOST_OWNER_ATTR) === WEEVAR_HOST_OWNER_TOKEN
        ) {
          ownedHost.remove();
        }
      }, 0);
    };
  }, []);

  return null;
}
