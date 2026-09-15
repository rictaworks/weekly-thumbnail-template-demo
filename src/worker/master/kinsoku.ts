// 行末禁則（開き括弧）16文字。requirements.md 6.6節の件数に合わせた固定リスト。
export const LINE_END_FORBIDDEN: readonly string[] = [
  "（", "(", "｢", "「", "『", "〔", "【", "《", "〈", "｛", "{", "［", "[", "〘", "〖", "“",
];

// 行頭禁則42文字（句読点4・閉じ括弧16・中黒1・長音記号1・繰り返し記号4・小書き仮名10・感嘆符2・疑問符2・コロン1・セミコロン1）。
export const LINE_START_FORBIDDEN: readonly string[] = [
  "、", "。", "，", "．",
  "）", ")", "｣", "」", "』", "〕", "】", "》", "〉", "｝", "}", "］", "]", "〙", "〗", "”",
  "・",
  "ー",
  "ゝ", "ゞ", "々", "〃",
  "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "っ", "ゃ", "ゅ", "ょ", "ゎ",
  "!", "！",
  "?", "？",
  "：",
  "；",
];

export const HANGING_ALLOWED: readonly string[] = ["、", "。", "，", "．"];

const HALFWIDTH_ALNUM = /^[0-9A-Za-z]$/;
const UNIT_CHARS = new Set(["%", "円", "個", "分", "秒", "人", "件", "回", "％", "㎏", "㎜", "km", "cm"]);
const EXCLAIM_QUESTION = new Set(["!", "！", "?", "？"]);
const ELLIPSIS_CHARS = new Set(["…", "‥"]);
const DASH_CHARS = new Set(["ー", "—", "―", "-"]);

// 分離禁止の連なり規則5：隣接2文字の間を分割してはならないかを判定する。
export function isUnbreakablePair(left: string, right: string): boolean {
  if (HALFWIDTH_ALNUM.test(left) && HALFWIDTH_ALNUM.test(right)) return true;
  if (HALFWIDTH_ALNUM.test(left) && UNIT_CHARS.has(right)) return true;
  if (EXCLAIM_QUESTION.has(left) && EXCLAIM_QUESTION.has(right)) return true;
  if (ELLIPSIS_CHARS.has(left) && ELLIPSIS_CHARS.has(right)) return true;
  if (DASH_CHARS.has(left) && DASH_CHARS.has(right)) return true;
  return false;
}

export function isLineStartForbidden(char: string): boolean {
  return LINE_START_FORBIDDEN.includes(char);
}

export function isLineEndForbidden(char: string): boolean {
  return LINE_END_FORBIDDEN.includes(char);
}

export function isHangingAllowed(char: string): boolean {
  return HANGING_ALLOWED.includes(char);
}
