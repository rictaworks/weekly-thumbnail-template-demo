import { describe, expect, it } from "vitest";
import { checkCharset } from "./charsetGuard.js";

describe("checkCharset", () => {
  it("収録文字のみの場合は指摘が空になる", () => {
    expect(checkCharset("こんにちは週報です")).toEqual([]);
  });

  it("未収録文字を検出し位置とともに指摘する", () => {
    const findings = checkCharset("あ😀い");
    expect(findings).toHaveLength(1);
    expect(findings[0]?.detail).toContain("😀");
    expect(findings[0]?.detail).toContain("2");
  });

  it("複数の未収録文字をすべて検出する", () => {
    const findings = checkCharset("😀a🎉");
    expect(findings).toHaveLength(2);
  });
});
