/** Injected into Shadow DOM (PRD/TRD visual spec) */
export const OVERLAY_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap");

:root {
  --weevar-dark: #111113;
  --wv-bg: #0f1115;
  --wv-panel: #1a1d24;
  --wv-border: #2a2e38;
  --wv-accent: #0099ff;
  --wv-success: #00c896;
  --wv-danger: #ff4d4f;
  --wv-ui: 13px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --wv-mono: 12px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

* { box-sizing: border-box; }

.wv-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font: var(--wv-ui);
  color: #e8eaed;
}

.wv-root,
.wv-root * {
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

.wv-pe { pointer-events: auto; }

.wv-dot {
  position: fixed;
  right: 12px;
  bottom: 12px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--wv-accent);
  opacity: 0.55;
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  z-index: 5;
}
.wv-dot:hover { opacity: 0.9; }

.wv-toolbar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  background: rgba(15, 17, 21, 0.72);
  border: 1px solid var(--wv-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  pointer-events: auto;
  z-index: 20;
}

.wv-toolbar-status {
  font-size: 13px;
  color: #c9cdd4;
  max-width: min(420px, 50vw);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wv-toolbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.wv-toolbar-link {
  border: none;
  background: transparent;
  color: #c9cdd4;
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
}
.wv-toolbar-link:hover { color: #e8eaed; text-decoration: underline; }

.wv-toolbar-generate {
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--wv-accent);
  background: var(--wv-accent);
  color: #0b0d10;
  font-size: 12px;
  font-weight: 600;
  padding: 0 10px;
  cursor: pointer;
}
.wv-toolbar-generate:disabled {
  opacity: 0.5;
  cursor: default;
}

.wv-toolbar-close {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--wv-border);
  background: var(--wv-panel);
  color: #e8eaed;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
}
.wv-toolbar-close:hover {
  border-color: var(--wv-accent);
  color: var(--wv-accent);
}

.wv-outline {
  position: fixed;
  pointer-events: none;
  border: 2px solid rgba(0, 153, 255, 0.6);
  background: rgba(0, 153, 255, 0.05);
  border-radius: 2px;
  z-index: 2;
}

.wv-outline-selected {
  border-color: var(--wv-accent);
  background: rgba(0, 153, 255, 0.06);
}

