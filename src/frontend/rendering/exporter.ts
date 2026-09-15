import { zipSync } from "fflate";

// 11.3節：書き出しはブラウザ内で完結し、生成画像をサーバへ送信しない。外部通信を伴うライブラリを用いない(fflateはクライアント完結の圧縮のみ)。
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNGの生成に失敗しました"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export interface ZipEntry {
  readonly fileName: string;
  readonly blob: Blob;
}

export async function bundleZip(entries: readonly ZipEntry[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    const buffer = await entry.blob.arrayBuffer();
    files[entry.fileName] = new Uint8Array(buffer);
  }
  const zipped = zipSync(files);
  return new Blob([zipped], { type: "application/zip" });
}
