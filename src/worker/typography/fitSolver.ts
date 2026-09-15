import { breakLines } from "./lineBreaker.js";
import { countTopicChars } from "./textNormalizer.js";
import type { FitResult, TypographySpec, Rect } from "../types.js";

function candidateSizes(spec: TypographySpec): number[] {
  const sizes: number[] = [];
  for (let size = spec.maxSize; size >= spec.minSize; size -= spec.step || 1) {
    sizes.push(size);
  }
  return sizes;
}

function fitsAt(
  lines: readonly string[],
  lineWidths: readonly number[],
  size: number,
  spec: TypographySpec,
  frame: Rect,
): boolean {
  if (lines.length > spec.maxLines) return false;
  if (lineWidths.some((w) => w > frame.w)) return false;
  const totalHeight = lines.length * size * spec.lineHeightRatio;
  return totalHeight <= frame.h;
}

// 8.3節の自動縮小：最大→最小サイズを刻み幅で降順に候補化し、全条件を満たす最初の候補を採用する。
export function solveFit(normalizedTopic: string, frame: Rect, spec: TypographySpec): FitResult {
  const sizes = candidateSizes(spec);
  for (const size of sizes) {
    const result = breakLines(normalizedTopic, frame.w, size, spec.letterSpacingEm);
    if (!result.fits) continue;
    if (fitsAt(result.lines, result.lineWidths, size, spec, frame)) {
      return { fontSize: size, lines: result.lines, overflow: false, shortfallChars: 0 };
    }
  }
  const smallest = spec.minSize;
  const shortfallChars = estimateShortfallChars(normalizedTopic, frame, spec);
  const fallback = breakLines(normalizedTopic, frame.w, smallest, spec.letterSpacingEm);
  return {
    fontSize: smallest,
    lines: fallback.fits ? fallback.lines : [],
    overflow: true,
    shortfallChars,
  };
}

// 不適合時に、最小サイズで収まる目安文字数との差分を提示するための概算。
function estimateShortfallChars(normalizedTopic: string, frame: Rect, spec: TypographySpec): number {
  const totalChars = countTopicChars(normalizedTopic);
  const maxHeightLines = Math.floor(frame.h / (spec.minSize * spec.lineHeightRatio));
  const usableLines = Math.max(1, Math.min(spec.maxLines, maxHeightLines));
  const approxCharsPerLine = Math.max(1, Math.floor(frame.w / spec.minSize));
  const capacity = usableLines * approxCharsPerLine;
  return Math.max(0, totalChars - capacity);
}

export function maxCharsAt(size: number, frame: Rect, spec: TypographySpec): number {
  const usableLines = Math.min(spec.maxLines, Math.floor(frame.h / (size * spec.lineHeightRatio)));
  const approxCharsPerLine = Math.max(1, Math.floor(frame.w / size));
  return Math.max(0, usableLines * approxCharsPerLine);
}
