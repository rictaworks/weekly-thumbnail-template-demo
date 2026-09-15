import type { Rect } from "../types.js";

export function insetRect(rect: Rect, margin: number): Rect {
  return { x: rect.x + margin, y: rect.y + margin, w: rect.w - margin * 2, h: rect.h - margin * 2 };
}

export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  );
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
