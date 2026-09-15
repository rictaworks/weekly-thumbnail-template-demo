import { normalizeWeekNumberInput } from "./textNormalizer.js";
import { WEEK_NUMBER_MAX, WEEK_NUMBER_MIN } from "../master/constants.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Finding, TemplateMaster } from "../types.js";

export type WeekNumberResolution = { ok: true; value: number } | { ok: false; finding: Finding };

const INTEGER_ONLY = /^\d+$/;

// 7.2節：週番号の正規化・範囲検証。0・負数・1000以上・小数・数字以外は不受理。
export function resolveWeekNumberFromInput(raw: string): WeekNumberResolution {
  const normalized = normalizeWeekNumberInput(raw);
  if (!INTEGER_ONLY.test(normalized)) {
    return {
      ok: false,
      finding: {
        code: FINDING_CODES.weekRange,
        severity: "不適合",
        target: "週番号",
        detail: MESSAGES.weekRange(WEEK_NUMBER_MIN, WEEK_NUMBER_MAX),
      },
    };
  }
  const value = Number.parseInt(normalized, 10);
  if (value < WEEK_NUMBER_MIN || value > WEEK_NUMBER_MAX) {
    return {
      ok: false,
      finding: {
        code: FINDING_CODES.weekRange,
        severity: "不適合",
        target: "週番号",
        detail: MESSAGES.weekRange(WEEK_NUMBER_MIN, WEEK_NUMBER_MAX),
      },
    };
  }
  return { ok: true, value };
}

// ISO8601週番号を算出する。引数のdateのみに依存し、現在時刻を内部参照しない（決定性要件）。
export function isoWeekNumberFromDate(year: number, month1to12: number, day: number): number {
  const current = new Date(Date.UTC(year, month1to12 - 1, day));
  const dayNum = (current.getUTCDay() + 6) % 7;
  current.setUTCDate(current.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(current.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const diffMs = current.getTime() - firstThursday.getTime();
  return 1 + Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

// 履歴における同一テンプレートの最大週番号+1を初期値とする。履歴が無ければ1。
export function nextWeekNumberFromHistory(existingWeekNumbers: readonly number[]): number {
  if (existingWeekNumbers.length === 0) return WEEK_NUMBER_MIN;
  return Math.max(...existingWeekNumbers) + 1;
}

export function findDuplicateWeekNumber(existingWeekNumbers: readonly number[], weekNumber: number): boolean {
  return existingWeekNumbers.includes(weekNumber);
}

// 週番号の表示形式：接頭辞＋ゼロ埋め（100未満は2桁、100以上は3桁）。
export function formatWeekNumber(weekNumber: number, template: TemplateMaster): string {
  const digits = weekNumber >= 100 ? 3 : 2;
  return `${template.weekPrefix}${String(weekNumber).padStart(digits, "0")}`;
}
