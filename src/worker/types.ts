export type TemplateCode = "T01" | "T02" | "T03";

export type ColorRole = "background" | "band" | "primaryText" | "secondaryText" | "accent";

export type Anchor = "top-left" | "top-right" | "bottom-left" | "none";

export type SlotCode = "S-BG" | "S-BAND" | "S-SERIES" | "S-WEEK" | "S-TOPIC" | "S-MARK";

export type SlotKind = "fixed" | "variable";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Palette {
  readonly background: string;
  readonly band: string;
  readonly primaryText: string;
  readonly secondaryText: string;
  readonly accent: string;
}

export interface TypographySpec {
  readonly maxSize: number;
  readonly minSize: number;
  readonly step: number;
  readonly maxLines: number;
  readonly lineHeightRatio: number;
  readonly letterSpacingEm: number;
}

export interface Slot {
  readonly code: SlotCode;
  readonly kind: SlotKind;
  readonly rect: Rect;
  readonly anchor: Anchor;
  readonly colorRole: ColorRole;
  readonly typography?: TypographySpec;
}

export interface TemplateMaster {
  readonly code: TemplateCode;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly safeMargin: number;
  readonly forbiddenAreas: readonly Rect[];
  readonly palette: Palette;
  readonly slots: readonly Slot[];
  readonly weekPrefix: string;
  readonly seriesName: string;
}

export type Severity = "不適合" | "注意";

export interface Finding {
  readonly code: string;
  readonly severity: Severity;
  readonly target: string;
  readonly detail: string;
}

export type Verdict = "適合" | "注意付き適合" | "不適合";

export interface PlacedLine {
  readonly seq: number;
  readonly text: string;
  readonly width: number;
  readonly baselineY: number;
}

export interface FitResult {
  readonly fontSize: number;
  readonly lines: readonly string[];
  readonly overflow: boolean;
  readonly shortfallChars: number;
}

export interface Composition {
  readonly templateCode: TemplateCode;
  readonly weekNumber: number;
  readonly weekText: string;
  readonly weekFontSize: number;
  readonly weekLine: PlacedLine;
  readonly topicNormalized: string;
  readonly topicFontSize: number;
  readonly topicLines: readonly PlacedLine[];
}
