import { evaluateGeneration } from "./generationEvaluator.js";
import { resolveWeekNumberFromInput } from "./weekNumberResolver.js";
import { BATCH_MAX_ROWS, BATCH_MAX_ROW_LENGTH } from "../master/constants.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Composition, Finding, TemplateMaster, Verdict } from "../types.js";

export interface BatchRowResult {
  readonly seq: number;
  readonly weekNumber: number | null;
  readonly topicRaw: string;
  readonly composition: Composition | null;
  readonly findings: readonly Finding[];
  readonly verdict: Verdict;
}

// 10章：1行1件・タブ区切り・上限50行。行欠落・列不足・上限超過はジョブ全体を不受理とせず該当行の指摘とする。
export function validateBatch(
  template: TemplateMaster,
  rawText: string,
  existingWeekNumbers: readonly number[],
): BatchRowResult[] {
  const trimmed = rawText.trim();
  const lines = trimmed.length === 0 ? [] : trimmed.split(/\r\n|\r|\n/);
  const results: BatchRowResult[] = [];
  const seenInJob = new Set<number>();

  lines.forEach((line, index) => {
    const seq = index + 1;

    if (seq > BATCH_MAX_ROWS) {
      results.push({
        seq,
        weekNumber: null,
        topicRaw: "",
        composition: null,
        findings: [{ code: FINDING_CODES.batchLimitExceeded, severity: "不適合", target: `${seq}行目`, detail: MESSAGES.batchRowLimitExceeded(BATCH_MAX_ROWS) }],
        verdict: "不適合",
      });
      return;
    }

    if (line.length > BATCH_MAX_ROW_LENGTH) {
      results.push({
        seq,
        weekNumber: null,
        topicRaw: "",
        composition: null,
        findings: [{ code: FINDING_CODES.batchColumnMissing, severity: "不適合", target: `${seq}行目`, detail: MESSAGES.batchColumnMissing }],
        verdict: "不適合" as Verdict,
      });
      return;
    }

    const cols = line.split("\t");
    if (cols.length < 2 || (cols[0] as string).trim() === "") {
      results.push({
        seq,
        weekNumber: null,
        topicRaw: "",
        composition: null,
        findings: [{ code: FINDING_CODES.batchColumnMissing, severity: "不適合", target: `${seq}行目`, detail: MESSAGES.batchColumnMissing }],
        verdict: "不適合",
      });
      return;
    }

    const weekNumberRaw = cols[0] as string;
    const topicRaw = cols.slice(1).join("\t");
    const weekResolution = resolveWeekNumberFromInput(weekNumberRaw);

    if (!weekResolution.ok) {
      results.push({
        seq,
        weekNumber: null,
        topicRaw,
        composition: null,
        findings: [{ ...weekResolution.finding, target: `${seq}行目` }],
        verdict: "不適合",
      });
      return;
    }

    const isDuplicateInHistory = existingWeekNumbers.includes(weekResolution.value);
    const isDuplicateInJob = seenInJob.has(weekResolution.value);
    seenInJob.add(weekResolution.value);

    const evaluation = evaluateGeneration(template, weekResolution.value, topicRaw, isDuplicateInHistory || isDuplicateInJob);
    results.push({
      seq,
      weekNumber: weekResolution.value,
      topicRaw,
      composition: evaluation.composition,
      findings: evaluation.findings.map((f) => ({ ...f, target: `${seq}行目 ${f.target}` })),
      verdict: evaluation.verdict,
    });
  });

  return results;
}

export function confirmableRows(rows: readonly BatchRowResult[]): BatchRowResult[] {
  return rows.filter((r) => r.verdict === "適合" || r.verdict === "注意付き適合");
}
