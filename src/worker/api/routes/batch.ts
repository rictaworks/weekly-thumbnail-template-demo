import { Hono } from "hono";
import { getTemplate } from "../../master/templates.js";
import { confirmableRows, validateBatch } from "../../typography/batchService.js";
import { GenerationRepository } from "../../db/repositories/generationRepository.js";
import { BatchRepository } from "../../db/repositories/batchRepository.js";
import { D1Store } from "../../db/d1Store.js";
import { MESSAGES } from "../../errors/messages.js";
import { HONEYPOT_FIELD_NAME, isHoneypotTriggered } from "../honeypot.js";
import type { Env } from "../env.js";
import type { SessionVariables } from "../session.js";

interface BatchBody {
  readonly templateCode?: string;
  readonly rawText?: string;
  readonly [HONEYPOT_FIELD_NAME]?: string;
}

export const batchRoute = new Hono<{ Bindings: Env; Variables: SessionVariables }>();

function repos(env: Env) {
  const store = new D1Store(env.DB);
  return { generationRepo: new GenerationRepository(store), batchRepo: new BatchRepository(store) };
}

batchRoute.post("/validate", async (c) => {
  const body = await c.req.json<BatchBody>().catch(() => ({}) as BatchBody);
  if (isHoneypotTriggered(body[HONEYPOT_FIELD_NAME])) return c.json({ error: MESSAGES.honeypotRejected }, 400);

  const template = body.templateCode ? getTemplate(body.templateCode) : undefined;
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 400);

  const sessionId = c.get("sessionId");
  const { generationRepo } = repos(c.env);
  const existingWeekNumbers = await generationRepo.listWeekNumbers(sessionId, template.code);
  const rows = validateBatch(template, body.rawText ?? "", existingWeekNumbers);
  return c.json({ rows });
});

batchRoute.post("/confirm", async (c) => {
  const body = await c.req.json<BatchBody>().catch(() => ({}) as BatchBody);
  if (isHoneypotTriggered(body[HONEYPOT_FIELD_NAME])) return c.json({ error: MESSAGES.honeypotRejected }, 400);

  const template = body.templateCode ? getTemplate(body.templateCode) : undefined;
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 400);

  const sessionId = c.get("sessionId");
  const { generationRepo, batchRepo } = repos(c.env);
  const now = () => new Date().toISOString();
  const newId = () => crypto.randomUUID();

  // クライアントの入力を信頼せず、確定時もサーバー側で再検証する。
  const existingWeekNumbers = await generationRepo.listWeekNumbers(sessionId, template.code);
  const rows = validateBatch(template, body.rawText ?? "", existingWeekNumbers);
  const eligible = confirmableRows(rows);

  const batch = await batchRepo.save(
    sessionId,
    template.code,
    rows.map((r) => ({ seq: r.seq, weekNumber: r.weekNumber ?? 0, topicRaw: r.topicRaw, verdict: r.verdict })),
    now,
    newId,
  );

  let confirmedCount = 0;
  for (const row of eligible) {
    if (row.composition === null || row.weekNumber === null) continue;
    const generation = await generationRepo.save({
      sessionId,
      templateCode: template.code,
      weekNumber: row.weekNumber,
      topicRaw: row.topicRaw,
      composition: row.composition,
      verdict: row.verdict,
      findings: row.findings,
      origin: "一括",
      now,
      newId,
    });
    const itemRow = batch.items.find((i) => i.seq === row.seq);
    if (itemRow) await batchRepo.markConfirmed(sessionId, itemRow.id, generation.id);
    confirmedCount += 1;
  }

  return c.json({ batchId: batch.batch.id, confirmedCount, totalCount: rows.length, rows });
});
