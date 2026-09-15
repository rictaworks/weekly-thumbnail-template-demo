import { solveFit } from "./fitSolver.js";
import { placeTopicLines, placeWeekText } from "./layoutResolver.js";
import { formatWeekNumber } from "./weekNumberResolver.js";
import { getSlot } from "../master/templates.js";
import type { Composition, FitResult, TemplateMaster } from "../types.js";

export interface ComposeResult {
  readonly composition: Composition;
  readonly fit: FitResult;
}

// 話題・週番号から組版結果(Composition)を導出する。同一入力からは常に同一の結果を返す(決定性)。
export function composeGeneration(template: TemplateMaster, weekNumber: number, topicNormalized: string): ComposeResult {
  const topicSlot = getSlot(template, "S-TOPIC");
  const weekSlot = getSlot(template, "S-WEEK");
  const fit = solveFit(topicNormalized, topicSlot.rect, topicSlot.typography!);
  const topicLines = placeTopicLines(fit.lines, fit.fontSize, topicSlot.rect, topicSlot.typography!);

  const weekText = formatWeekNumber(weekNumber, template);
  const weekFontSize = weekSlot.typography!.maxSize;
  const weekLine = placeWeekText(weekText, weekFontSize, weekSlot.rect, weekSlot.typography!.letterSpacingEm);

  const composition: Composition = {
    templateCode: template.code,
    weekNumber,
    weekText,
    weekFontSize,
    weekLine,
    topicNormalized,
    topicFontSize: fit.fontSize,
    topicLines,
  };

  return { composition, fit };
}
