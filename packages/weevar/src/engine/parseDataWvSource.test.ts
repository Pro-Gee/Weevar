import { describe, expect, it } from "vitest";
import { encodeDataWvSource, parseDataWvSource } from "./parseDataWvSource";

describe("parseDataWvSource", () => {
  it("roundtrips file/line/col via data-wv-source", () => {
    const loc = { file: "src/App.tsx", line: 42, col: 3 };
    const el = document.createElement("div");
    el.setAttribute("data-wv-source", encodeDataWvSource(loc));
    expect(parseDataWvSource(el)).toEqual(loc);
  });
});
