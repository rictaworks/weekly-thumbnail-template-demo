import { describe, expect, it } from "vitest";
import { evaluateGeneration } from "./generationEvaluator.js";
import { getTemplate } from "../master/templates.js";

const template = getTemplate("T01")!;

describe("evaluateGeneration", () => {
  it("通常入力は適合になる", () => {
    const result = evaluateGeneration(template, 1, "秋の新商品についてのお知らせです", false);
    expect(result.verdict).toBe("適合");
    expect(result.composition).not.toBeNull();
  });

  it("収録文字外を含む話題は不適合になりコンポジションを生成しない", () => {
    const result = evaluateGeneration(template, 1, "秋の新商品😀について", false);
    expect(result.verdict).toBe("不適合");
    expect(result.composition).toBeNull();
    expect(result.findings.some((f) => f.code === "F-TOPIC-CHARSET")).toBe(true);
  });

  it("61文字以上の話題は不適合になる", () => {
    const result = evaluateGeneration(template, 1, "あ".repeat(61), false);
    expect(result.verdict).toBe("不適合");
    expect(result.findings.some((f) => f.code === "F-TOPIC-LENGTH")).toBe(true);
  });

  it("境界値：1文字の話題は文字数チェックでは不適合にならない", () => {
    const result = evaluateGeneration(template, 1, "秋", false);
    expect(result.findings.some((f) => f.code === "F-TOPIC-LENGTH")).toBe(false);
  });

  it("境界値：60文字ちょうどの話題は文字数チェックでは不適合にならない", () => {
    const result = evaluateGeneration(template, 1, "あ".repeat(60), false);
    expect(result.findings.some((f) => f.code === "F-TOPIC-LENGTH")).toBe(false);
  });

  it("境界値：空文字（0文字）の話題は不適合になる", () => {
    const result = evaluateGeneration(template, 1, "", false);
    expect(result.verdict).toBe("不適合");
    expect(result.findings.some((f) => f.code === "F-TOPIC-LENGTH")).toBe(true);
  });

  it("明示改行が最大行数-1を超えると不適合になる", () => {
    const result = evaluateGeneration(template, 1, "あ\nい\nう\nえ", false);
    expect(result.verdict).toBe("不適合");
    expect(result.findings.some((f) => f.code === "F-TOPIC-BREAK-LIMIT")).toBe(true);
  });

  it("境界値：明示改行がちょうど最大行数-1個(T01は2個)の話題は改行数チェックでは不適合にならない", () => {
    const result = evaluateGeneration(template, 1, "あ\nい\nう", false);
    expect(result.findings.some((f) => f.code === "F-TOPIC-BREAK-LIMIT")).toBe(false);
  });

  it("週番号重複フラグがtrueなら注意付き適合になる", () => {
    const result = evaluateGeneration(template, 1, "秋の新商品についてのお知らせです", true);
    expect(result.verdict).toBe("注意付き適合");
  });

  it("同一入力からは常に同一の評価結果が得られる(決定性)", () => {
    const first = evaluateGeneration(template, 3, "週次のお知らせです", false);
    const second = evaluateGeneration(template, 3, "週次のお知らせです", false);
    expect(first).toEqual(second);
  });
});
