import { expect, test } from "@playwright/test";

test.describe("単票生成の主要導線", () => {
  test("テンプレート選択→入力→プレビュー→確定→PNG書き出し", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("テンプレートを選択してください");

    await page.locator(".template-grid button", { hasText: "このテンプレートで作成する" }).first().click();
    await expect(page).toHaveURL(/\/generate\?template=T01/);
    await expect(page.locator("h1")).toHaveText("単票生成");

    await page.locator('input[placeholder="直接入力"]').fill("12");
    await page.locator("textarea").fill("今週の新商品についてのお知らせです");

    const verdictBadge = page.locator(".verdict-badge");
    await expect(verdictBadge).toBeVisible({ timeout: 10_000 });
    await expect(verdictBadge).toHaveAttribute("data-verdict", "適合");

    const canvas = page.locator(".card canvas").first();
    await expect(canvas).toBeVisible();

    const confirmButton = page.getByRole("button", { name: "確定する" });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(confirmButton).toBeDisabled();

    const exportButton = page.getByRole("button", { name: "PNGを書き出す" });
    await expect(exportButton).toBeEnabled();
    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^T01_012_r1\.png$/);
  });

  test("確定した生成が履歴画面に表示される", async ({ page }) => {
    await page.goto("/generate?template=T02");
    await page.locator('input[placeholder="直接入力"]').fill("30");
    await page.locator("textarea").fill("秋の新商品についてのお知らせです");
    await expect(page.locator(".verdict-badge")).toHaveAttribute("data-verdict", "適合", { timeout: 10_000 });
    await page.getByRole("button", { name: "確定する" }).click();

    await page.goto("/history");
    await expect(page.locator("table.data-table")).toContainText("T02");
    await expect(page.locator("table.data-table")).toContainText("30");
  });

  test("ハニーポット欄は画面外に配置され利用者には見えない", async ({ page }) => {
    await page.goto("/generate");
    const honeypot = page.locator(".honeypot-field");
    await expect(honeypot).toBeAttached();
    const box = await honeypot.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeLessThan(0);
  });
});
