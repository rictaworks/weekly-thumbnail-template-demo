import { describe, expect, it } from "vitest";
import { contrastRatio, grayscaleContrastRatio } from "./color.js";
import { PALETTE } from "../master/palette.js";

describe("contrastRatio", () => {
  it("主文字(白)と帯色のコントラストは7:1以上", () => {
    expect(contrastRatio(PALETTE.primaryText, PALETTE.band)).toBeGreaterThanOrEqual(7);
  });

  it("アクセント色と背景色のコントラストは4.5:1以上", () => {
    expect(contrastRatio(PALETTE.accent, PALETTE.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("同一色のコントラストは1", () => {
    expect(contrastRatio("#000000", "#000000")).toBeCloseTo(1);
  });
});

describe("grayscaleContrastRatio", () => {
  it("グレースケール変換後も主文字と帯色のコントラストが3:1以上", () => {
    expect(grayscaleContrastRatio(PALETTE.primaryText, PALETTE.band)).toBeGreaterThanOrEqual(3);
  });

  it("グレースケール変換後もアクセントと背景色のコントラストが3:1以上", () => {
    expect(grayscaleContrastRatio(PALETTE.accent, PALETTE.background)).toBeGreaterThanOrEqual(3);
  });
});
