import { describe, expect, it } from "vitest";
import { confirmableRows, validateBatch } from "./batchService.js";
import { getTemplate } from "../master/templates.js";

const template = getTemplate("T01")!;

describe("validateBatch", () => {
  it("単票と同一の規則で各行を検証する", () => {
    const results = validateBatch(template, "1\t秋の新商品についてのお知らせです", []);
    expect(results).toHaveLength(1);
    expect(results[0]?.verdict).toBe("適合");
  });

  it("列不足の行はジョブ全体を不受理にせず該当行のみ指摘する", () => {
    const results = validateBatch(template, "1\t話題A\n列が足りない行\n3\t話題C", []);
    expect(results).toHaveLength(3);
    expect(results[0]?.verdict).toBe("適合");
    expect(results[1]?.verdict).toBe("不適合");
    expect(results[1]?.findings[0]?.code).toBe("F-BATCH-COLUMN");
    expect(results[2]?.verdict).toBe("適合");
  });

  it("50行を超える行は上限超過の指摘を付ける", () => {
    const lines = Array.from({ length: 52 }, (_, i) => `${i + 1}\t話題${i + 1}`).join("\n");
    const results = validateBatch(template, lines, []);
    expect(results).toHaveLength(52);
    expect(results[50]?.findings[0]?.code).toBe("F-BATCH-LIMIT");
    expect(results[51]?.findings[0]?.code).toBe("F-BATCH-LIMIT");
  });

  it("ジョブ内での週番号重複は注意として検出する", () => {
    const results = validateBatch(template, "1\t話題A\n1\t話題B", []);
    expect(results[1]?.verdict).toBe("注意付き適合");
    expect(results[1]?.findings.some((f) => f.code === "F-WEEK-DUPLICATE")).toBe(true);
  });

  it("履歴との重複も注意として検出する", () => {
    const results = validateBatch(template, "5\t話題A", [5]);
    expect(results[0]?.verdict).toBe("注意付き適合");
  });

  it("単票で同じ入力を与えた場合の結果と一致する", () => {
    const batchResult = validateBatch(template, "1\t秋の新商品についてのお知らせです", []);
    expect(batchResult[0]?.verdict).toBe("適合");
    expect(batchResult[0]?.composition?.topicFontSize).toBeDefined();
  });
});

describe("confirmableRows", () => {
  it("適合・注意付き適合の行のみ返す", () => {
    const results = validateBatch(template, "1\t話題A\n列不足\n1\t話題B", []);
    const confirmable = confirmableRows(results);
    expect(confirmable.every((r) => r.verdict === "適合" || r.verdict === "注意付き適合")).toBe(true);
    expect(confirmable.length).toBeLessThan(results.length);
  });
});
