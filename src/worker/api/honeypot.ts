// Bot対策：単票・一括の各フォームに不可視入力欄を設け、値が入っている送信は受理しない。reCAPTCHAは用いない。
export const HONEYPOT_FIELD_NAME = "contact_note";

export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
