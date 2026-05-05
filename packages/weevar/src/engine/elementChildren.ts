export function elementChildren(parent: Element): Element[] {
  return Array.from(parent.children).filter(
    (n): n is Element => n.nodeType === Node.ELEMENT_NODE,
  );
}
