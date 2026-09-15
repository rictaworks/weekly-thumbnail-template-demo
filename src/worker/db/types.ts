export interface SessionRow {
  readonly sessionId: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
}

export interface GenerationRow {
  readonly id: string;
  readonly sessionId: string;
  readonly templateCode: string;
  readonly weekNumber: number;
  readonly topicRaw: string;
  readonly topicNormalized: string;
  readonly fontSize: number;
  readonly lineCount: number;
  readonly verdict: string;
  readonly revisionNo: number;
  readonly origin: string;
  readonly createdAt: string;
}

export interface GenerationLineRow {
  readonly id: string;
  readonly sessionId: string;
  readonly generationId: string;
  readonly seq: number;
  readonly text: string;
  readonly width: number;
  readonly baselineY: number;
}

export interface FindingRow {
  readonly id: string;
  readonly sessionId: string;
  readonly generationId: string | null;
  readonly batchItemId: string | null;
  readonly code: string;
  readonly severity: string;
  readonly target: string;
  readonly detail: string;
}

export interface BatchRow {
  readonly id: string;
  readonly sessionId: string;
  readonly templateCode: string;
  readonly itemCount: number;
  readonly state: string;
  readonly createdAt: string;
}

export interface BatchItemRow {
  readonly id: string;
  readonly sessionId: string;
  readonly batchId: string;
  readonly seq: number;
  readonly weekNumber: number;
  readonly topicRaw: string;
  readonly verdict: string;
  readonly generationId: string | null;
  readonly state: string;
}

export interface ExportRow {
  readonly id: string;
  readonly sessionId: string;
  readonly generationId: string;
  readonly fileName: string;
  readonly kind: string;
  readonly exportedAt: string;
}
