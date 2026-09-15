import { isCoveredChar } from "../data/glyph-widths.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Finding } from "../types.js";

// 収録文字外の文字を検出し、位置（1始まり・改行を除いた文字番号）とともに指摘する。代替字形での描画は行わない前提。
export function checkCharset(normalizedTopic: string): Finding[] {
  const findings: Finding[] = [];
  let position = 0;
  for (const char of normalizedTopic) {
    if (char === "\n") continue;
    position += 1;
    if (!isCoveredChar(char)) {
      findings.push({
        code: FINDING_CODES.topicCharset,
        severity: "不適合",
        target: "話題",
        detail: MESSAGES.topicCharset(char, position),
      });
    }
  }
  return findings;
}
