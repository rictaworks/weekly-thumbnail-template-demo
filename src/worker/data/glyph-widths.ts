// 字幅テーブル（ダミー近似実装）。
// 本来は同梱フォント（サブセット化・再配布可能ライセンス）から抽出した実測の送り幅テーブルを配置するが、
// このセッションではフォント本体の入手ができないため、Unicodeブロック単位の近似比率テーブルで代替する。
// 収録文字の範囲・実測幅は、フォント同梱フェーズ（フロントエンド担当）で本テーブルを置き換えて確定させること。

interface WidthRange {
  readonly from: number;
  readonly to: number;
  readonly ratio: number;
}

// ratio は fontSize に対する送り幅の比率（全角=1.0em 換算）。
const WIDTH_RANGES: readonly WidthRange[] = [
  { from: 0x0020, to: 0x007e, ratio: 0.5 }, // 半角英数記号
  { from: 0x3000, to: 0x3000, ratio: 1.0 }, // 全角スペース（正規化で半角化されるが念のため収録）
  { from: 0x3001, to: 0x303f, ratio: 1.0 }, // 全角句読点・記号
  { from: 0x3040, to: 0x309f, ratio: 1.0 }, // ひらがな
  { from: 0x30a0, to: 0x30ff, ratio: 1.0 }, // カタカナ
  { from: 0x4e00, to: 0x9fff, ratio: 1.0 }, // CJK統合漢字
  { from: 0xff01, to: 0xff60, ratio: 1.0 }, // 全角英数・全角記号
  { from: 0xff61, to: 0xff9f, ratio: 0.6 }, // 半角カタカナ（正規化で全角化されるが念のため収録）
  { from: 0x2010, to: 0x2015, ratio: 1.0 }, // ダッシュ類
  { from: 0x2018, to: 0x201f, ratio: 1.0 }, // 引用符類
  { from: 0x2025, to: 0x2026, ratio: 1.0 }, // 二点/三点リーダ
];

export function charWidthRatio(char: string): number | undefined {
  const code = char.codePointAt(0);
  if (code === undefined) return undefined;
  for (const range of WIDTH_RANGES) {
    if (code >= range.from && code <= range.to) return range.ratio;
  }
  return undefined;
}

export function isCoveredChar(char: string): boolean {
  return charWidthRatio(char) !== undefined;
}
