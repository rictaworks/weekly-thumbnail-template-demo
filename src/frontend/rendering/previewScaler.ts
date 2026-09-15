import type { TemplateMaster } from "../api/types.js";

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = document.createElement("canvas");
  clone.width = source.width;
  clone.height = source.height;
  const ctx = clone.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");
  ctx.drawImage(source, 0, 0);
  return clone;
}

// 9.4節：原寸からの再描画によって一覧表示幅・超縮小表示幅の見えを提示する(別経路の描画を持たない)。
export function atWidth(source: HTMLCanvasElement, targetWidth: number): HTMLCanvasElement {
  const scale = targetWidth / source.width;
  const targetHeight = Math.round(source.height * scale);
  const scaled = document.createElement("canvas");
  scaled.width = targetWidth;
  scaled.height = targetHeight;
  const ctx = scaled.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return scaled;
}

export function toGrayscale(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = cloneCanvas(source);
  const ctx = clone.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");
  const imageData = ctx.getImageData(0, 0, clone.width, clone.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] as number;
    const g = data[i + 1] as number;
    const b = data[i + 2] as number;
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return clone;
}

export interface OverlayOptions {
  readonly safeMargin: boolean;
  readonly forbiddenArea: boolean;
  readonly slotBounds: boolean;
}

export function withOverlays(source: HTMLCanvasElement, template: TemplateMaster, options: OverlayOptions): HTMLCanvasElement {
  const clone = cloneCanvas(source);
  const ctx = clone.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");

  if (options.safeMargin) {
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    const m = template.safeMargin;
    ctx.strokeRect(m, m, template.canvasWidth - m * 2, template.canvasHeight - m * 2);
  }

  if (options.forbiddenArea) {
    ctx.strokeStyle = "#f97316";
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    for (const area of template.forbiddenAreas) {
      ctx.strokeRect(area.x, area.y, area.w, area.h);
    }
    ctx.setLineDash([]);
  }

  if (options.slotBounds) {
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1;
    for (const slot of template.slots) {
      ctx.strokeRect(slot.rect.x, slot.rect.y, slot.rect.w, slot.rect.h);
    }
  }

  return clone;
}
