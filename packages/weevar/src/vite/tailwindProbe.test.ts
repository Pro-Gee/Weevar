import { describe, expect, it } from "vitest";
import { extractContentGlobsFromTailwindSource } from "./tailwindProbe";

describe("extractContentGlobsFromTailwindSource", () => {
  it("reads string literals from a content array", () => {
    const src = `export default { content: ["./app/**/*.{ts,tsx}", './src/**'] }`;
    expect(extractContentGlobsFromTailwindSource(src)).toEqual([
      "./app/**/*.{ts,tsx}",
      "./src/**",
    ]);
  });
});
