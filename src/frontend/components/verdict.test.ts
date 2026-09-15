// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { findingsList, verdictBadge } from "./verdict.js";

describe("verdictBadge", () => {
  it.each(["適合", "注意付き適合", "不適合"] as const)("%sのバッジにdata-verdict属性を設定する", (verdict) => {
    const badge = verdictBadge(verdict);
    expect(badge.dataset.verdict).toBe(verdict);
  });
});

describe("findingsList", () => {
  it("指摘を重大度・対象・詳細を含む形式で列挙する", () => {
    const list = findingsList([{ code: "F-X", severity: "不適合", target: "話題", detail: "詳細" }]);
    expect(list.children).toHaveLength(1);
    expect(list.textContent).toContain("不適合");
    expect(list.textContent).toContain("話題");
    expect(list.textContent).toContain("詳細");
  });

  it("指摘が無ければ空リストになる", () => {
    const list = findingsList([]);
    expect(list.children).toHaveLength(0);
  });
});
