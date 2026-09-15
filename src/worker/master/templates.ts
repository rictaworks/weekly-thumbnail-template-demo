import { PALETTE } from "./palette.js";
import type { TemplateMaster, TemplateCode } from "../types.js";

const TOPIC_TYPOGRAPHY_T01 = {
  maxSize: 128,
  minSize: 64,
  step: 4,
  maxLines: 3,
  lineHeightRatio: 1.35,
  letterSpacingEm: 0.02,
};

const WEEK_TYPOGRAPHY_T01 = {
  maxSize: 64,
  minSize: 64,
  step: 4,
  maxLines: 1,
  lineHeightRatio: 1,
  letterSpacingEm: 0.04,
};

const TOPIC_TYPOGRAPHY_T02 = {
  maxSize: 112,
  minSize: 56,
  step: 4,
  maxLines: 3,
  lineHeightRatio: 1.35,
  letterSpacingEm: 0.02,
};

const WEEK_TYPOGRAPHY_T02 = {
  maxSize: 56,
  minSize: 56,
  step: 4,
  maxLines: 1,
  lineHeightRatio: 1,
  letterSpacingEm: 0.04,
};

const TOPIC_TYPOGRAPHY_T03 = {
  maxSize: 120,
  minSize: 60,
  step: 4,
  maxLines: 4,
  lineHeightRatio: 1.35,
  letterSpacingEm: 0.02,
};

const WEEK_TYPOGRAPHY_T03 = {
  maxSize: 60,
  minSize: 60,
  step: 4,
  maxLines: 1,
  lineHeightRatio: 1,
  letterSpacingEm: 0.04,
};

// T02/T03のスロット座標はrequirements.md 6.4節（T01実数値）を版面比率で按分して導出した値（6.4節注記の通り、寸法のみがテンプレート間で異なる）。
const TEMPLATE_T01: TemplateMaster = {
  code: "T01",
  canvasWidth: 1280,
  canvasHeight: 720,
  safeMargin: 48,
  forbiddenAreas: [{ x: 1130, y: 660, w: 150, h: 60 }],
  palette: PALETTE,
  weekPrefix: "第",
  seriesName: "WEEKLY SERIES",
  slots: [
    { code: "S-BG", kind: "fixed", rect: { x: 0, y: 0, w: 1280, h: 720 }, anchor: "none", colorRole: "background" },
    { code: "S-BAND", kind: "fixed", rect: { x: 0, y: 176, w: 1280, h: 448 }, anchor: "none", colorRole: "band" },
    {
      code: "S-SERIES",
      kind: "fixed",
      rect: { x: 64, y: 48, w: 640, h: 48 },
      anchor: "top-left",
      colorRole: "secondaryText",
    },
    {
      code: "S-WEEK",
      kind: "variable",
      rect: { x: 704, y: 48, w: 512, h: 72 },
      anchor: "top-right",
      colorRole: "accent",
      typography: WEEK_TYPOGRAPHY_T01,
    },
    {
      code: "S-TOPIC",
      kind: "variable",
      rect: { x: 64, y: 208, w: 1152, h: 384 },
      anchor: "top-left",
      colorRole: "primaryText",
      typography: TOPIC_TYPOGRAPHY_T01,
    },
    {
      code: "S-MARK",
      kind: "fixed",
      rect: { x: 64, y: 616, w: 56, h: 56 },
      anchor: "bottom-left",
      colorRole: "accent",
    },
  ],
};

const TEMPLATE_T02: TemplateMaster = {
  code: "T02",
  canvasWidth: 1200,
  canvasHeight: 630,
  safeMargin: 48,
  forbiddenAreas: [],
  palette: PALETTE,
  weekPrefix: "第",
  seriesName: "WEEKLY SERIES",
  slots: [
    { code: "S-BG", kind: "fixed", rect: { x: 0, y: 0, w: 1200, h: 630 }, anchor: "none", colorRole: "background" },
    { code: "S-BAND", kind: "fixed", rect: { x: 0, y: 154, w: 1200, h: 392 }, anchor: "none", colorRole: "band" },
    {
      code: "S-SERIES",
      kind: "fixed",
      rect: { x: 64, y: 48, w: 600, h: 42 },
      anchor: "top-left",
      colorRole: "secondaryText",
    },
    {
      code: "S-WEEK",
      kind: "variable",
      rect: { x: 656, y: 48, w: 480, h: 63 },
      anchor: "top-right",
      colorRole: "accent",
      typography: WEEK_TYPOGRAPHY_T02,
    },
    {
      code: "S-TOPIC",
      kind: "variable",
      rect: { x: 64, y: 182, w: 1072, h: 336 },
      anchor: "top-left",
      colorRole: "primaryText",
      typography: TOPIC_TYPOGRAPHY_T02,
    },
    {
      code: "S-MARK",
      kind: "fixed",
      rect: { x: 64, y: 533, w: 52, h: 49 },
      anchor: "bottom-left",
      colorRole: "accent",
    },
  ],
};

const TEMPLATE_T03: TemplateMaster = {
  code: "T03",
  canvasWidth: 1080,
  canvasHeight: 1080,
  safeMargin: 56,
  forbiddenAreas: [],
  palette: PALETTE,
  weekPrefix: "第",
  seriesName: "WEEKLY SERIES",
  slots: [
    { code: "S-BG", kind: "fixed", rect: { x: 0, y: 0, w: 1080, h: 1080 }, anchor: "none", colorRole: "background" },
    { code: "S-BAND", kind: "fixed", rect: { x: 0, y: 264, w: 1080, h: 672 }, anchor: "none", colorRole: "band" },
    {
      code: "S-SERIES",
      kind: "fixed",
      rect: { x: 72, y: 56, w: 540, h: 72 },
      anchor: "top-left",
      colorRole: "secondaryText",
    },
    {
      code: "S-WEEK",
      kind: "variable",
      rect: { x: 576, y: 56, w: 432, h: 108 },
      anchor: "top-right",
      colorRole: "accent",
      typography: WEEK_TYPOGRAPHY_T03,
    },
    {
      code: "S-TOPIC",
      kind: "variable",
      rect: { x: 72, y: 312, w: 936, h: 576 },
      anchor: "top-left",
      colorRole: "primaryText",
      typography: TOPIC_TYPOGRAPHY_T03,
    },
    {
      code: "S-MARK",
      kind: "fixed",
      rect: { x: 72, y: 940, w: 47, h: 84 },
      anchor: "bottom-left",
      colorRole: "accent",
    },
  ],
};

export const TEMPLATES: Readonly<Record<TemplateCode, TemplateMaster>> = {
  T01: TEMPLATE_T01,
  T02: TEMPLATE_T02,
  T03: TEMPLATE_T03,
};

export function getTemplate(code: string): TemplateMaster | undefined {
  if (!Object.prototype.hasOwnProperty.call(TEMPLATES, code)) return undefined;
  return (TEMPLATES as Record<string, TemplateMaster>)[code];
}

export function isTemplateCode(code: string): code is TemplateCode {
  return code === "T01" || code === "T02" || code === "T03";
}

export function getSlot(template: TemplateMaster, code: "S-WEEK" | "S-TOPIC") {
  const slot = template.slots.find((s) => s.code === code);
  if (!slot || !slot.typography) {
    throw new Error(`可変スロット ${code} がテンプレート ${template.code} に見つかりません`);
  }
  return slot;
}