.wv-label {
  position: fixed;
  pointer-events: none;
  z-index: 3;
  font: 11px var(--wv-mono);
  background: rgba(15, 17, 21, 0.92);
  color: #e8eaed;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid var(--wv-border);
  max-width: min(360px, 70vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wv-cursor-label {
  position: fixed;
  pointer-events: none;
  z-index: 31;
  display: inline-flex;
  height: 24px;
  padding: 5px 10px;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  border-radius: 8px;
  background: rgba(17, 17, 19, 0.9);
  color: var(--weevar-light, #EBEBEB);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.wv-markers {
  position: fixed;
  pointer-events: none;
  z-index: 4;
}

.wv-corner {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--wv-accent);
}

.wv-drag-handle {
  position: fixed;
  width: 24px;
  height: 24px;
  padding: 5px 10px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  border: none;
  background: rgba(17, 17, 19, 0.9);
  pointer-events: auto;
  cursor: grab;
  z-index: 6;
  display: flex;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.wv-drag-handle:active { cursor: grabbing; }
.wv-drag-handle svg { width: 16px; height: 16px; display: block; flex: 0 0 auto; }

.wv-selected-top {
  position: fixed;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  z-index: 7;
  pointer-events: none;
}

.wv-selected-top .wv-drag-handle {
  position: static;
  pointer-events: auto;
}

.wv-selected-label {
  display: inline-flex;
  height: 24px;
  padding: 5px 10px;
  justify-content: center;
  align-items: flex-start;
  gap: 10px;
  border-radius: 8px;
  background: rgba(17, 17, 19, 0.9);
  color: var(--weevar-light, #EBEBEB);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wv-action-panel {
  position: fixed;
  width: 240px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(26, 29, 36, 0.95);
  border: 1px solid var(--wv-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  pointer-events: auto;
  z-index: 7;
}

.wv-action-title {
  font-size: 11px;
  color: #9aa0a6;
  margin-bottom: 6px;
}

.wv-path {
  font: 11px var(--wv-mono);
  color: #e8eaed;
  word-break: break-all;
}

.wv-pill {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid var(--wv-border);
  background: var(--wv-bg);
  color: #c9cdd4;
}

.wv-hint {
  margin-top: 8px;
  font-size: 11px;
  color: #9aa0a6;
}

.wv-insertion-bar {
  position: fixed;
  pointer-events: none;
  z-index: 8;
  background: var(--wv-accent);
  border-radius: 1px;
  animation: wv-pulse 0.8s ease-in-out infinite;
}

@keyframes wv-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.wv-drag-preview {
  position: fixed;
  z-index: 9;
  max-width: 200px;
  max-height: 120px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--wv-accent);
  background: rgba(26, 29, 36, 0.92);
  color: #e8eaed;
  font: 11px var(--wv-mono);
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  transform: translate(14px, 14px);
}

.wv-prompt-drawer {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  background: var(--wv-panel);
  border-left: 1px solid var(--wv-border);
  box-shadow: -8px 0 24px rgba(0,0,0,0.35);
  z-index: 30;
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 10px;
  animation: wv-slide-in 0.12s ease-out;
}

.wv-settings-drawer {
  position: fixed;
  top: 48px;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  background: var(--wv-panel);
  border-left: 1px solid var(--wv-border);
  box-shadow: -8px 0 24px rgba(0,0,0,0.35);
  z-index: 30;
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 16px;
  animation: wv-slide-in 0.12s ease-out;
}

.wv-settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.wv-settings-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--wv-border);
  background: transparent;
  color: #e8eaed;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.wv-settings-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wv-settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
  min-height: 0;
  padding: 14px 16px;
  box-sizing: border-box;
}

.wv-settings-label-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 2px;
  color: var(--weevar-grey300, #868689);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}

.wv-settings-label-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.wv-settings-info-icon {
  color: #484848;
  transform: rotate(180deg);
}

.wv-settings-help-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  cursor: help;
}

.wv-settings-tool-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  align-self: stretch;
  border-radius: 12px;
  overflow: hidden;
}

.wv-settings-row {
  border: none;
  border-bottom: solid var(--weevar-dark, #111113);
  border-bottom-width: 1px;
  background: rgba(235, 235, 235, 0.05);
  color: #A4A4A4;
  padding: 11px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  cursor: pointer;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}

.wv-settings-row:last-child {
  border-bottom: none;
}

.wv-settings-toggle-svg {
  display: block;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.wv-settings-toggle-svg-on {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 1.5px rgba(53, 199, 89, 0.55));
}

.wv-settings-seg {
  display: flex;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(235, 235, 235, 0.04);
}

.wv-settings-seg-on,
.wv-settings-seg-off {
  flex: 1;
  width: 100%;
  padding: 8px 0;
  cursor: pointer;
  border: none;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  line-height: 100%;
}

.wv-settings-seg-off {
  background: rgba(235, 235, 235, 0.05);
  color: #A4A4A4;
  font-weight: 400;
}

.wv-settings-seg-on {
  background: #EBEBEB;
  color: var(--weevar-dark, #111113);
  font-weight: 500;
}

.wv-settings-foot {
  color: #58585d;
  font-size: 10px;
}

@keyframes wv-slide-in {
  from { transform: translateX(12px); opacity: 0.85; }
  to { transform: translateX(0); opacity: 1; }
}

/* Fixed slot next to dock: crossfade / slide when switching tray type */
.wv-tray-stack {
  position: fixed;
  width: 250px;
  height: 340px;
  z-index: 25;
  pointer-events: auto;
}
.wv-tray-stack-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(12px);
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
}
/* Hidden layers sit above the visible one in DOM order; .wv-pe on asides would still
   capture clicks unless every descendant is non-interactive. */
.wv-tray-stack-layer:not(.wv-tray-stack-layer--visible) * {
  pointer-events: none !important;
}
.wv-tray-stack-layer--visible {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
  animation: wv-tray-draw-out 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.wv-tray-stack .wv-summary-tray,
.wv-tray-stack .wv-prompt-drawer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  margin: 0;
  animation: none;
}

@keyframes wv-tray-draw-out {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.wv-prompt-header {
  font-size: 14px;
  font-weight: 600;
  color: #e8eaed;
}

.wv-schematic {
  height: 80px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: var(--wv-bg);
  overflow: hidden;
}

.wv-schematic-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 100%;
  padding: 8px;
}

.wv-schematic-col { flex: 1; min-width: 0; }
.wv-schematic-title { font-size: 10px; color: #9aa0a6; margin-bottom: 4px; }
.wv-schematic-row { display: flex; gap: 4px; flex-wrap: wrap; }
.wv-schematic-cell {
  flex: 1 1 18px;
  min-width: 18px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid var(--wv-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #c9cdd4;
  background: #12151c;
}
.wv-schematic-hot {
  border-color: var(--wv-accent);
  color: #e8eaed;
}
.wv-schematic-arrow { color: #9aa0a6; font-size: 12px; padding: 0 2px; }

.wv-tabs {
  display: flex;
  gap: 6px;
}
.wv-tab {
  flex: 1;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: var(--wv-bg);
  color: #c9cdd4;
  cursor: pointer;
  font-size: 12px;
}
.wv-tab-on {
  border-color: var(--wv-accent);
  color: #e8eaed;
}

.wv-prompt-body {
  flex: 1;
  min-height: 120px;
  max-height: 40vh;
  overflow: auto;
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: #0f1115;
  color: #e8eaed;
  font: 12px var(--wv-mono);
  white-space: pre-wrap;
}

.wv-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #9aa0a6;
}
.wv-select {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: var(--wv-bg);
  color: #e8eaed;
  padding: 0 8px;
}

.wv-prompt-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.wv-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: var(--wv-bg);
  color: #e8eaed;
  cursor: pointer;
  font-size: 12px;
}
.wv-btn-primary {
  background: var(--wv-accent);
  border-color: var(--wv-accent);
  color: #0b0d10;
  font-weight: 600;
}
.wv-btn-danger {
  border-color: rgba(255, 77, 79, 0.45);
  color: #ff8588;
}

.wv-drop-zone {
  position: fixed;
  pointer-events: none;
  border: 1px dashed rgba(0, 153, 255, 0.45);
  background: rgba(0, 153, 255, 0.06);
  z-index: 7;
  border-radius: 6px;
}

.wv-badge {
  position: fixed;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #35c759;
  color: #fff;
  border: none;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  pointer-events: none;
  z-index: 10;
}

.wv-toast {
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  max-width: min(420px, 92vw);
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid var(--wv-border);
  background: rgba(15, 17, 21, 0.95);
  color: #e8eaed;
  font-size: 12px;
  z-index: 40;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
}

.wv-fixed-hint {
  color: #ffb84d;
}

.wv-panel-note {
  font-size: 12px;
  color: #c9cdd4;
  border-left: 2px solid var(--wv-border);
  padding-left: 8px;
}

/* Figma overlay redesign overrides */
.wv-tool-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  padding: 14px;
  border: none;
  border-radius: 999px;
  background: var(--weevar-dark, #111113);
  color: #EBEBEB;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}
.wv-tool-button::after {
  content: attr(data-tooltip);
  position: absolute;
  z-index: 40;
  pointer-events: none;
  left: 50%;
  top: calc(100% - 4px);
  transform: translateX(-50%);
  display: inline-flex;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  background: #2D2D31;
  color: rgba(241, 241, 241, 0.7);
  text-align: center;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s ease;
}
.wv-tool-button[data-tooltip-align="left"]::after {
  left: 0;
  transform: none;
}
.wv-tool-button[data-tooltip-align="right"]::after {
  left: auto;
  right: 0;
  transform: none;
}
.wv-tool-button:hover::after {
  opacity: 1;
  visibility: visible;
  transition-delay: 1.6s;
}
.wv-tool-button[data-tooltip-suppress="true"]::after {
  opacity: 0 !important;
  visibility: hidden !important;
  transition-delay: 0s !important;
}
.wv-tool-button-logo { width: 18px; height: 18px; color: #EBEBEB; }
.wv-tool-button-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #35c759;
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  pointer-events: none;
  z-index: 12;
}

.wv-dock {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 26;
  pointer-events: auto;
}

.wv-toolbar {
  position: static;
  transform: none;
  width: 50px;
  height: 282px;
  border-radius: 100px;
  background: var(--weevar-dark, #111113);
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}
.wv-toolbar:active { cursor: grabbing; }

.wv-tool-icon {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #EBEBEB;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.wv-tool-icon-on { background: rgba(235, 235, 235, 0.08); color: #EBEBEB; }
.wv-tool-icon:hover:not(:disabled) { background: rgba(235, 235, 235, 0.08); color: #EBEBEB; }
.wv-tool-icon:disabled {
  opacity: 0.16;
  cursor: not-allowed;
}
.wv-tool-icon:disabled:hover {
  cursor: not-allowed;
}

.wv-toolbar-close {
  margin-left: 0;
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: none;
  background: var(--weevar-dark, #111113);
  color: #EBEBEB;
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}

.wv-tool-icon svg,
.wv-toolbar-close svg {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin: auto;
}

.wv-icon-pointer,
.wv-icon-prompt {
  width: 20px !important;
  height: 20px !important;
}

.wv-summary-tray,
.wv-prompt-drawer {
  position: fixed;
  right: 78px;
  bottom: 20px;
  width: 250px;
  height: 340px;
  border-radius: 24px;
  background: var(--weevar-dark, #111113);
  border: 1px solid rgba(235, 235, 235,0.04);
  padding: 8px 0 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 25;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}

.wv-tray-head,
.wv-tray-foot {
  flex: 0 0 auto;
  height: 24px;
  padding: 6px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--weevar-grey200, #58585D);
  font: 400 10px Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
.wv-tray-head,
.wv-tray-foot {
  position: relative;
}
.wv-tray-head {
  margin-bottom: 6px;
}
.wv-tray-foot {
  margin-top: 6px;
}
.wv-tray-head::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  border-bottom: 1px solid var(--weevar-transparent, rgba(235, 235, 235, 0.05));
}
.wv-tray-foot::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -6px;
  border-top: 1px solid var(--weevar-transparent, rgba(235, 235, 235, 0.05));
}
.wv-tray-logo { color: #EBEBEB; display: block; width: 48px; height: 10px; }
.wv-tray-hide-icon { display: block; width: 12px; height: 12px; color: #58585d; }
.wv-tray-hide-btn {
  border: none;
  background: transparent;
  padding: 0;
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #58585d;
  cursor: pointer;
}

.wv-toolbar-tooltip {
  position: fixed;
  z-index: 40;
  pointer-events: none;
  display: inline-flex;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  background: #2D2D31;
  color: rgba(241, 241, 241, 0.7);
  text-align: center;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}

.wv-settings-helper-tooltip {
  position: fixed;
  z-index: 41;
  pointer-events: none;
  transform: translateY(-50%);
  display: flex;
  width: 140px;
  padding: 5px 10px;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background: #2D2D31;
  color: rgba(241, 241, 241, 0.7);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1);
}
.wv-tray-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 2px;
}
.wv-tray-content-summary {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 16px 16px 16px;
  box-sizing: border-box;
}
.wv-summary-content {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}
.wv-summary-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1;
  align-items: flex-start;
  width: 100%;
}
.wv-summary-kicker {
  color: #868689;
  text-align: left;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  width: 100%;
}
.wv-summary-title {
  color: #EBEBEB;
  text-align: left;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  width: 100%;
}
.wv-summary-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0;
}
.wv-tray-content-selection {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
  padding: 14px 16px;
  box-sizing: border-box;
}
.wv-tray-content-selection .wv-tray-card {
  margin: 0;
}
.wv-selection-path-card {
  flex: 0 0 auto;
  padding: 10px;
  display: flex;
  align-items: center;
  min-width: 0;
}
.wv-selection-path-card .wv-selection-path-text {
  display: block;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--weevar-grey300, #868689);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%;
}
.wv-selection-css-card {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.wv-selection-css-scroll-wrap {
  position: relative;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.wv-selection-css-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 0;
  box-sizing: border-box;
  scrollbar-width: none;
}
.wv-selection-css-scroll::-webkit-scrollbar {
  width: 0;
}
.wv-selection-css-line {
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 170%;
  margin-bottom: 6px;
  padding: 0 10px;
  word-break: break-word;
}
.wv-selection-css-line:first-child { padding-top: 10px; }
.wv-selection-css-line:last-child { padding-bottom: 10px; margin-bottom: 0; }
.wv-selection-css-key { color: #AAA0FA; }
.wv-selection-css-value { color: #868689; }
.wv-selection-css-sep { color: #868689; }
.wv-selection-css-key,
.wv-selection-css-value,
.wv-selection-css-sep {
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px !important;
  font-style: normal !important;
  font-weight: 400 !important;
  line-height: 170% !important;
}
.wv-tray-foot span {
  color: var(--weevar-grey200, #58585D);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}
.wv-tray-card {
  margin: 12px 16px 0;
  border-radius: 12px;
  background: rgba(235, 235, 235,0.05);
  min-height: 0;
}
.wv-overview-card {
  height: 110px;
  border-radius: 12px;
  background: transparent;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  margin: 0;
  width: 100%;
}
.wv-overview-divider {
  width: 1px;
  margin: 0;
  background: #111113;
  z-index: 1;
}
.wv-overview-stat {
  background: #18181A;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 14px 18px;
  gap: 0;
  z-index: 1;
}
.wv-overview-orb {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #3C3C41;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.wv-overview-orb--moved {
  position: relative;
}
.wv-overview-orb--moved::before {
  content: "";
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #35C759;
}
.wv-overview-orb-value {
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111113;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 100%;
}
.wv-overview-orb--tool svg {
  width: 32px;
  height: 32px;
}
.wv-overview-orb--tool::before {
  content: "";
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #FFCC02;
}
.wv-overview-orb--tool {
  position: relative;
}
.wv-overview-orb--tool svg {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  display: block;
}
.wv-overview-label {
  color: var(--weevar-grey300, #868689);
  text-align: center;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  white-space: nowrap;
}
.wv-doc-card {
  margin: 0;
  flex: 0 0 auto;
  border-radius: 12px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  color: #EBEBEB;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  line-height: 100%;
}
.wv-doc-icon {
  width: 24px;
  height: 30px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.wv-doc-icon svg { width: 24px; height: 30px; display: block; }
.wv-doc-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}
.wv-doc-title {
  color: #EBEBEB;
  text-align: left;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}
.wv-doc-site {
  color: #868689;
  text-align: left;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}
.wv-doc-go {
  margin-left: auto;
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 30px;
  padding: 4px;
  border: none;
  border-radius: 999px;
  background: rgba(235, 235, 235,0.1);
  color: #EBEBEB;
  display: grid;
  place-items: center;
  line-height: 0;
  cursor: pointer;
  flex-shrink: 0;
}
.wv-doc-go svg {
  width: 14px;
  height: 14px;
  display: block;
  color: #EBEBEB;
}

.wv-prompt-drawer {
  top: auto;
  left: auto;
  bottom: 20px;
}
.wv-prompt-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.wv-prompt-drawer .wv-tray-content {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 14px;
  padding-bottom: 14px;
}
.wv-prompt-drawer .wv-tray-head {
  margin-bottom: 0;
}
.wv-prompt-drawer .wv-tray-foot {
  margin-top: 0;
}
.wv-prompt-card {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 12px;
  background: rgba(235, 235, 235,0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.wv-prompt-card-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 10px;
  padding-right: 0;
  padding-bottom: 10px;
  padding-left: 10px;
  box-sizing: border-box;
  scrollbar-width: none;
}
.wv-prompt-card-scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.wv-prompt-scrollbar {
  position: absolute;
  top: 0;
  right: 2px;
  bottom: 0;
  width: 4px;
  pointer-events: none;
}
.wv-prompt-scrollbar-thumb {
  position: absolute;
  right: 0;
  width: 4px;
  border-radius: 999px;
  background: #111113;
}
.wv-prompt-card-title {
  color: #EBEBEB;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 100%;
  margin-bottom: 12px;
  padding-right: 10px;
}
.wv-prompt-card-body {
  margin: 0;
  padding-right: 10px;
  color: #868689;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 170%;
}
.wv-prompt-copy-btn {
  flex: 0 0 auto;
  padding: 8px 0;
  border-radius: 999px;
  border: none;
  background: rgba(235, 235, 235,0.05);
  color: #EBEBEB;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
  cursor: pointer;
}
.wv-prompt-copy-btn:disabled {
  color: #EBEBEB;
  opacity: 0.35;
  cursor: not-allowed;
}
.wv-prompt-copy-btn:disabled:hover {
  cursor: not-allowed;
}
.wv-prompt-copy-btn.wv-prompt-copy-btn-on {
  color: var(--weevar-green, #7be5a3);
}
.wv-prompt-copy-btn svg {
  width: 12px;
  height: 12px;
}
.wv-prompt-copy-btn span {
  color: inherit;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 100%;
}

.wv-badge {
  background: #35c759;
  color: #fff;
  border: none;
  width: 22px;
  height: 22px;
  line-height: 22px;
  z-index: 12;
}

/* Final Figma polish overrides */
:root { --wv-accent: #7be5a3; }
.wv-outline {
  border-radius: 4px !important;
  border: 1.5px solid var(--weevar-green, #7BE5A3) !important;
  background: rgba(123, 229, 163, 0.04) !important;
}
.wv-outline-selected {
  border-radius: 4px !important;
  border: 1.5px solid var(--weevar-green, #7BE5A3) !important;
  background: rgba(123, 229, 163, 0.04) !important;
}
.wv-label { background: rgba(22, 22, 30, 0.9); border: none; border-radius: 8px; padding: 5px 10px; color: #EBEBEB; }
.wv-drag-handle { background: rgba(22, 22, 30, 0.9); border: none; border-radius: 8px; }
.wv-handle-grid { background-image: radial-gradient(circle, #EBEBEB 1px, transparent 1px); }
.wv-toast { background: rgba(22, 22, 30, 0.96); border: none; border-radius: 10px; color: #EBEBEB; }
.wv-tool-icon { color: #d6d6da; }
.wv-tool-icon-on { background: rgba(235, 235, 235, 0.08); color: #EBEBEB; }
.wv-tool-icon:hover:not(:disabled) { background: rgba(235, 235, 235, 0.08); color: #EBEBEB; }
.wv-tool-icon:disabled {
  opacity: 0.16;
  cursor: not-allowed;
}
.wv-tool-icon:disabled:hover {
  cursor: not-allowed;
}
.wv-summary-tray, .wv-prompt-drawer { border: none; }
.wv-tray-head .wv-tray-logo { width: 48px; height: 10px; }
.wv-doc-card { font-size: 12px; }
.wv-prompt-header { display: block; margin: 0 16px; font-size: 12px; font-weight: 400; color: #EBEBEB; }
.wv-tabs { display: none; }
.wv-field { display: none; }
.wv-prompt-actions { display: grid; grid-template-columns: 1fr; margin: 0 16px; }
.wv-btn { border-radius: 999px; border: none; background: rgba(235, 235, 235,0.05); color: #EBEBEB; height: 28px; font-size: 10px; }
.wv-btn:not(.wv-btn-primary), .wv-btn-danger { display: none; }
.wv-btn-primary { font-weight: 400; }
`;
