import { bench, describe } from "vitest";
import type { ElementIdentity } from "./layoutTypes";
import { resolveElementIdentity } from "./resolveIdentity";

function buildDomAndIdentity(): ElementIdentity {
  document.body.replaceChildren();
  const wrap = document.createElement("div");
  for (let i = 0; i < 400; i++) {
    const b = document.createElement("button");
    b.textContent = `n${i}`;
    wrap.appendChild(b);
  }
  const target = document.createElement("button");
  target.textContent = "needle";
  wrap.appendChild(target);
  document.body.appendChild(wrap);

  const text = (target.textContent ?? "").trim().slice(0, 120);
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return {
    domPath: [],
    tag: "button",
    classList: [],
    contentHash: String(h),
    label: "button",
  };
}

describe("resolveElementIdentity", () => {
  bench("content-scan path (~400 siblings + needle)", () => {
    const identity = buildDomAndIdentity();
    resolveElementIdentity(identity);
  });
});
