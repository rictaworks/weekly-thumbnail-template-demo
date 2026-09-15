export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
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
  readonly code: string;
  readonly kind: "fixed" | "variable";
  readonly rect: Rect;
  readonly anchor: string;
  readonly colorRole: string;
  readonly typography?: TypographySpec;
}

export interface Palette {
  readonly background: string;
  readonly band: string;
  readonly primaryText: string;
  readonly secondaryText: string;
  readonly accent: string;
}

export interface TemplateMaster {
  readonly code: string;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly safeMargin: number;
  readonly forbiddenAreas: readonly Rect[];
  readonly palette: Palette;
  readonly slots: readonly Slot[];
  readonly weekPrefix: string;
  readonly seriesName: string;
}

export interface PlacedLine {
  readonly seq: number;
  readonly text: string;
  readonly width: number;
  readonly baselineY: number;
}

export interface Composition {
  readonly templateCode: string;
  readonly weekNumber: number;
  readonly weekText: string;
  readonly weekFontSize: number;
  readonly weekLine: PlacedLine;
  readonly topicNormalized: string;
  readonly topicFontSize: number;
  readonly topicLines: readonly PlacedLine[];
}

export interface Finding {
  readonly code: string;
  readonly severity: "不適合" | "注意";
  readonly target: string;
  readonly detail: string;
}

export type Verdict = "適合" | "注意付き適合" | "不適合";

export interface EvaluateResponse {
  readonly verdict: Verdict;
  readonly findings: readonly Finding[];
  readonly composition: Composition | null;
  readonly weekText: string | null;
  readonly topicNormalized: string | null;
  readonly isWeekDuplicate?: boolean;
}

export interface GenerationRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly templateCode: string;
  readonly weekNumber: number;
  readonly topicRaw: string;
  readonly topicNormalized: string;
  readonly fontSize: number;
  readonly lineCount: number;
  readonly verdict: Verdict;
  readonly revisionNo: number;
  readonly origin: string;
  readonly createdAt: string;
}

export interface GenerationLineRecord {
  readonly id: string;
  readonly generationId: string;
  readonly seq: number;
  readonly text: string;
  readonly width: number;
  readonly baselineY: number;
}

export interface GenerationDetail {
  readonly generation: GenerationRecord;
  readonly lines: readonly GenerationLineRecord[];
  readonly findings: readonly Finding[];
  readonly weekLine: PlacedLine | null;
}

export interface ConfirmResponse {
  readonly generation: GenerationRecord;
  readonly verdict: Verdict;
  readonly findings: readonly Finding[];
}

export interface BatchRowResponse {
  readonly seq: number;
  readonly weekNumber: number | null;
  readonly topicRaw: string;
  readonly composition: Composition | null;
  readonly findings: readonly Finding[];
  readonly verdict: Verdict;
}

export interface BatchConfirmResponse {
  readonly batchId: string;
  readonly confirmedCount: number;
  readonly totalCount: number;
  readonly rows: readonly BatchRowResponse[];
}
