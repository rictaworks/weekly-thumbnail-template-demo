import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStore } from "../store.js";
import { GenerationRepository } from "./generationRepository.js";
import { composeGeneration } from "../../typography/composer.js";
import { getTemplate } from "../../master/templates.js";

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
});
