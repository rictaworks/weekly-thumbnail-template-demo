// 11.3節：ファイル名はテンプレートコード・ゼロ埋め3桁の週番号・改訂番号から機械的に組み立てる。話題の文字列は含めない。
export function buildExportFileName(templateCode: string, weekNumber: number, revisionNo: number): string {
  const weekPart = String(weekNumber).padStart(3, "0");
  return `${templateCode}_${weekPart}_r${revisionNo}.png`;
}
