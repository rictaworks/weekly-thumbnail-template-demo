import { Hono } from "hono";
import { GenerationRepository } from "../../db/repositories/generationRepository.js";
import { ExportRepository } from "../../db/repositories/exportRepository.js";
import { D1Store } from "../../db/d1Store.js";
import { buildExportFileName } from "../../typography/fileNameBuilder.js";
import { MESSAGES } from "../../errors/messages.js";
import type { Env } from "../env.js";
import type { SessionVariables } from "../session.js";

interface ExportBody {
  readonly generationId?: string;
  readonly kind?: "単票" | "一括";
}

export const exportRoute = new Hono<{ Bindings: Env; Variables: SessionVariables }>();

// 書き出しはブラウザ内(Canvas)で完結する。サーバーは記録のみを担い、画像データを受け取らない。
exportRoute.post("/", async (c) => {
  const body = await c.req.json<ExportBody>().catch(() => ({}) as ExportBody);
  if (!body.generationId) return c.json({ error: MESSAGES.notFoundOrForbidden }, 400);

  const sessionId = c.get("sessionId");
  const store = new D1Store(c.env.DB);
  const generationRepo = new GenerationRepository(store);
  const exportRepo = new ExportRepository(store);

  const detail = await generationRepo.load(sessionId, body.generationId);
  if (!detail) return c.json({ error: MESSAGES.notFoundOrForbidden }, 404);

  const fileName = buildExportFileName(detail.generation.templateCode, detail.generation.weekNumber, detail.generation.revisionNo);
  const record = await exportRepo.record(sessionId, detail.generation.id, fileName, body.kind ?? "単票", () => new Date().toISOString(), () => crypto.randomUUID());

  return c.json({ export: record });
});
