import { describe, expect, it } from "vitest";
import { pairedDimension } from "./DimensionControl";

describe("pairedDimension", () => {
  it("scales height when width changes at 2:1 ratio", () => {
    expect(pairedDimension("width", 200, 2)).toEqual({
      width: "200px",
      height: "100px",
    });
  });

  it("scales width when height changes at 2:1 ratio", () => {
    expect(pairedDimension("height", 50, 2)).toEqual({
      width: "100px",
      height: "50px",
    });
  });
});
