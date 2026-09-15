import { getSlot } from "../master/templates.js";
import {
  LINE_BALANCE_RATIO_THRESHOLD,
  NOTICE_MIN_SIZE_STEPS_AWAY,
  SHORT_TOPIC_MAX_LENGTH,
} from "../master/constants.js";
import { countTopicChars } from "../typography/textNormalizer.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Composition, Finding, TemplateMaster, Verdict } from "../types.js";

// 9.2節の注意条件4つ。最小サイズ接近・週番号重複・行長偏り・極端に短い話題。
export function buildNoticeFindings(composition: Composition, template: TemplateMaster, isWeekDuplicate: boolean): Finding[] {
  const findings: Finding[] = [];
  const topicSlot = getSlot(template, "S-TOPIC");
  const spec = topicSlot.typography!;

  const stepsAwayFromMin = (composition.topicFontSize - spec.minSize) / spec.step;
  if (stepsAwayFromMin >= 0 && stepsAwayFromMin <= NOTICE_MIN_SIZE_STEPS_AWAY) {
    findings.push({ code: FINDING_CODES.fitMinSizeNear, severity: "注意", target: "話題スロット", detail: MESSAGES.fitMinSizeNear });
  }

  if (isWeekDuplicate) {
    findings.push({ code: FINDING_CODES.weekDuplicate, severity: "注意", target: "週番号", detail: MESSAGES.weekDuplicate });
  }

  if (composition.topicLines.length >= 2) {
    const widths = composition.topicLines.map((l) => l.width).filter((w) => w > 0);
    const shortest = Math.min(...widths);
    const longest = Math.max(...widths);
    if (longest > 0 && shortest / longest < LINE_BALANCE_RATIO_THRESHOLD) {
      findings.push({ code: FINDING_CODES.lineBalance, severity: "注意", target: "話題スロット", detail: MESSAGES.lineBalance });
    }
  }

  if (countTopicChars(composition.topicNormalized) <= SHORT_TOPIC_MAX_LENGTH) {
    findings.push({ code: FINDING_CODES.topicShort, severity: "注意", target: "話題", detail: MESSAGES.topicShort });
  }

  return findings;
}

// 9.2節の判定規則：不適合が1件でもあれば不適合、無ければ注意の有無で分岐する。人手上書き経路を持たない。
export function decideVerdict(findings: readonly Finding[]): Verdict {
  if (findings.some((f) => f.severity === "不適合")) return "不適合";
  if (findings.some((f) => f.severity === "注意")) return "注意付き適合";
  return "適合";
}
