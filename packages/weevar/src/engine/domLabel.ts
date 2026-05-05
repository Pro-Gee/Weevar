/** Label for hover: `div.flex.gap-4` style (PRD A.3) */
export function getDomLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const classes = (el as HTMLElement).classList;
  if (!classes || classes.length === 0) return tag;
  const parts = [tag];
  for (let i = 0; i < classes.length; i++) {
    parts.push(classes[i]!);
    if (parts.join(".").length > 48) break;
  }
  return parts.join(".");
}
