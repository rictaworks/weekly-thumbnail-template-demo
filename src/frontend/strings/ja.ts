// 画面文言・外部リンク・連絡先を一元管理する。UIコンポーネントからのハードコードを禁止する（ハードコード検出テストで担保）。
export const APP_NAME = "週次サムネイル生成テンプレート";

export const DEMO_BANNER_TEXT = "これはデモ版です。データはサーバー再起動時にリセットされる場合があります。";

export const NAV = {
  backToDemoList: "← デモ一覧へ",
  backToDemoListUrl: "https://rictaworks.jp/#demos",
  templateSelect: "テンプレート選択",
  generate: "単票生成",
  verify: "検版",
  batch: "一括生成",
  history: "履歴",
};

export const CONSULT_BUTTON = {
  label: "ご相談はこちら",
  url: "https://rictaworks.jp/",
};

export const GA4_MEASUREMENT_ID = "G-C04W1XKS16";

export const LEGAL = {
  backToApp: "← アプリに戻る",
  title: "利用規約・免責事項・連絡先",
  termsHeading: "利用規約",
  terms: [
    "本サービスはデモ版として無償で提供します。",
    "本サービスは予告なく変更・停止する場合があります。",
    "生成した画像の利用は利用者の責任において行ってください。",
  ],
  disclaimerHeading: "免責事項",
  disclaimer: [
    "本サービスの利用により生じたいかなる損害についても、運営者は責任を負いません。",
    "生成履歴は日次リセットにより当日限りで消去されます。バックアップは利用者ご自身で行ってください。",
  ],
  contactHeading: "連絡先",
  contact: {
    name: "屋号",
    nameValue: "Ricta Works",
    address: "住所",
    addressValue: "〒190-0022 東京都立川市錦町1丁目4-20 TSCビル5階",
    tel: "電話",
    telValue: "070-5148-0380",
    email: "メール",
    emailValue: "info@rictaworks.jp",
    web: "Web",
    webValue: "https://rictaworks.jp",
    x: "X",
    xValue: "@rictaworks",
    xUrl: "https://x.com/rictaworks",
    github: "GitHub",
    githubValue: "github.com/rictaworks",
    githubUrl: "https://github.com/rictaworks",
  },
};

export const FOOTER = {
  legalLink: "利用規約・免責事項・連絡先",
  copyright: "© 2026 Ricta Works",
  fontLicense: "本文フォント: IPAゴシック（IPAフォントライセンスv1.0）",
  fontLicenseUrl: "/fonts/licenses/IPAFONT_LICENSE.txt",
};

export const TEMPLATE_SELECT_PAGE = {
  heading: "テンプレートを選択してください",
  editNotice: "配色と配置は編集できません。",
  selectButton: "このテンプレートで作成する",
};

export const GENERATE_PAGE = {
  heading: "単票生成",
  weekNumberLabel: "週番号",
  weekNumberDirect: "直接入力",
  weekNumberFromDate: "日付から算出",
  weekNumberAuto: "履歴から自動採番",
  weekNumberDatePicker: "日付を選択",
  topicLabel: "話題",
  topicPlaceholder: "話題を入力してください（明示改行を含めてよい）",
  charCount: (count: number, max: number) => `${count} / ${max}文字`,
  previewHeading: "プレビュー",
  compositionHeading: "組版情報",
  compositionFontSize: (size: number) => `採用サイズ: ${size}px`,
  compositionLineCount: (count: number) => `行数: ${count}`,
  verdictHeading: "判定",
  confirmButton: "確定する",
  exportButton: "PNGを書き出す",
  verifyLinkButton: "検版画面へ",
  honeypotLabel: "この項目は入力しないでください",
};

export const VERIFY_PAGE = {
  heading: "検版",
  actualSize: "原寸",
  listingWidth: "一覧表示幅(360px)",
  microWidth: "超縮小表示幅(210px)",
  grayscale: "グレースケール",
  overlaySafeMargin: "セーフマージン表示",
  overlayForbiddenArea: "占有禁止領域表示",
  overlaySlotBounds: "スロット枠表示",
  checklistHeading: "検版項目",
};

export const BATCH_PAGE = {
  heading: "一括生成",
  formatNotice: "1行1件、1列目に週番号・2列目に話題をタブ区切りで入力してください（最大50行）。",
  inputPlaceholder: "1\t今週の新商品について\n2\t秋のキャンペーン開始",
  validateButton: "検証する",
  confirmButton: "適合行を一括確定する",
  exportButton: "一括書き出し",
  rowSeq: "行",
  rowWeekNumber: "週番号",
  rowTopic: "話題",
  rowVerdict: "判定",
  rowFontSize: "採用サイズ",
  rowLineCount: "行数",
  honeypotLabel: "この項目は入力しないでください",
};

export const HISTORY_PAGE = {
  heading: "履歴",
  resetNotice: "生成履歴は日次リセットにより当日限りで消去されます。",
  columnTemplate: "テンプレート",
  columnWeekNumber: "週番号",
  columnRevision: "改訂番号",
  columnVerdict: "判定",
  columnCreatedAt: "確定時刻",
  reproduceButton: "再現する",
  reExportButton: "再書き出し",
  empty: "履歴はまだありません。",
};

export const VERDICT_LABEL: Record<string, string> = {
  適合: "適合",
  注意付き適合: "注意付き適合",
  不適合: "不適合",
};

export const COMMON = {
  loading: "読み込み中...",
  errorGeneric: "処理に失敗しました。時間をおいて再度お試しください。",
};
