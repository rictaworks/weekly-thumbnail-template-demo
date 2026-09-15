import { describe, expect, it } from "vitest";
import { runDailyReset } from "./dailyReset.js";
import { InMemoryStore } from "../db/store.js";
import { GenerationRepository } from "../db/repositories/generationRepository.js";
import { composeGeneration } from "../typography/composer.js";
import { getTemplate } from "../master/templates.js";

const template = getTemplate("T01")!;

describe("runDailyReset", () => {
  it("生成履歴を全セッション分削除する", async () => {
    const store = new InMemoryStore();
    const repo = new GenerationRepository(store);
    const { composition } = composeGeneration(template, 1, "話題");
    await repo.save({
      sessionId: "session-A",
      templateCode: "T01",
      weekNumber: 1,
      topicRaw: "話題",
      composition,
      verdict: "適合",
      findings: [],
      origin: "単票",
      now: () => "2026-09-16T00:00:00.000Z",
      newId: () => "id-1",
    });

    expect(await repo.listHistory("session-A")).toHaveLength(1);
    await runDailyReset(store);
    expect(await repo.listHistory("session-A")).toHaveLength(0);
  });
});
