import { describe, expect, it } from "vitest";
import { buildExportFileName } from "./fileNameBuilder.js";

describe("buildExportFileName", () => {
  it("テンプレートコード・ゼロ埋め3桁週番号・改訂番号から組み立てる", () => {
    expect(buildExportFileName("T01", 12, 1)).toBe("T01_012_r1.png");
  });

  it("週番号が100以上でも3桁のまま(超過分はそのまま表示)", () => {
    expect(buildExportFileName("T02", 999, 3)).toBe("T02_999_r3.png");
  });

  it("話題の文字列を一切含まない", () => {
    const fileName = buildExportFileName("T03", 1, 1);
    expect(fileName).not.toMatch(/[^\x00-\x7F]/);
  });

  it("同一週番号でも改訂番号が異なれば別ファイル名になる", () => {
    expect(buildExportFileName("T01", 5, 1)).not.toBe(buildExportFileName("T01", 5, 2));
  });
});
