type Bar = { left: number; top: number; width: number; height: number };

export function insertionBarBetween(
  ordered: globalThis.Element[],
  insertBeforeIndex: number,
  row: boolean,
): Bar | null {
  if (ordered.length === 0) return null;
  const thick = 3;
  const pad = 2;

  if (insertBeforeIndex <= 0) {
    const r = ordered[0]!.getBoundingClientRect();
    if (row) {
      return {
        left: r.left - thick - 2,
        top: r.top - pad,
        width: thick,
        height: r.height + pad * 2,
      };
    }
    return {
      left: r.left - pad,
      top: r.top - thick - 2,
      width: r.width + pad * 2,
      height: thick,
    };
  }

  if (insertBeforeIndex >= ordered.length) {
    const r = ordered[ordered.length - 1]!.getBoundingClientRect();
    if (row) {
      return {
        left: r.right + 2,
        top: r.top - pad,
        width: thick,
        height: r.height + pad * 2,
      };
    }
    return {
      left: r.left - pad,
      top: r.bottom + 2,
      width: r.width + pad * 2,
      height: thick,
    };
  }

  const r0 = ordered[insertBeforeIndex - 1]!.getBoundingClientRect();
  const r1 = ordered[insertBeforeIndex]!.getBoundingClientRect();
  if (row) {
    const mid = (r0.right + r1.left) / 2;
    const top = Math.min(r0.top, r1.top) - pad;
    const bottom = Math.max(r0.bottom, r1.bottom) + pad;
    return { left: mid - thick / 2, top, width: thick, height: bottom - top };
  }
  const mid = (r0.bottom + r1.top) / 2;
  const left = Math.min(r0.left, r1.left) - pad;
  const right = Math.max(r0.right, r1.right) + pad;
  return { left, top: mid - thick / 2, width: right - left, height: thick };
}
