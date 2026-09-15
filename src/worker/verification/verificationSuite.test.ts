import { describe, expect, it } from "vitest";
import { runVerification } from "./verificationSuite.js";
import { composeGeneration } from "../typography/composer.js";
import { getTemplate } from "../master/templates.js";
import { LISTING_MIN_EFFECTIVE_SIZE_PX, LISTING_WIDTH_PX } from "../master/readability.js";
import type { TemplateCode, TemplateMaster } from "../types.js";

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

// V3〜V7は通常入力・通常マスタ値では発生しないため、マスタ値のみを境界値へ差し替えた合成テンプレートで判定を検証する。
// runVerificationは入力・組版結果・テンプレートのマスタ値のみから判定を導出するため、この手法で個々の検版項目を独立に検証できる。
describe("runVerification V3〜V7の境界値", () => {
  it("V3：セーフマージンを固定要素にかかるまで広げると不適合になる", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const widenedMargin: TemplateMaster = { ...template, safeMargin: 100 };
    const findings = runVerification(composition, widenedMargin);
    expect(findings.some((f) => f.code === "F-V3-SAFE-MARGIN")).toBe(true);
  });

  it("V4：占有禁止領域を固定要素と重なる位置に設定すると不適合になる", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const overlappingForbidden: TemplateMaster = {
      ...template,
      forbiddenAreas: [{ x: 0, y: 0, w: 200, h: 100 }],
    };
    const findings = runVerification(composition, overlappingForbidden);
    expect(findings.some((f) => f.code === "F-V4-FORBIDDEN-AREA")).toBe(true);
  });

  it("V5：縮小表示時の実効文字サイズが下限を下回ると不適合になる", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const shrunkComposition = { ...composition, topicFontSize: 40 };
    const findings = runVerification(shrunkComposition, template);
    expect(findings.some((f) => f.code === "F-V5-SCALE-READABILITY")).toBe(true);
  });

  it("境界値：V5は実効文字サイズがちょうど下限のときは不適合にならない", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const exactSize = (LISTING_MIN_EFFECTIVE_SIZE_PX * template.canvasWidth) / LISTING_WIDTH_PX;
    const boundaryComposition = { ...composition, topicFontSize: exactSize };
    const findings = runVerification(boundaryComposition, template);
    expect(findings.some((f) => f.code === "F-V5-SCALE-READABILITY")).toBe(false);
  });

  it("V6：文字色と背面色のコントラストが基準を下回ると不適合になる(グレースケールは基準を満たす)", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    // #E80000 対 #F8F8E0 はWCAGコントラスト比約4.40(<4.5の基準を下回る)だがグレースケール変換後は約8.8(基準3以上)を満たす組み合わせ。
    const lowContrastPalette: TemplateMaster = {
      ...template,
      palette: { ...template.palette, accent: "#E80000", background: "#F8F8E0" },
    };
    const findings = runVerification(composition, lowContrastPalette);
    expect(findings.some((f) => f.code === "F-V6-CONTRAST")).toBe(true);
    expect(findings.some((f) => f.code === "F-V7-GRAYSCALE")).toBe(false);
  });

  it("V7：グレースケール変換後のコントラストが基準を下回ると不適合になる(通常のコントラストは基準を満たす)", () => {
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    // #00F800 対 #603860 はWCAGコントラスト比約6.46(基準4.5以上)を満たすが、グレースケール変換後は約2.89(<3の基準を下回る)になる組み合わせ。
    const lowGrayscalePalette: TemplateMaster = {
      ...template,
      palette: { ...template.palette, accent: "#00F800", background: "#603860" },
    };
    const findings = runVerification(composition, lowGrayscalePalette);
    expect(findings.some((f) => f.code === "F-V6-CONTRAST")).toBe(false);
    expect(findings.some((f) => f.code === "F-V7-GRAYSCALE")).toBe(true);
  });
});
