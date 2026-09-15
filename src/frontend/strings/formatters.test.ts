import { describe, expect, it } from "vitest";
import { BATCH_PAGE, GENERATE_PAGE } from "./ja.js";

describe("GENERATE_PAGE.charCount", () => {
  it("入力文字数と上限をスラッシュ区切りで表示する", () => {
    expect(GENERATE_PAGE.charCount(0, 60)).toBe("0 / 60文字");
    expect(GENERATE_PAGE.charCount(42, 60)).toBe("42 / 60文字");
  });
});

describe("BATCH_PAGE 文言", () => {
  it("上限50行の案内文言を含む", () => {
    expect(BATCH_PAGE.formatNotice).toContain("50行");
  });
});
