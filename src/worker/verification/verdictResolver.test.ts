import { describe, expect, it } from "vitest";
import { buildNoticeFindings, decideVerdict } from "./verdictResolver.js";
import { composeGeneration } from "../typography/composer.js";
import { getTemplate } from "../master/templates.js";
import type { Finding } from "../types.js";

const template = getTemplate("T01")!;

describe("decideVerdict", () => {
  it("不適合が1件でもあれば不適合", () => {
    const findings: Finding[] = [{ code: "X", severity: "不適合", target: "t", detail: "d" }];
    expect(decideVerdict(findings)).toBe("不適合");
  });

  it("注意のみなら注意付き適合", () => {
    const findings: Finding[] = [{ code: "X", severity: "注意", target: "t", detail: "d" }];
    expect(decideVerdict(findings)).toBe("注意付き適合");
  });

  it("指摘が無ければ適合", () => {
    expect(decideVerdict([])).toBe("適合");
  });
});

describe("buildNoticeFindings", () => {
  it("極端に短い話題(2文字以下)は注意になる", () => {
    const { composition } = composeGeneration(template, 1, "秋");
    const findings = buildNoticeFindings(composition, template, false);
    expect(findings.some((f) => f.code === "F-TOPIC-SHORT")).toBe(true);
  });

  it("週番号重複フラグがtrueなら注意になる", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const findings = buildNoticeFindings(composition, template, true);
    expect(findings.some((f) => f.code === "F-WEEK-DUPLICATE")).toBe(true);
  });

  it("重複が無く通常長の話題なら注意が付かない", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品についてのお知らせです");
    const findings = buildNoticeFindings(composition, template, false);
    expect(findings.some((f) => f.code === "F-WEEK-DUPLICATE" || f.code === "F-TOPIC-SHORT")).toBe(false);
  });
});
