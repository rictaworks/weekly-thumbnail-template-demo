import { describe, expect, it } from "vitest";
import { runVerification } from "./verificationSuite.js";
import { composeGeneration } from "../typography/composer.js";
import { getTemplate } from "../master/templates.js";
import type { TemplateCode } from "../types.js";

const template = getTemplate("T01")!;

describe("runVerification 全テンプレート", () => {
  it.each<TemplateCode>(["T01", "T02", "T03"])("%sで通常入力は指摘が空になる", (code) => {
    const tpl = getTemplate(code)!;
    const { composition } = composeGeneration(tpl, 12, "秋の新商品についてのお知らせ");
    expect(runVerification(composition, tpl)).toEqual([]);
  });
});

describe("runVerification", () => {
  it("通常の入力は検版V1〜V7を全て満たし指摘が空になる", () => {
    const { composition } = composeGeneration(template, 42, "秋の新商品について");
    const findings = runVerification(composition, template);
    expect(findings).toEqual([]);
  });

  it("最小サイズでも収まらない入力はV1またはV2で不適合になる", () => {
    const { composition } = composeGeneration(template, 42, "あ".repeat(500));
    const findings = runVerification(composition, template);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.severity === "不適合")).toBe(true);
  });

  it("同一入力からは常に同一の検版結果が得られる(決定性)", () => {
    const { composition } = composeGeneration(template, 7, "週次のお知らせです");
    const first = runVerification(composition, template);
    const second = runVerification(composition, template);
    expect(first).toEqual(second);
  });
});
