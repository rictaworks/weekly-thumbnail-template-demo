import type { AppStore } from "../db/store.js";

// JST 03:00にgenerations/generation_lines/findings/batches/batch_items/exportsを削除する。
// テンプレート・禁則・字幅テーブル・フォント等の同梱マスタは対象外。
export async function runDailyReset(store: AppStore): Promise<void> {
  await store.purgeAll();
}
