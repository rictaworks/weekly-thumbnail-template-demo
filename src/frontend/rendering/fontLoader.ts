export const APP_FONT_FAMILY = "AppTopicFont";

export class FontUnavailableError extends Error {}

let loadPromise: Promise<void> | null = null;

// 8.5節：同梱フォントの読み込み完了を待って描画を開始する。代替フォントでの描画は行わない。
export function loadAppFont(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      await document.fonts.load(`1em "${APP_FONT_FAMILY}"`);
      if (!document.fonts.check(`1em "${APP_FONT_FAMILY}"`)) {
        throw new FontUnavailableError("同梱フォントの読み込みに失敗しました");
      }
    } catch (cause) {
      throw new FontUnavailableError("同梱フォントの読み込みに失敗しました", { cause });
    }
  })();
  return loadPromise;
}
