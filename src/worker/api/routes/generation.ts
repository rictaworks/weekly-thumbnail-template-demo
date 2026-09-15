import { Hono } from "hono";
import { getTemplate, getSlot } from "../../master/templates.js";
import { evaluateGeneration } from "../../typography/generationEvaluator.js";
import { resolveWeekNumberFromInput, isoWeekNumberFromDate, nextWeekNumberFromHistory, formatWeekNumber } from "../../typography/weekNumberResolver.js";
import { placeWeekText } from "../../typography/layoutResolver.js";
import { GenerationRepository } from "../../db/repositories/generationRepository.js";
import { D1Store } from "../../db/d1Store.js";
import { MESSAGES } from "../../errors/messages.js";
import { HONEYPOT_FIELD_NAME, isHoneypotTriggered } from "../honeypot.js";
import type { Env } from "../env.js";
import type { SessionVariables } from "../session.js";
import type { TemplateMaster } from "../../types.js";

const VALID_ORIGINS = new Set(["単票", "改訂"]);

export function sanitizeOrigin(value: unknown): "単票" | "改訂" {
  return typeof value === "string" && VALID_ORIGINS.has(value) ? (value as "単票" | "改訂") : "単票";
}

function placeWeekLine(template: TemplateMaster, weekNumber: number) {
  const weekSlot = getSlot(template, "S-WEEK");
  const weekText = formatWeekNumber(weekNumber, template);
  return placeWeekText(weekText, weekSlot.typography!.maxSize, weekSlot.rect, weekSlot.typography!.letterSpacingEm);
}

interface EvaluateBody {
  readonly templateCode?: string;
  readonly weekNumberRaw?: string;
  readonly topicRaw?: string;
  readonly [HONEYPOT_FIELD_NAME]?: string;
}

interface ConfirmBody extends EvaluateBody {
  readonly origin?: "単票" | "改訂";
}

export const generationRoute = new Hono<{ Bindings: Env; Variables: SessionVariables }>();

function buildRepo(env: Env): GenerationRepository {
  return new GenerationRepository(new D1Store(env.DB));
}

generationRoute.post("/evaluate", async (c) => {
  const body = await c.req.json<EvaluateBody>().catch(() => ({}) as EvaluateBody);
  if (isHoneypotTriggered(body[HONEYPOT_FIELD_NAME])) return c.json({ error: MESSAGES.honeypotRejected }, 400);

  const template = body.templateCode ? getTemplate(body.templateCode) : undefined;
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 400);

  const weekResolution = resolveWeekNumberFromInput(body.weekNumberRaw ?? "");
  if (!weekResolution.ok) {
    return c.json({ verdict: "不適合", findings: [weekResolution.finding], composition: null, weekText: null, topicNormalized: null });
  }

  const sessionId = c.get("sessionId");
  const repo = buildRepo(c.env);
  const isDuplicate = await repo.findDuplicateWeek(sessionId, template.code, weekResolution.value);
  const evaluation = evaluateGeneration(template, weekResolution.value, body.topicRaw ?? "", isDuplicate);

  return c.json({
    verdict: evaluation.verdict,
    findings: evaluation.findings,
    composition: evaluation.composition,
    weekText: evaluation.composition?.weekText ?? null,
    topicNormalized: evaluation.topicNormalized,
    isWeekDuplicate: isDuplicate,
  });
});

generationRoute.post("/confirm", async (c) => {
  const body = await c.req.json<ConfirmBody>().catch(() => ({}) as ConfirmBody);
  if (isHoneypotTriggered(body[HONEYPOT_FIELD_NAME])) return c.json({ error: MESSAGES.honeypotRejected }, 400);

  const sessionId = c.get("sessionId");
  const repo = buildRepo(c.env);

  const template = body.templateCode ? getTemplate(body.templateCode) : undefined;
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 400);

  const weekResolution = resolveWeekNumberFromInput(body.weekNumberRaw ?? "");
  if (!weekResolution.ok) return c.json({ verdict: "不適合", findings: [weekResolution.finding] }, 422);

  const isDuplicate = await repo.findDuplicateWeek(sessionId, template.code, weekResolution.value);
  // クライアントの入力を信頼せず、サーバー側で再評価してから確定する。
  const evaluation = evaluateGeneration(template, weekResolution.value, body.topicRaw ?? "", isDuplicate);
  if (evaluation.verdict === "不適合" || !evaluation.composition) {
    return c.json({ verdict: evaluation.verdict, findings: evaluation.findings }, 422);
  }

  const saved = await repo.save({
    sessionId,
    templateCode: template.code,
    weekNumber: weekResolution.value,
    topicRaw: body.topicRaw ?? "",
    composition: evaluation.composition,
    verdict: evaluation.verdict,
    findings: evaluation.findings,
    origin: isDuplicate ? "改訂" : sanitizeOrigin(body.origin),
    now: () => new Date().toISOString(),
    newId: () => crypto.randomUUID(),
  });

  return c.json({ generation: saved, verdict: evaluation.verdict, findings: evaluation.findings });
});

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

generationRoute.get("/week-number/from-date", (c) => {
  const dateParam = c.req.query("date") ?? "";
  const match = ISO_DATE.exec(dateParam);
  if (!match) return c.json({ error: "日付の形式が不正です" }, 400);
  const [, year, month, day] = match;
  const weekNumber = isoWeekNumberFromDate(Number(year), Number(month), Number(day));
  return c.json({ weekNumber });
});

generationRoute.get("/week-number/next", async (c) => {
  const templateCode = c.req.query("templateCode") ?? "";
  const template = getTemplate(templateCode);
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 400);
  const sessionId = c.get("sessionId");
  const repo = buildRepo(c.env);
  const existing = await repo.listWeekNumbers(sessionId, template.code);
  return c.json({ weekNumber: nextWeekNumberFromHistory(existing) });
});

generationRoute.get("/", async (c) => {
  const sessionId = c.get("sessionId");
  const repo = buildRepo(c.env);
  const history = await repo.listHistory(sessionId);
  return c.json({ generations: history });
});

generationRoute.get("/:id", async (c) => {
  const sessionId = c.get("sessionId");
  const repo = buildRepo(c.env);
  const detail = await repo.load(sessionId, c.req.param("id"));
  if (!detail) return c.json({ error: MESSAGES.notFoundOrForbidden }, 404);

  // 週番号スロットは話題に依存せずテンプレート・週番号のみから一意に定まるため、保存せず再現時に導出する。
  const template = getTemplate(detail.generation.templateCode);
  const weekLine = template ? placeWeekLine(template, detail.generation.weekNumber) : null;

  return c.json({ ...detail, weekLine });
});
