const ORDER_PROP = "order";

export class FlexOrderPreview {
  private readonly previous = new Map<Element, string | null>();

  /**
   * @param outOfFlow Element pulled out of the flex layout (e.g. during drag) — skipped for `order` so siblings reflow immediately.
   */
  apply(ordered: Element[], outOfFlow?: Element): void {
    let index = 0;
    for (const el of ordered) {
      if (el === outOfFlow) continue;
      const hel = el as HTMLElement;
      const desired = String(index++);
      const current = hel.style.getPropertyValue(ORDER_PROP);
      if (current === desired) continue;
      if (!this.previous.has(el)) {
        this.previous.set(el, hel.style.getPropertyValue(ORDER_PROP));
      }
      hel.style.setProperty(ORDER_PROP, desired);
    }
    if (outOfFlow instanceof HTMLElement) {
      if (!this.previous.has(outOfFlow)) {
        this.previous.set(outOfFlow, outOfFlow.style.getPropertyValue(ORDER_PROP));
      }
      outOfFlow.style.removeProperty(ORDER_PROP);
    }
  }

  clear(): void {
    for (const [el, prev] of this.previous) {
      const hel = el as HTMLElement;
      if (prev === null || prev === "") hel.style.removeProperty(ORDER_PROP);
      else hel.style.setProperty(ORDER_PROP, prev);
    }
    this.previous.clear();
  }
}
