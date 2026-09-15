import { charAdvance, textWidth } from "./glyphMetrics.js";
import { isHangingAllowed, isLineEndForbidden, isLineStartForbidden, isUnbreakablePair } from "../master/kinsoku.js";

export interface LineBreakResult {
  readonly lines: readonly string[];
  readonly lineWidths: readonly number[];
  readonly fits: boolean;
}

// ぶら下げ：行末の句読点1文字は行幅の算入対象から除外する。
function measureLineWidth(line: string, fontSize: number, letterSpacingEm: number): number {
  const chars = Array.from(line);
  if (chars.length > 0 && isHangingAllowed(chars[chars.length - 1] as string)) {
    return textWidth(chars.slice(0, -1).join(""), fontSize, letterSpacingEm);
  }
  return textWidth(line, fontSize, letterSpacingEm);
}

function findRawBreakIndex(
  chars: readonly string[],
  start: number,
  frameWidth: number,
  fontSize: number,
  letterSpacingEm: number,
): number {
  let sumAdvance = 0;
  let count = 0;
  for (let i = start; i < chars.length; i++) {
    const advance = charAdvance(chars[i] as string, fontSize);
    const tentativeCount = count + 1;
    const tentativeWidth = sumAdvance + advance + fontSize * letterSpacingEm * (tentativeCount - 1);
    if (tentativeWidth > frameWidth) return i;
    sumAdvance += advance;
    count = tentativeCount;
  }
  return chars.length;
}

function applyHanging(chars: readonly string[], start: number, rawIdx: number): { idx: number; hanging: boolean } {
  if (rawIdx > start && rawIdx < chars.length && isHangingAllowed(chars[rawIdx] as string)) {
    return { idx: rawIdx + 1, hanging: true };
  }
  return { idx: rawIdx, hanging: false };
}

function backOffForKinsoku(chars: readonly string[], start: number, idx: number): number {
  let candidate = idx;
  while (candidate > start) {
    const lineEndChar = chars[candidate - 1] as string;
    const nextStartChar = candidate < chars.length ? chars[candidate] : undefined;
    const violatesLineEnd = isLineEndForbidden(lineEndChar);
    const violatesLineStart = nextStartChar !== undefined && isLineStartForbidden(nextStartChar);
    const violatesUnbreakable = nextStartChar !== undefined && isUnbreakablePair(lineEndChar, nextStartChar);
    if (!violatesLineEnd && !violatesLineStart && !violatesUnbreakable) break;
    candidate -= 1;
  }
  return candidate;
}

function findLineEnd(
  chars: readonly string[],
  start: number,
  frameWidth: number,
  fontSize: number,
  letterSpacingEm: number,
): number | null {
  const rawIdx = findRawBreakIndex(chars, start, frameWidth, fontSize, letterSpacingEm);
  const { idx: hangingIdx } = applyHanging(chars, start, rawIdx);
  const finalIdx = backOffForKinsoku(chars, start, hangingIdx);
  if (finalIdx === start) return null;
  return finalIdx;
}

// 8.2節の行分割アルゴリズム。段落境界をまたぐ行の結合は行わない。
export function breakLines(
  normalizedTopic: string,
  frameWidth: number,
  fontSize: number,
  letterSpacingEm: number,
): LineBreakResult {
  const paragraphs = normalizedTopic.split("\n");
  const lines: string[] = [];
  const lineWidths: number[] = [];
  for (const paragraph of paragraphs) {
    const chars = Array.from(paragraph);
    if (chars.length === 0) {
      lines.push("");
      lineWidths.push(0);
      continue;
    }
    let cursor = 0;
    while (cursor < chars.length) {
      const end = findLineEnd(chars, cursor, frameWidth, fontSize, letterSpacingEm);
      if (end === null) return { lines, lineWidths, fits: false };
      const line = chars.slice(cursor, end).join("");
      lines.push(line);
      lineWidths.push(measureLineWidth(line, fontSize, letterSpacingEm));
      cursor = end;
    }
  }
  return { lines, lineWidths, fits: true };
}
