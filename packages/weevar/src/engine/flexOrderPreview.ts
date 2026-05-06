const ORDER_PROP = "order";

export class FlexOrderPreview {
  private readonly previous = new Map<Element, string | null>();

  apply(ordered: Element[]): void {
    ordered.forEach((el, i) => {
      const hel = el as HTMLElement;
      const desired = String(i);
      const current = hel.style.getPropertyValue(ORDER_PROP);
      if (current === desired) return;
      if (!this.previous.has(el)) {
        this.previous.set(el, hel.style.getPropertyValue(ORDER_PROP));
      }
      hel.style.setProperty(ORDER_PROP, desired);
    });
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
