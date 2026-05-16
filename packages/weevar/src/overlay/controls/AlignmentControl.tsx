type AlignValue = "flex-start" | "center" | "flex-end";

type AlignmentControlProps = {
  justifyContent: string;
  alignItems: string;
  /** Called with the new justify-content value. */
  onJustifyCommit: (v: string) => void;
  /** Called with the new align-items value. */
  onAlignCommit: (v: string) => void;
};

// 3×3 grid: each cell is [justifyContent, alignItems]
const GRID: Array<[AlignValue, AlignValue]> = [
  ["flex-start", "flex-start"], ["center", "flex-start"], ["flex-end", "flex-start"],
  ["flex-start", "center"],     ["center", "center"],     ["flex-end", "center"],
  ["flex-start", "flex-end"],   ["center", "flex-end"],   ["flex-end", "flex-end"],
];

// Small dot pattern for each cell showing where content sits
function AlignIcon({ justify, align }: { justify: AlignValue; align: AlignValue }) {
  const col = justify === "flex-start" ? 0 : justify === "center" ? 1 : 2;
  const row = align   === "flex-start" ? 0 : align   === "center" ? 1 : 2;

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => {
          const active = r === row && c === col;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * 6 + 1}
              y={r * 6 + 1}
              width={active ? 4 : 3}
              height={active ? 4 : 3}
              rx="0.75"
              fill={active ? "currentColor" : "currentColor"}
              opacity={active ? 1 : 0.25}
            />
          );
        })
      )}
    </svg>
  );
}

export function AlignmentControl({
  justifyContent,
  alignItems,
  onJustifyCommit,
  onAlignCommit,
}: AlignmentControlProps) {
  const isActive = (j: AlignValue, a: AlignValue) =>
    justifyContent === j && alignItems === a;

  return (
    <div className="wv-alignment-grid wv-pe">
      {GRID.map(([j, a]) => (
        <button
          key={`${j}-${a}`}
          type="button"
          className={`wv-alignment-cell wv-pe${isActive(j, a) ? " wv-alignment-cell--active" : ""}`}
          title={`justify: ${j} / align: ${a}`}
          onPointerDown={(e) => {
            e.preventDefault();
            onJustifyCommit(j);
            onAlignCommit(a);
          }}
        >
          <AlignIcon justify={j} align={a} />
        </button>
      ))}
    </div>
  );
}
