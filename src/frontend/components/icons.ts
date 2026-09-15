import { faCommentDots, faCircleCheck, faCircleExclamation, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// アイコンはnpm同梱のFontAwesome Freeパッケージから取得する（CDN参照なし・絵文字不使用）。
function iconToSvg(icon: IconDefinition, className: string): string {
  const [width, height, , , pathData] = icon.icon;
  const path = Array.isArray(pathData) ? pathData.join(" ") : pathData;
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;
}

export function commentDotsIconSvg(className = "icon"): string {
  return iconToSvg(faCommentDots, className);
}

export function verdictIconSvg(verdict: string, className = "icon"): string {
  if (verdict === "適合") return iconToSvg(faCircleCheck, className);
  if (verdict === "注意付き適合") return iconToSvg(faCircleExclamation, className);
  return iconToSvg(faCircleXmark, className);
}
