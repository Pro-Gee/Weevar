import { describe, expect, it } from "vitest";
import { transformJsxWithWeevarSourceSwc } from "./transformJsxSource";

describe("transformJsxWithWeevarSourceSwc", () => {
  it("injects data-wv-source into JSX", () => {
    const code = `export function A() { return <div>hi</div>; }\n`;
    const out = transformJsxWithWeevarSourceSwc(code, "/app/src/A.tsx", "/app");
    expect(out?.code).toBeTruthy();
    expect(out!.code).toContain("data-wv-source");
  });
});
