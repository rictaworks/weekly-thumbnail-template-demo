import { textWidth } from "./glyphMetrics.js";
import type { PlacedLine, Rect, TypographySpec } from "../types.js";

// 8.4節：話題スロットは左上アンカー。1行目の上端を枠上端に合わせ、以降の行を行送り分だけ下へ積む。
export function placeTopicLines(
  lines: readonly string[],
  fontSize: number,
  frame: Rect,
  spec: TypographySpec,
): PlacedLine[] {
  const lineHeight = fontSize * spec.lineHeightRatio;
  return lines.map((text, index) => ({
    seq: index,
    text,
    width: textWidth(text, fontSize, spec.letterSpacingEm),
    baselineY: frame.y + lineHeight * index + fontSize,
  }));
}

// 8.4節：週番号スロットは右上アンカー。表示文字列の右端を枠右端に合わせる。
export function placeWeekText(text: string, fontSize: number, frame: Rect, letterSpacingEm: number): PlacedLine {
  const width = textWidth(text, fontSize, letterSpacingEm);
  return {
    seq: 0,
    text,
    width,
    baselineY: frame.y + fontSize,
  };
}

export function weekTextRightEdgeX(frame: Rect): number {
  return frame.x + frame.w;
}
