import { describe, expect, it } from "vitest";
import { sanitizeOrigin } from "./generation.js";

describe("sanitizeOrigin", () => {
  it("許可された値はそのまま通す", () => {
    expect(sanitizeOrigin("単票")).toBe("単票");
    expect(sanitizeOrigin("改訂")).toBe("改訂");
  });

  it.each([undefined, null, 1, {}, "<script>alert(1)</script>", "一括"])("不正な値 %s は単票にフォールバックする", (value) => {
    expect(sanitizeOrigin(value)).toBe("単票");
  });
});
