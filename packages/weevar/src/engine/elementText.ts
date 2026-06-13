/** Tags whose visible label should come from direct text, not descendant content. */
export const TEXT_LIKE_TAGS = new Set([
  "p",
  "span",
  "a",
  "label",
  "small",
  "strong",
  "em",
  "b",
  "i",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "blockquote",
  "code",
  "pre",
  "button",
  "figcaption",
]);

export function isTextLikeTag(tag: string): boolean {
  return TEXT_LIKE_TAGS.has(tag.toLowerCase());
}

/** Text from direct child text nodes only (excludes nested element text). */
export function directTextContent(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent ?? "")
    .join("")
    .trim();
}
