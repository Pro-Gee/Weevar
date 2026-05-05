export function isFixedOrSticky(el: Element): boolean {
  const p = getComputedStyle(el).position;
  return p === "fixed" || p === "sticky";
}
