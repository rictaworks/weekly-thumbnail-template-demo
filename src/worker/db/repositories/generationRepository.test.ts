import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStore } from "../store.js";
import { GenerationRepository } from "./generationRepository.js";
import { composeGeneration } from "../../typography/composer.js";
import { placeWeekText } from "../../typography/layoutResolver.js";
import { getTemplate, getSlot } from "../../master/templates.js";
import type { Composition } from "../../types.js";

const template = getTemplate("T01")!;

let counter = 0;
function newId(): string {
  counter += 1;
  return `id-${counter}`;
}
function now(): string {
  return "2026-09-16T00:00:00.000Z";
}

function buildRepo() {
  return new GenerationRepository(new InMemoryStore());
}

describe("GenerationRepository", () => {
  beforeEach(() => {
    counter = 0;
  });

  it("他セッションの生成IDを指定してもレコードへ到達できない", async () => {
    const repo = buildRepo();
    const { composition } = composeGeneration(template, 1, "秋の新商品について");
    const saved = await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 1,
      topicRaw: "秋の新商品について",
      composition,
      verdict: "適合",
      findings: [],
      origin: "単票",
      now,
      newId,
    });

    const asOwner = await repo.load("session-A", saved.id);
    const asOther = await repo.load("session-B", saved.id);

    expect(asOwner).not.toBeNull();
    expect(asOwner?.generation.id).toBe(saved.id);
    expect(asOther).toBeNull();
  });

  it("同一テンプレート・同一週番号の再生成は改訂番号を進めて追加する(上書きしない)", async () => {
    const repo = buildRepo();
    const { composition } = composeGeneration(template, 5, "最初のお知らせ");
    const first = await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 5,
      topicRaw: "最初のお知らせ",
      composition,
      verdict: "適合",
      findings: [],
      origin: "単票",
      now,
      newId,
    });
    expect(first.revisionNo).toBe(1);

    const { composition: revised } = composeGeneration(template, 5, "改訂後のお知らせ");
    const second = await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 5,
      topicRaw: "改訂後のお知らせ",
      composition: revised,
      verdict: "適合",
      findings: [],
      origin: "改訂",
      now,
      newId,
    });
    expect(second.revisionNo).toBe(2);
    expect(second.id).not.toBe(first.id);

    const history = await repo.listHistory("session-A");
    expect(history).toHaveLength(2);
    expect(history[0]?.revisionNo).toBe(2);
  });

  it("週番号重複の検出はセッション内・同一テンプレートに限られる", async () => {
    const repo = buildRepo();
    const { composition } = composeGeneration(template, 9, "話題");
    await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 9,
      topicRaw: "話題",
      composition,
      verdict: "適合",
      findings: [],
      origin: "単票",
      now,
      newId,
    });

    expect(await repo.findDuplicateWeek("session-A", "T01", 9)).toBe(true);
    expect(await repo.findDuplicateWeek("session-A", "T02", 9)).toBe(false);
    expect(await repo.findDuplicateWeek("session-B", "T01", 9)).toBe(false);
  });

  it("履歴からの再現結果が確定時の組版結果と一致する(行データの丸め誤差を除く)", async () => {
    const repo = buildRepo();
    const topic = "週次のお知らせです。今週のテーマは秋の味覚について。";
    const { composition } = composeGeneration(template, 21, topic);
    const saved = await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 21,
      topicRaw: topic,
      composition,
      verdict: "適合",
      findings: [],
      origin: "単票",
      now,
      newId,
    });

    const detail = await repo.load("session-A", saved.id);
    expect(detail).not.toBeNull();

    // 週番号スロットは話題に依存せずテンプレート・週番号のみから一意に定まるため保存せず、
    // GET /api/generations/:id と同様にテンプレート・週番号から再現時に導出する(src/worker/api/routes/generation.ts placeWeekLine相当)。
    const weekSlot = getSlot(template, "S-WEEK");
    const reproducedWeekLine = placeWeekText(
      composition.weekText,
      weekSlot.typography!.maxSize,
      weekSlot.rect,
      weekSlot.typography!.letterSpacingEm,
    );

    // 話題スロットは保存された行データ(幅・ベースラインは整数へ丸めて保存)から再構成する(historyPage.ts toComposition相当)。
    const reproduced: Composition = {
      templateCode: template.code,
      weekNumber: 21,
      weekText: reproducedWeekLine.text,
      weekFontSize: weekSlot.typography!.maxSize,
      weekLine: reproducedWeekLine,
      topicNormalized: detail!.generation.topicNormalized,
      topicFontSize: detail!.generation.fontSize,
      topicLines: [...detail!.lines]
        .sort((a, b) => a.seq - b.seq)
        .map((l) => ({ seq: l.seq, text: l.text, width: l.width, baselineY: l.baselineY })),
    };

    expect(reproduced.topicFontSize).toBe(composition.topicFontSize);
    expect(reproduced.topicNormalized).toBe(composition.topicNormalized);
    expect(reproduced.topicLines.map((l) => l.text)).toEqual(composition.topicLines.map((l) => l.text));
    expect(reproduced.topicLines.map((l) => Math.round(l.width))).toEqual(
      composition.topicLines.map((l) => Math.round(l.width)),
    );
    expect(reproduced.topicLines.map((l) => Math.round(l.baselineY))).toEqual(
      composition.topicLines.map((l) => Math.round(l.baselineY)),
    );
    expect(reproduced.weekText).toBe(composition.weekText);
    expect(reproduced.weekLine).toEqual(composition.weekLine);
  });
});
