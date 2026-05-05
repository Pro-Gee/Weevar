import { createRoot, type Root } from "react-dom/client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { waitForReactHydration } from "../engine/hydration";
import { WEEVAR_BOOT_DOT_CLASS, WEEVAR_HOST_ID } from "../engine/hitTest";
import { WeevarShadowApp } from "../overlay/WeevarShadowApp";
import type { WeevarKeybind, WeevarProps } from "../types";

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
  const bootDotRef = useRef<HTMLButtonElement | null>(null);

  const renderShadow = useCallback(() => {
    const host = document.getElementById(WEEVAR_HOST_ID);
    if (!host || !reactRootRef.current) return;
    reactRootRef.current.render(
      <WeevarShadowApp
        sessionOn={sessionOn}
        setSessionOn={setSessionOn}
        disabled={disabled}
        config={config}
      />,
    );
  }, [sessionOn, disabled, config]);

  useLayoutEffect(() => {
    renderShadow();
  }, [renderShadow]);

  const ensureShadowHost = useCallback(() => {
    if (reactRootRef.current) return;
    if (bootDotRef.current) {
      bootDotRef.current.remove();
      bootDotRef.current = null;
    }

    document.getElementById(WEEVAR_HOST_ID)?.remove();
    const host = document.createElement("div");
    host.id = WEEVAR_HOST_ID;
    host.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "closed" });
    const mount = document.createElement("div");
    shadow.appendChild(mount);
    const root = createRoot(mount);
    reactRootRef.current = root;
  }, []);

  const activate = useCallback(async () => {
    if (disabled) return;
    await waitForReactHydration();
    ensureShadowHost();
    setSessionOn(true);
  }, [disabled, ensureShadowHost]);

  const toggleSession = useCallback(async () => {
    if (disabled) return;
    await waitForReactHydration();
    ensureShadowHost();
    setSessionOn((s) => !s);
  }, [disabled, ensureShadowHost]);

  useEffect(() => {
    if (disabled) return;
    if (reactRootRef.current) return;

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = WEEVAR_BOOT_DOT_CLASS;
    dot.setAttribute("aria-label", "Activate Weevar overlay");
    dot.title = "Activate Weevar (⌘⇧E)";
    dot.style.cssText = [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "width:8px",
      "height:8px",
      "border-radius:999px",
      "background:#0099ff",
      "opacity:0.55",
      "border:none",
      "padding:0",
      "cursor:pointer",
      "z-index:2147483645",
      "box-shadow:0 4px 16px rgba(0,0,0,0.3)",
    ].join(";");
    dot.addEventListener("click", () => void activate());
    document.body.appendChild(dot);
    bootDotRef.current = dot;

    return () => {
      dot.remove();
      bootDotRef.current = null;
    };
  }, [disabled, activate]);

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
      reactRootRef.current?.unmount();
      reactRootRef.current = null;
      document.getElementById(WEEVAR_HOST_ID)?.remove();
    };
  }, []);

  return null;
}
