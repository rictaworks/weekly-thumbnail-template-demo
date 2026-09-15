// 11.3節：ファイル名はテンプレートコード・ゼロ埋め3桁の週番号・改訂番号から機械的に組み立てる。話題の文字列は含めない。
// worker（保存時の記録）とfrontend（一括書き出しのZIP内ファイル名）の双方から参照する純粋関数のため共有配置とする。
export function buildExportFileName(templateCode: string, weekNumber: number, revisionNo: number): string {
  const weekPart = String(weekNumber).padStart(3, "0");
  return `${templateCode}_${weekPart}_r${revisionNo}.png`;
}
