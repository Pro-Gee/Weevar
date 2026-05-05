import { beforeEach, describe, expect, it } from "vitest";
import { encodeDataWvSource } from "./parseDataWvSource";
import type { ElementIdentity } from "./layoutTypes";
import { resolveElementIdentity } from "./resolveIdentity";

function id(
  partial: Pick<ElementIdentity, "tag" | "contentHash" | "domPath"> &
    Partial<ElementIdentity>,
): ElementIdentity {
  return {
    domPath: partial.domPath,
    tag: partial.tag,
    classList: partial.classList ?? [],
    contentHash: partial.contentHash,
    label: partial.label ?? partial.tag,
    source: partial.source,
    fiberPath: partial.fiberPath,
  };
}

describe("resolveElementIdentity", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves by data-wv-source first", () => {
    const loc = { file: "x.tsx", line: 2, col: 0 };
    document.body.innerHTML = `<div id="a" data-wv-source="${encodeDataWvSource(loc)}">ok</div>`;
    const el = document.getElementById("a")!;
    const text = (el.textContent ?? "").trim().slice(0, 120);
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    const identity = id({
      tag: "div",
      contentHash: String(h),
      domPath: [],
      source: loc,
    });
    expect(resolveElementIdentity(identity)).toBe(el);
  });

  it("falls back to DOM path when source misses", () => {
    document.body.innerHTML = `<main id="m"><section><button type="button" id="btn">Hi</button></section></main>`;
    const btn = document.getElementById("btn")!;
    const text = (btn.textContent ?? "").trim().slice(0, 120);
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;

    const domPath = [
      { tag: "main", index: 0, classes: [] as string[] },
      { tag: "section", index: 0, classes: [] as string[] },
      { tag: "button", index: 0, classes: [] as string[] },
    ];
    const identity = id({
      tag: "button",
      contentHash: String(h),
      domPath,
    });
    expect(resolveElementIdentity(identity)).toBe(btn);
  });

  it("content-scan finds matching tag and hash", () => {
    document.body.innerHTML = `<div><span id="x">unique-label-xyz</span></div>`;
    const span = document.getElementById("x")!;
    const text = (span.textContent ?? "").trim().slice(0, 120);
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    const identity = id({
      tag: "span",
      contentHash: String(h),
      domPath: [{ tag: "main", index: 99, classes: [] }],
      classList: [],
    });
    expect(resolveElementIdentity(identity)).toBe(span);
  });
});
