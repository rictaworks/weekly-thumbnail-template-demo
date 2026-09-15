import { describe, expect, it } from "vitest";
import { solveFit } from "./fitSolver.js";
import { getTemplate, getSlot } from "../master/templates.js";

const template = getTemplate("T01")!;
const topicSlot = getSlot(template, "S-TOPIC");
const spec = topicSlot.typography!;
const frame = topicSlot.rect;

describe("solveFit", () => {
  it("短い話題は最大サイズで収まる", () => {
    const result = solveFit("秋の新商品について", frame, spec);
    expect(result.overflow).toBe(false);
    expect(result.fontSize).toBe(spec.maxSize);
  });

  it("刻み幅の外のサイズを採用しない", () => {
    const result = solveFit("週次のお知らせを配信します。今週のテーマは秋の味覚についてです。", frame, spec);
    const diff = (spec.maxSize - result.fontSize) % spec.step;
    expect(diff).toBe(0);
  });

  it("長い話題ほど採用サイズが小さくなる", () => {
    const short = solveFit("秋", frame, spec);
    const long = solveFit(
      "週次のお知らせを配信します。今週のテーマは秋の味覚についてです。読者のみなさまにお楽しみいただけますように。",
      frame,
      spec,
    );
    expect(long.fontSize).toBeLessThanOrEqual(short.fontSize);
  });

  it("最小サイズでも収まらない場合は不適合とし目安文字数を示す", () => {
    const veryLong = "あ".repeat(500);
    const result = solveFit(veryLong, frame, spec);
    expect(result.overflow).toBe(true);
    expect(result.fontSize).toBe(spec.minSize);
    expect(result.shortfallChars).toBeGreaterThan(0);
  });

  it("同一入力からは常に同一の組版結果が得られる(決定性)", () => {
    const input = "週次のお知らせです。今週のテーマは秋の味覚について。";
    const first = solveFit(input, frame, spec);
    const second = solveFit(input, frame, spec);
    expect(first).toEqual(second);
  });
});
