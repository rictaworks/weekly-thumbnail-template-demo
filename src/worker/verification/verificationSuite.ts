import { contrastRatio, grayscaleContrastRatio } from "./color.js";
import { insetRect, rectContains, rectIntersects } from "./geometry.js";
import { getSlot } from "../master/templates.js";
import {
  LISTING_MIN_EFFECTIVE_SIZE_PX,
  LISTING_WIDTH_PX,
  MICRO_WIDTH_PX,
  WEEK_MICRO_MIN_EFFECTIVE_SIZE_PX,
  effectiveSizeAtWidth,
} from "../master/readability.js";
import { MIN_CONTRAST_GRAYSCALE, MIN_CONTRAST_PRIMARY, MIN_CONTRAST_SECONDARY_ACCENT } from "../master/constants.js";
import { FINDING_CODES, MESSAGES } from "../errors/messages.js";
import type { Composition, Finding, Rect, TemplateMaster } from "../types.js";

function topicActualRect(composition: Composition, topicFrame: Rect): Rect {
  const width = Math.max(0, ...composition.topicLines.map((l) => l.width));
  const height = composition.topicLines.length * composition.topicFontSize * 1.35;
  return { x: topicFrame.x, y: topicFrame.y, w: width, h: height };
}

function weekActualRect(composition: Composition, weekFrame: Rect): Rect {
  const width = composition.weekLine.width;
  return {
    x: weekFrame.x + weekFrame.w - width,
    y: weekFrame.y,
    w: width,
    h: composition.weekFontSize,
  };
}

function checkFit(composition: Composition, template: TemplateMaster): Finding[] {
  const topicSlot = getSlot(template, "S-TOPIC");
  const weekSlot = getSlot(template, "S-WEEK");
  const totalHeight = composition.topicLines.length * composition.topicFontSize * topicSlot.typography!.lineHeightRatio;
  const overWidth = composition.topicLines.some((l) => l.width > topicSlot.rect.w);
  const overHeight = totalHeight > topicSlot.rect.h;
  const overWeekWidth = composition.weekLine.width > weekSlot.rect.w;
  if (overWidth || overHeight || overWeekWidth) {
    return [{ code: FINDING_CODES.v1Bounds, severity: "不適合", target: "話題/週番号スロット", detail: MESSAGES.v1Bounds }];
  }
  return [];
}

function checkMinSize(composition: Composition, template: TemplateMaster): Finding[] {
  const topicSlot = getSlot(template, "S-TOPIC");
  if (composition.topicFontSize < topicSlot.typography!.minSize) {
    return [{ code: FINDING_CODES.v2MinSize, severity: "不適合", target: "話題スロット", detail: MESSAGES.v2MinSize }];
  }
  return [];
}

// S-BG/S-BANDは版面全体に敷く背景の塗りであり、セーフマージン・占有禁止領域の判定対象となる「内容」ではない。
const CONTENT_FIXED_SLOTS = new Set(["S-SERIES", "S-MARK"]);

function checkSafeArea(composition: Composition, template: TemplateMaster): Finding[] {
  const topicSlot = getSlot(template, "S-TOPIC");
  const weekSlot = getSlot(template, "S-WEEK");
  const safeArea = insetRect({ x: 0, y: 0, w: template.canvasWidth, h: template.canvasHeight }, template.safeMargin);
  const rects: Rect[] = [
    ...template.slots.filter((s) => CONTENT_FIXED_SLOTS.has(s.code)).map((s) => s.rect),
    topicActualRect(composition, topicSlot.rect),
    weekActualRect(composition, weekSlot.rect),
  ];
  const violated = rects.some((r) => !rectContains(safeArea, r));
  if (violated) {
    return [{ code: FINDING_CODES.v3SafeMargin, severity: "不適合", target: "版面", detail: MESSAGES.v3SafeMargin }];
  }
  return [];
}

function checkForbiddenArea(composition: Composition, template: TemplateMaster): Finding[] {
  if (template.forbiddenAreas.length === 0) return [];
  const topicSlot = getSlot(template, "S-TOPIC");
  const weekSlot = getSlot(template, "S-WEEK");
  const rects: Rect[] = [
    ...template.slots.filter((s) => CONTENT_FIXED_SLOTS.has(s.code)).map((s) => s.rect),
    topicActualRect(composition, topicSlot.rect),
    weekActualRect(composition, weekSlot.rect),
  ];
  const violated = rects.some((r) => template.forbiddenAreas.some((f) => rectIntersects(r, f)));
  if (violated) {
    return [{ code: FINDING_CODES.v4ForbiddenArea, severity: "不適合", target: "版面", detail: MESSAGES.v4ForbiddenArea }];
  }
  return [];
}

function checkScaleReadability(composition: Composition, template: TemplateMaster): Finding[] {
  const findings: Finding[] = [];
  const topicEffective = effectiveSizeAtWidth(composition.topicFontSize, template.canvasWidth, LISTING_WIDTH_PX);
  if (topicEffective < LISTING_MIN_EFFECTIVE_SIZE_PX) {
    findings.push({ code: FINDING_CODES.v5ScaleReadability, severity: "不適合", target: "話題スロット", detail: MESSAGES.v5ScaleReadability });
  }
  const weekEffective = effectiveSizeAtWidth(composition.weekFontSize, template.canvasWidth, MICRO_WIDTH_PX);
  if (weekEffective < WEEK_MICRO_MIN_EFFECTIVE_SIZE_PX) {
    findings.push({ code: FINDING_CODES.v5ScaleReadability, severity: "不適合", target: "週番号スロット", detail: MESSAGES.v5ScaleReadability });
  }
  return findings;
}

function checkContrast(template: TemplateMaster): Finding[] {
  const findings: Finding[] = [];
  if (contrastRatio(template.palette.primaryText, template.palette.band) < MIN_CONTRAST_PRIMARY) {
    findings.push({ code: FINDING_CODES.v6Contrast, severity: "不適合", target: "話題スロット", detail: MESSAGES.v6Contrast });
  }
  if (contrastRatio(template.palette.accent, template.palette.background) < MIN_CONTRAST_SECONDARY_ACCENT) {
    findings.push({ code: FINDING_CODES.v6Contrast, severity: "不適合", target: "週番号スロット", detail: MESSAGES.v6Contrast });
  }
  return findings;
}

function checkGrayscale(template: TemplateMaster): Finding[] {
  const findings: Finding[] = [];
  if (grayscaleContrastRatio(template.palette.primaryText, template.palette.band) < MIN_CONTRAST_GRAYSCALE) {
    findings.push({ code: FINDING_CODES.v7Grayscale, severity: "不適合", target: "話題スロット", detail: MESSAGES.v7Grayscale });
  }
  if (grayscaleContrastRatio(template.palette.accent, template.palette.background) < MIN_CONTRAST_GRAYSCALE) {
    findings.push({ code: FINDING_CODES.v7Grayscale, severity: "不適合", target: "週番号スロット", detail: MESSAGES.v7Grayscale });
  }
  return findings;
}

// 検版項目V1〜V7。入力・組版結果・テンプレートのマスタ値のみから判定を導出し、人手上書き経路を持たない。
export function runVerification(composition: Composition, template: TemplateMaster): Finding[] {
  return [
    ...checkFit(composition, template),
    ...checkMinSize(composition, template),
    ...checkSafeArea(composition, template),
    ...checkForbiddenArea(composition, template),
    ...checkScaleReadability(composition, template),
    ...checkContrast(template),
    ...checkGrayscale(template),
  ];
}
