export const LISTING_WIDTH_PX = 360;
export const MICRO_WIDTH_PX = 210;
export const LISTING_MIN_EFFECTIVE_SIZE_PX = 14;
export const WEEK_MICRO_MIN_EFFECTIVE_SIZE_PX = 8;

export function effectiveSizeAtWidth(fontSize: number, canvasWidth: number, targetWidth: number): number {
  return fontSize * (targetWidth / canvasWidth);
}
