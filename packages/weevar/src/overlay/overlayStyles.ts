/** Injected into Shadow DOM (PRD/TRD visual spec) */
export const OVERLAY_CSS = `
:root {
  --wv-bg: #0f1115;
  --wv-panel: #1a1d24;
  --wv-border: #2a2e38;
  --wv-accent: #0099ff;
  --wv-success: #00c896;
  --wv-danger: #ff4d4f;
  --wv-ui: 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --wv-mono: 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

* { box-sizing: border-box; }

.wv-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font: var(--wv-ui);
  color: #e8eaed;
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
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--wv-border);
  background: var(--wv-panel);
  pointer-events: auto;
  cursor: grab;
  z-index: 6;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.wv-drag-handle:active { cursor: grabbing; }

.wv-handle-grid {
  width: 10px;
  height: 10px;
  background-image: radial-gradient(circle, #9aa0a6 1px, transparent 1px);
  background-size: 4px 4px;
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

@keyframes wv-slide-in {
  from { transform: translateX(12px); opacity: 0.85; }
  to { transform: translateX(0); opacity: 1; }
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
`;
