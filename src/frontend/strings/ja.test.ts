import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONSULT_BUTTON, DEMO_BANNER_TEXT, GA4_MEASUREMENT_ID, LEGAL, NAV } from "./ja.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "..");

describe("デモ版共通UI必須要素の文言・値", () => {
  it("アンバーバナーの文言が仕様通りである", () => {
    expect(DEMO_BANNER_TEXT).toBe("これはデモ版です。データはサーバー再起動時にリセットされる場合があります。");
  });

  it("デモ一覧への戻りリンク先がrictaworks.jpである", () => {
    expect(NAV.backToDemoListUrl).toBe("https://rictaworks.jp/#demos");
  });

  it("ご相談はこちらボタンのリンク先がrictaworks.jpトップである", () => {
    expect(CONSULT_BUTTON.url).toBe("https://rictaworks.jp/");
  });

  it("GA4測定IDが仕様通りである", () => {
    expect(GA4_MEASUREMENT_ID).toBe("G-C04W1XKS16");
  });

  it("連絡先情報が7項目とも設定されている", () => {
    expect(LEGAL.contact.nameValue).toBe("Ricta Works");
    expect(LEGAL.contact.addressValue).toContain("東京都立川市");
    expect(LEGAL.contact.telValue).toBe("070-5148-0380");
    expect(LEGAL.contact.emailValue).toBe("info@rictaworks.jp");
    expect(LEGAL.contact.webValue).toBe("https://rictaworks.jp");
    expect(LEGAL.contact.xValue).toBe("@rictaworks");
    expect(LEGAL.contact.githubValue).toBe("github.com/rictaworks");
  });
});

function collectTsFiles(dir: string, exclude: readonly string[]): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (exclude.some((ex) => fullPath.endsWith(ex))) continue;
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath, exclude));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("ハードコード検出：画面文言はstrings/ja.tsに集約されている", () => {
  const excluded = [join("strings", "ja.ts")];
  const sourceFiles = collectTsFiles(FRONTEND_ROOT, excluded);

  it.each([
    ["アンバーバナー文言", DEMO_BANNER_TEXT],
    ["デモ一覧リンクURL", NAV.backToDemoListUrl],
    ["ご相談はこちらリンクURL", CONSULT_BUTTON.url],
    ["連絡先住所", LEGAL.contact.addressValue],
    ["連絡先電話番号", LEGAL.contact.telValue],
  ])("%s はコンポーネント/ページのソースに直接埋め込まれていない", (_label, literal) => {
    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf-8");
      expect(content.includes(literal), `${file} にハードコードされています`).toBe(false);
    }
  });
});
