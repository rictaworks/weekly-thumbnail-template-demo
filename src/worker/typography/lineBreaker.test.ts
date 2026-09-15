import { describe, expect, it } from "vitest";
import { breakLines } from "./lineBreaker.js";

describe("breakLines", () => {
  it("枠幅に収まる短文は1行になる", () => {
    const result = breakLines("こんにちは", 1000, 64, 0.02);
    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["こんにちは"]);
  });

  it("明示改行で段落を分け、段落をまたいで結合しない", () => {
    const result = breakLines("あいう\nえお", 1000, 32, 0);
    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["あいう", "えお"]);
  });

  it("枠幅を超える直前で分割する", () => {
    // 全角=32pxとして、frameWidth=100なら3文字目までしか入らない(3*32=96<=100, 4*32=128>100)
    const result = breakLines("あいうえお", 100, 32, 0);
    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["あいう", "えお"]);
  });

  it("行頭禁則文字は前方へ戻して回避する", () => {
    // 「あいう」の後に「。」が来る場合、「。」だけが次行頭に来るのを避けハンギングで同行に含める
    const result = breakLines("あいう。えお", 96, 32, 0);
    expect(result.fits).toBe(true);
    expect(result.lines[0]).toContain("。");
  });

  it("最小サイズでも収まらない場合は不適合として扱う", () => {
    const result = breakLines("あ", 10, 32, 0);
    expect(result.fits).toBe(false);
  });

  it("同一入力からは常に同一の分割結果になる(決定性)", () => {
    const input = "週次のお知らせです。今週のテーマは秋の味覚について。";
    const first = breakLines(input, 900, 40, 0.02);
    const second = breakLines(input, 900, 40, 0.02);
    expect(first).toEqual(second);
  });

  it("分離禁止：連続する半角英数字の連なりの内部では分割せず前方の空白まで戻る", () => {
    // 半角=10pxなので frameWidth=55は5.5文字分。自然な分割候補は "12345" の内部(1,2,3の後)に来るが、
    // 数字の連なりを割らないよう前方の空白の位置まで戻る
    const result = breakLines("AB 12345", 55, 20, 0);
    expect(result.fits).toBe(true);
    expect(result.lines).toEqual(["AB ", "12345"]);
  });

  it("分離禁止規則により前方へ戻せる位置が無い場合は不適合とする", () => {
    // "ABCDEFG12345" は全体が半角英数字の連なりであり、分割可能点が存在しない
    const result = breakLines("ABCDEFG12345", 100, 20, 0);
    expect(result.fits).toBe(false);
  });
});
