import { halfwidthKatakanaToFullwidth } from "./halfwidthKana.js";

const CONTROL_CHARS_EXCEPT_NEWLINE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const FULLWIDTH_SPACE = /　/g;
const HORIZONTAL_SPACE_RUN = /[ \t]+/g;
const FULLWIDTH_DIGITS = /[０-９]/g;

function stripControlExceptNewline(text: string): string {
  return text.replace(CONTROL_CHARS_EXCEPT_NEWLINE, "");
}

function unifyLineBreaks(text: string): string {
  return text.replace(/\r\n|\r/g, "\n").replace(/\n{2,}/g, "\n");
}

function fullwidthSpaceToHalfwidth(text: string): string {
  return text.replace(FULLWIDTH_SPACE, " ");
}

function collapseSpaces(text: string): string {
  return text.replace(HORIZONTAL_SPACE_RUN, " ");
}

function trimWholeAndEachLine(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

// 7.3節の正規化規則1〜6を順に適用する。話題の入力からのみ呼び出す。
export function normalizeTopic(raw: string): string {
  let text = raw;
  text = stripControlExceptNewline(text);
  text = unifyLineBreaks(text);
  text = fullwidthSpaceToHalfwidth(text);
  text = collapseSpaces(text);
  text = trimWholeAndEachLine(text);
  text = halfwidthKatakanaToFullwidth(text);
  return text;
}

// 7.2節：週番号入力の正規化（全角数字→半角、前後空白除去）。
export function normalizeWeekNumberInput(raw: string): string {
  const halfwidth = raw.replace(FULLWIDTH_DIGITS, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
  return halfwidth.trim();
}

export function countTopicChars(normalized: string): number {
  return Array.from(normalized.replace(/\n/g, "")).length;
}

export function countExplicitBreaks(normalized: string): number {
  return normalized.split("\n").length - 1;
}
