// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createHoneypotField, HONEYPOT_FIELD_NAME } from "./honeypot.js";

describe("createHoneypotField", () => {
  it("視覚的に隠された不可視入力欄を生成する", () => {
    const { element, input } = createHoneypotField();
    expect(element.className).toBe("honeypot-field");
    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(input.name).toBe(HONEYPOT_FIELD_NAME);
    expect(input.tabIndex).toBe(-1);
    expect(element.contains(input)).toBe(true);
  });

  it("初期値は空である", () => {
    const { input } = createHoneypotField();
    expect(input.value).toBe("");
  });
});
