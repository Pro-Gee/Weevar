import { describe, expect, it } from "vitest";
import { formatNumberMax2, roundTo2 } from "./roundNumber";

describe("roundTo2", () => {
  it("rounds to at most 2 decimal places", () => {
    expect(roundTo2(10.126)).toBe(10.13);
    expect(roundTo2(10.124)).toBe(10.12);
    expect(roundTo2(10.1)).toBe(10.1);
    expect(roundTo2(10)).toBe(10);
  });
});

describe("formatNumberMax2", () => {
  it("formats without trailing zeros beyond 2 decimals", () => {
    expect(formatNumberMax2(10)).toBe("10");
    expect(formatNumberMax2(10.5)).toBe("10.5");
    expect(formatNumberMax2(10.12)).toBe("10.12");
    expect(formatNumberMax2(10.126)).toBe("10.13");
  });
});
