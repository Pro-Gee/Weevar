import { useEffect, useState } from "react";
import type { WeevarRuntimeConfig } from "weevar/react";
import { Weevar } from "weevar/react";
import weevarFileConfig from "virtual:weevar-config";
import { App } from "./App";

/** Matches Tailwind `lg`; overlay UX assumes keyboard + precise pointer. */
const DESKTOP_MEDIA = "(min-width: 1024px)";

function useDesktopViewport(): boolean {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_MEDIA).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MEDIA);
    const sync = () => setDesktop(mq.matches);
    mq.addEventListener("change", sync);
    sync();
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
}

function DesktopMonitorIcon() {
  return (
    <svg
      className="desktop-only-icon"
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="2"
        y="4"
        width="20"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DesktopOnlyScreen() {
  return (
    <div className="desktop-only-screen">
      <DesktopMonitorIcon />
      <div className="desktop-only-copy">
        <h1 className="desktop-only-title">Desktop only</h1>
        <p className="desktop-only-body">
          This playground needs a keyboard and a precise pointer. Resize the window to at least about
          1024px wide, or open this page on a desktop or laptop.
        </p>
      </div>
    </div>
  );
}

export function PlaygroundShell() {
  const desktop = useDesktopViewport();

  if (!desktop) {
    return <DesktopOnlyScreen />;
  }

  return (
    <>
      <App />
      <Weevar config={weevarFileConfig as WeevarRuntimeConfig} />
    </>
  );
}
