import { expect, test } from "@playwright/test";

test.describe("デモ版共通UI必須要素", () => {
  test("アンバーバナーが最上部に表示される", async ({ page }) => {
    await page.goto("/");
    const banner = page.locator(".demo-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveText("これはデモ版です。データはサーバー再起動時にリセットされる場合があります。");
    await expect(banner).toHaveCSS("background-color", "rgb(217, 119, 6)");
  });

  test("「← デモ一覧へ」リンクが新規タブでrictaworks.jpへ遷移する", async ({ page }) => {
    await page.goto("/");
    const link = page.locator(".app-nav__back-link");
    await expect(link).toHaveAttribute("href", "https://rictaworks.jp/#demos");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("「ご相談はこちら」固定ボタンが新規タブでrictaworks.jpトップへ遷移する", async ({ page }) => {
    await page.goto("/");
    const button = page.locator(".consult-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("href", "https://rictaworks.jp/");
    await expect(button).toHaveAttribute("target", "_blank");
    await expect(button.locator("svg")).toBeVisible();
  });

  test("/legal ページに利用規約・免責事項・連絡先が表示される", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.locator("h1")).toHaveText("利用規約・免責事項・連絡先");
    await expect(page.getByText("利用規約", { exact: true })).toBeVisible();
    await expect(page.getByText("免責事項", { exact: true })).toBeVisible();
    await expect(page.locator("dd", { hasText: "Ricta Works" })).toBeVisible();
    await expect(page.locator("dd", { hasText: "info@rictaworks.jp" })).toBeVisible();
  });

  test("GA4タグが正しい測定IDで埋め込まれている", async ({ page }) => {
    await page.goto("/");
    const gtagScript = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(gtagScript).toHaveAttribute("src", /id=G-C04W1XKS16/);
  });

  test("フッターから/legalへ遷移できる", async ({ page }) => {
    await page.goto("/");
    await page.locator(".app-footer a", { hasText: "利用規約" }).click();
    await expect(page).toHaveURL(/\/legal$/);
  });
});
