import { normalizeTopic, countTopicChars, countExplicitBreaks } from "./textNormalizer.js";
import { checkCharset } from "./charsetGuard.js";
import { composeGeneration } from "./composer.js";
import { runVerification } from "../verification/verificationSuite.js";
import { buildNoticeFindings, decideVerdict } from "../verification/verdictResolver.js";
import { getSlot } from "../master/templates.js";
import { TOPIC_MAX_LENGTH, TOPIC_MIN_LENGTH } from "../master/constants.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Composition, Finding, TemplateMaster, Verdict } from "../types.js";

export interface EvaluationResult {
  readonly topicNormalized: string;
  readonly composition: Composition | null;
  readonly findings: readonly Finding[];
  readonly verdict: Verdict;
}

// 単票・一括の双方から呼び出す共通の評価パイプライン。同一入力からは常に同一の結果を返す(10章の一致要件)。
export function evaluateGeneration(
  template: TemplateMaster,
  weekNumber: number,
  topicRaw: string,
  isWeekDuplicate: boolean,
): EvaluationResult {
  const topicNormalized = normalizeTopic(topicRaw);
  const findings: Finding[] = [];

  const charLength = countTopicChars(topicNormalized);
  if (charLength < TOPIC_MIN_LENGTH || charLength > TOPIC_MAX_LENGTH) {
    findings.push({
      code: FINDING_CODES.topicLength,
      severity: "不適合",
      target: "話題",
      detail: MESSAGES.topicLength(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH),
    });
  }

  const topicSlot = getSlot(template, "S-TOPIC");
  const maxBreaks = topicSlot.typography!.maxLines - 1;
  if (countExplicitBreaks(topicNormalized) > maxBreaks) {
    findings.push({
      code: FINDING_CODES.topicBreakLimit,
      severity: "不適合",
      target: "話題",
      detail: MESSAGES.topicBreakLimit(maxBreaks),
    });
  }

  const charsetFindings = checkCharset(topicNormalized);
  findings.push(...charsetFindings);

  if (findings.length > 0) {
    return { topicNormalized, composition: null, findings, verdict: "不適合" };
  }

  const { composition, fit } = composeGeneration(template, weekNumber, topicNormalized);

  if (fit.overflow) {
    findings.push({
      code: FINDING_CODES.fitOverflow,
      severity: "不適合",
      target: "話題スロット",
      detail: MESSAGES.fitOverflow(fit.shortfallChars),
    });
    return { topicNormalized, composition, findings, verdict: "不適合" };
  }

  findings.push(...runVerification(composition, template));
  findings.push(...buildNoticeFindings(composition, template, isWeekDuplicate));

  return { topicNormalized, composition, findings, verdict: decideVerdict(findings) };
}
