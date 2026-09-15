import { charWidthRatio } from "../data/glyph-widths.js";

// 文字の送り幅は同梱の字幅テーブル（data/glyph-widths.ts）からのみ取得する。描画環境の計測APIには一切依存しない。
export function charAdvance(char: string, fontSize: number): number {
  const ratio = charWidthRatio(char);
  if (ratio === undefined) {
    throw new Error(`字幅テーブルに存在しない文字です: ${char}`);
  }
  return fontSize * ratio;
}

export function textWidth(text: string, fontSize: number, letterSpacingEm: number): number {
  const chars = Array.from(text);
  if (chars.length === 0) return 0;
  const advanceSum = chars.reduce((sum, char) => sum + charAdvance(char, fontSize), 0);
  const spacing = fontSize * letterSpacingEm * (chars.length - 1);
  return advanceSum + spacing;
}
