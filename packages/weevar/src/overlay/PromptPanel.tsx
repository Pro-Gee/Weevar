import type {
  GeneratedPrompt,
  LayoutChange,
  PromptLength,
  TargetTool,
  WeevarRuntimeConfig,
} from "../engine/layoutTypes";
import { reorderImmutable } from "../engine/reorderTarget";
import { promptBody } from "../engine/prompts";

type Props = {
  change: LayoutChange;
  prompt: GeneratedPrompt;
  promptLen: PromptLength;
  runtimeConfig?: WeevarRuntimeConfig;
  onPromptLen: (v: PromptLength) => void;
  tool: TargetTool;
  onTool: (v: TargetTool) => void;
  onCopy: () => void | Promise<void>;
  onRegenerate: () => void;
  onDiscard: () => void;
  copyFlash: boolean;
};

export function PromptPanel({
  change,
  prompt,
  promptLen,
  runtimeConfig: _runtimeConfig,
  onPromptLen,
  tool,
  onTool,
  onCopy,
  onRegenerate,
  onDiscard,
  copyFlash,
}: Props) {
  void _runtimeConfig; // reserved for future panel-local template hooks
  const header =
    change.kind === "reorder"
      ? `Reorder within <${change.parent.label || change.parent.tag}>`
      : `Move into <${change.toParent.label || change.toParent.tag}>`;

  const body = promptBody(prompt, promptLen);

  return (
    <aside className="wv-prompt-drawer wv-pe" role="dialog" aria-label="Generated prompt">
      <div className="wv-prompt-header">{header}</div>
      <div className="wv-schematic" aria-hidden>
        <Schematic change={change} />
      </div>
      <div className="wv-tabs">
        <button
          type="button"
          className={promptLen === "short" ? "wv-tab wv-tab-on" : "wv-tab"}
          onClick={() => onPromptLen("short")}
        >
          Short
        </button>
        <button
          type="button"
          className={promptLen === "detailed" ? "wv-tab wv-tab-on" : "wv-tab"}
          onClick={() => onPromptLen("detailed")}
        >
          Detailed
        </button>
      </div>
      <pre className="wv-prompt-body">{body}</pre>
      <label className="wv-field">
        <span>Target</span>
        <select
          className="wv-select"
          value={tool}
          onChange={(e) => onTool(e.target.value as TargetTool)}
        >
          <option value="claude-code">Claude Code</option>
          <option value="codex">Codex</option>
          <option value="generic">Generic</option>
        </select>
      </label>
      <div className="wv-prompt-actions">
        <button type="button" className="wv-btn wv-btn-primary" onClick={() => void onCopy()}>
          {copyFlash ? "Copied" : "Copy"}
        </button>
        <button type="button" className="wv-btn" onClick={onRegenerate}>
          Regenerate
        </button>
        <button type="button" className="wv-btn wv-btn-danger" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </aside>
  );
}

function Schematic({ change }: { change: LayoutChange }) {
  if (change.kind === "reorder") {
    const from = change.fromIndex;
    const to = change.toIndex;
    const after = change.siblings;
    const before = reorderImmutable(after, to, from);
    return (
      <div className="wv-schematic-inner">
        <div className="wv-schematic-col">
          <div className="wv-schematic-title">Before</div>
          <div className="wv-schematic-row">
            {before.map((s, i) => (
              <div
                key={`b-${i}-${s.label}`}
                className={
                  i === from ? "wv-schematic-cell wv-schematic-hot" : "wv-schematic-cell"
                }
                title={s.label}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="wv-schematic-arrow">→</div>
        <div className="wv-schematic-col">
          <div className="wv-schematic-title">After</div>
          <div className="wv-schematic-row">
            {after.map((s, i) => (
              <div
                key={`a-${i}-${s.label}`}
                className={
                  i === to ? "wv-schematic-cell wv-schematic-hot" : "wv-schematic-cell"
                }
                title={s.label}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wv-schematic-inner">
      <div className="wv-schematic-col">
        <div className="wv-schematic-title">From</div>
        <div className="wv-schematic-row">
          <div className="wv-schematic-cell wv-schematic-hot" title={change.fromParent.label}>
            {change.fromParent.componentName || change.fromParent.tag}
          </div>
        </div>
      </div>
      <div className="wv-schematic-arrow">→</div>
      <div className="wv-schematic-col">
        <div className="wv-schematic-title">To</div>
        <div className="wv-schematic-row">
          <div className="wv-schematic-cell wv-schematic-hot" title={change.toParent.label}>
            {change.toParent.componentName || change.toParent.tag}
          </div>
        </div>
      </div>
    </div>
  );
}
