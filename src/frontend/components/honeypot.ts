import { GENERATE_PAGE } from "../strings/ja.js";

export const HONEYPOT_FIELD_NAME = "contact_note";

export interface HoneypotField {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
}

// Bot対策：単票・一括の各フォームに不可視入力欄を設ける。値が入っていればバックエンドが拒否する。
export function createHoneypotField(): HoneypotField {
  const wrapper = document.createElement("div");
  wrapper.className = "honeypot-field";
  wrapper.setAttribute("aria-hidden", "true");

  const label = document.createElement("label");
  label.textContent = GENERATE_PAGE.honeypotLabel;
  label.setAttribute("for", HONEYPOT_FIELD_NAME);

  const input = document.createElement("input");
  input.type = "text";
  input.id = HONEYPOT_FIELD_NAME;
  input.name = HONEYPOT_FIELD_NAME;
  input.tabIndex = -1;
  input.autocomplete = "off";

  wrapper.append(label, input);
  return { element: wrapper, input };
}
