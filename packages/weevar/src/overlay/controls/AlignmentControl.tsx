import { ALIGNMENT_GRID_ICONS, AlignCellDot } from "./alignmentIcons";
import {
  ARRANGEMENT_VISUAL_GRID,
  arrangementCssFromVisual,
  findActiveArrangementIndex,
} from "./arrangementMapping";

type AlignmentControlProps = {
  justifyContent: string;
  alignItems: string;
  flexDirection: string;
  /** Called with the new justify-content value. */
  onJustifyCommit: (v: string) => void;
  /** Called with the new align-items value. */
  onAlignCommit: (v: string) => void;
};

const ALIGN_LABELS = [
  "Top left",
  "Top center",
  "Top right",
  "Center left",
  "Center",
  "Center right",
  "Bottom left",
  "Bottom center",
  "Bottom right",
] as const;

export function AlignmentControl({
  justifyContent,
  alignItems,
  flexDirection,
  onJustifyCommit,
  onAlignCommit,
}: AlignmentControlProps) {
  const activeIndex = findActiveArrangementIndex(
    justifyContent,
    alignItems,
    flexDirection,
  );

  return (
    <div className="wv-alignment-grid wv-pe" role="group" aria-label="Arrangement">
      {ARRANGEMENT_VISUAL_GRID.map(([vx, vy], index) => {
        const Icon = ALIGNMENT_GRID_ICONS[index];
        const active = index === activeIndex;
        return (
          <button
            key={`${vx}-${vy}`}
            type="button"
            className={`wv-alignment-cell wv-pe${active ? " wv-alignment-cell--active" : ""}`}
            aria-label={ALIGN_LABELS[index]}
            aria-pressed={active}
            onPointerDown={(e) => {
              e.preventDefault();
              const css = arrangementCssFromVisual(vx, vy, flexDirection);
              onJustifyCommit(css.justifyContent);
              onAlignCommit(css.alignItems);
            }}
          >
            {active ? <Icon /> : <AlignCellDot />}
          </button>
        );
      })}
    </div>
  );
}
