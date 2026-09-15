import { APP_FONT_FAMILY } from "./fontLoader.js";
import type { Composition, TemplateMaster } from "../api/types.js";

function findSlot(template: TemplateMaster, code: string) {
  const slot = template.slots.find((s) => s.code === code);
  if (!slot) throw new Error(`スロットが見つかりません: ${code}`);
  return slot;
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number): void {
  const withSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ("letterSpacing" in withSpacing) {
    withSpacing.letterSpacing = `${px}px`;
  }
}

// 8.5節の描画順を固定：背景→帯→固定マーク→シリーズ名→週番号→話題。
// バックエンドから受け取った組版結果(採用サイズ・各行文字列・基準位置)をそのまま用い、再計算しない。
export function renderComposition(canvas: HTMLCanvasElement, composition: Composition, template: TemplateMaster): void {
  canvas.width = template.canvasWidth;
  canvas.height = template.canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");

  const bg = findSlot(template, "S-BG");
  ctx.fillStyle = template.palette.background;
  ctx.fillRect(bg.rect.x, bg.rect.y, bg.rect.w, bg.rect.h);

  const band = findSlot(template, "S-BAND");
  ctx.fillStyle = template.palette.band;
  ctx.fillRect(band.rect.x, band.rect.y, band.rect.w, band.rect.h);

  const mark = findSlot(template, "S-MARK");
  ctx.fillStyle = template.palette.accent;
  ctx.beginPath();
  ctx.roundRect(mark.rect.x, mark.rect.y, mark.rect.w, mark.rect.h, Math.min(mark.rect.w, mark.rect.h) * 0.2);
  ctx.fill();

  const series = findSlot(template, "S-SERIES");
  ctx.fillStyle = template.palette.secondaryText;
  ctx.font = `600 20px "${APP_FONT_FAMILY}"`;
  ctx.textBaseline = "alphabetic";
  setLetterSpacing(ctx, 0);
  ctx.fillText(template.seriesName, series.rect.x, series.rect.y + 32);

  const weekSlot = findSlot(template, "S-WEEK");
  ctx.fillStyle = template.palette.accent;
  ctx.font = `700 ${composition.weekFontSize}px "${APP_FONT_FAMILY}"`;
  setLetterSpacing(ctx, composition.weekFontSize * (weekSlot.typography?.letterSpacingEm ?? 0));
  const weekX = weekSlot.rect.x + weekSlot.rect.w - composition.weekLine.width;
  ctx.fillText(composition.weekLine.text, weekX, composition.weekLine.baselineY);

  const topicSlot = findSlot(template, "S-TOPIC");
  ctx.fillStyle = template.palette.primaryText;
  ctx.font = `700 ${composition.topicFontSize}px "${APP_FONT_FAMILY}"`;
  setLetterSpacing(ctx, composition.topicFontSize * (topicSlot.typography?.letterSpacingEm ?? 0));
  for (const line of composition.topicLines) {
    ctx.fillText(line.text, topicSlot.rect.x, line.baselineY);
  }
}
