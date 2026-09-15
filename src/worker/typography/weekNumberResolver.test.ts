import { describe, expect, it } from "vitest";
import {
  findDuplicateWeekNumber,
  formatWeekNumber,
  isoWeekNumberFromDate,
  nextWeekNumberFromHistory,
  resolveWeekNumberFromInput,
} from "./weekNumberResolver.js";
import { getTemplate } from "../master/templates.js";

const template = getTemplate("T01")!;

describe("resolveWeekNumberFromInput", () => {
  it("1以上999以下の整数を受理する", () => {
    expect(resolveWeekNumberFromInput("1")).toEqual({ ok: true, value: 1 });
    expect(resolveWeekNumberFromInput("999")).toEqual({ ok: true, value: 999 });
  });

  it("全角数字を半角へ変換してから検証する", () => {
    expect(resolveWeekNumberFromInput("４２")).toEqual({ ok: true, value: 42 });
  });

  it.each(["0", "-1", "1000", "12.5", "abc", ""])("%s は不受理", (input) => {
    const result = resolveWeekNumberFromInput(input);
    expect(result.ok).toBe(false);
  });
});

describe("isoWeekNumberFromDate", () => {
  it("2026年1月1日はISO週番号1になる(木曜始まり週の定義通り)", () => {
    expect(isoWeekNumberFromDate(2026, 1, 1)).toBe(1);
  });

  it("同一日付からは常に同一の週番号が得られる(決定性)", () => {
    const first = isoWeekNumberFromDate(2026, 9, 16);
    const second = isoWeekNumberFromDate(2026, 9, 16);
    expect(first).toBe(second);
  });
});

describe("nextWeekNumberFromHistory", () => {
  it("履歴が無ければ1を返す", () => {
    expect(nextWeekNumberFromHistory([])).toBe(1);
  });

  it("最大週番号+1を返す", () => {
    expect(nextWeekNumberFromHistory([3, 1, 5])).toBe(6);
  });
});

describe("findDuplicateWeekNumber", () => {
  it("履歴に存在すればtrue", () => {
    expect(findDuplicateWeekNumber([1, 2, 3], 2)).toBe(true);
    expect(findDuplicateWeekNumber([1, 2, 3], 9)).toBe(false);
  });
});

describe("formatWeekNumber", () => {
  it("100未満はゼロ埋め2桁", () => {
    expect(formatWeekNumber(7, template)).toBe("第07");
  });

  it("100以上はゼロ埋め3桁", () => {
    expect(formatWeekNumber(100, template)).toBe("第100");
  });
});
