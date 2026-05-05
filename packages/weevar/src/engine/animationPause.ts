const CLASS = "__weevar_pause_anim__";
let refCount = 0;
let styleEl: HTMLStyleElement | null = null;

/** Pauses CSS transitions/animations on the host page during drag (TRD §8). */
export function pushPauseHostAnimations(): () => void {
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.textContent = `.${CLASS} * { transition: none !important; animation-play-state: paused !important; }`;
    document.head.appendChild(styleEl);
  }
  document.documentElement.classList.add(CLASS);
  refCount++;
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) document.documentElement.classList.remove(CLASS);
  };
}
