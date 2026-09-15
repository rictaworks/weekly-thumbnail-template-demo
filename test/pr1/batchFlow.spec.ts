import { expect, test } from "@playwright/test";

test.describe("一括生成の主要導線", () => {
  test("一括検証→一括確定→一括書き出しがZIPとしてダウンロードされ、書き出しが履歴に記録される", async ({ page }) => {
    await page.goto("/batch");
    await expect(page.locator("h1")).toHaveText("一括生成");

    await page.locator("textarea").fill("201\t一括テスト話題1\n202\t一括テスト話題2");
    await page.getByRole("button", { name: "検証する" }).click();

    const rows = page.locator("table.data-table tr");
    await expect(rows).toHaveCount(3, { timeout: 10_000 }); // ヘッダー行+2件

    const confirmButton = page.getByRole("button", { name: "適合行を一括確定する" });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    const exportButton = page.getByRole("button", { name: "一括書き出し" });
    await expect(exportButton).toBeEnabled({ timeout: 10_000 });

    const downloadPromise = page.waitForEvent("download");
    await exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^T01_batch\.zip$/);

    // 書き出しが履歴に記録されていること(11.3節)。generations APIには反映されないため、
    // 確定した2件が履歴画面に表示されることで一括確定・書き出しが完了したことを確認する。
    await page.goto("/history");
    await expect(page.locator("table.data-table")).toContainText("201");
    await expect(page.locator("table.data-table")).toContainText("202");
  });
});
