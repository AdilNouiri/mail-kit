import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "../src/contrast.ts";

describe("F1.4 WCAG contrast", () => {
  it("gives 21 for black on white and 1 for equal colours, in either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("matches the published value for #767676 on white (4.54)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("computes relative luminance of the primaries", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 4);
    expect(relativeLuminance("#00ff00")).toBeCloseTo(0.7152, 4);
    expect(relativeLuminance("#0000ff")).toBeCloseTo(0.0722, 4);
  });

  it("reads upper and lower case hex alike", () => {
    expect(contrastRatio("#C8372D", "#FFFFFF")).toBe(contrastRatio("#c8372d", "#ffffff"));
  });
});
