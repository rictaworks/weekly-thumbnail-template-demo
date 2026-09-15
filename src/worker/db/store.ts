import type { BatchItemRow, BatchRow, ExportRow, FindingRow, GenerationLineRow, GenerationRow, SessionRow } from "./types.js";

// 全メソッドがsessionIdを必須引数にとり、参照条件へ必ず含める(セッション分離の要件)。
export interface AppStore {
  upsertSession(row: SessionRow): Promise<void>;

  insertGeneration(row: GenerationRow): Promise<void>;
  insertGenerationLines(rows: readonly GenerationLineRow[]): Promise<void>;
  insertFindings(rows: readonly FindingRow[]): Promise<void>;
  selectGenerationsBySessionAndTemplate(sessionId: string, templateCode: string): Promise<GenerationRow[]>;
  selectGenerationById(sessionId: string, id: string): Promise<GenerationRow | null>;
  selectGenerationLines(sessionId: string, generationId: string): Promise<GenerationLineRow[]>;
  selectFindingsByGeneration(sessionId: string, generationId: string): Promise<FindingRow[]>;
  selectAllGenerationsBySession(sessionId: string): Promise<GenerationRow[]>;

  insertBatch(row: BatchRow): Promise<void>;
  insertBatchItems(rows: readonly BatchItemRow[]): Promise<void>;
  selectBatchById(sessionId: string, id: string): Promise<BatchRow | null>;
  selectBatchItems(sessionId: string, batchId: string): Promise<BatchItemRow[]>;
  updateBatchItem(sessionId: string, id: string, patch: Partial<BatchItemRow>): Promise<void>;

  insertExport(row: ExportRow): Promise<void>;
  selectExportsByGeneration(sessionId: string, generationId: string): Promise<ExportRow[]>;

  purgeAll(): Promise<void>;
}

// テスト用インメモリ実装。SQLを介さずロジックのみを検証する。
export class InMemoryStore implements AppStore {
  private sessions: SessionRow[] = [];
  private generations: GenerationRow[] = [];
  private generationLines: GenerationLineRow[] = [];
  private findings: FindingRow[] = [];
  private batches: BatchRow[] = [];
  private batchItems: BatchItemRow[] = [];
  private exports: ExportRow[] = [];

  async upsertSession(row: SessionRow): Promise<void> {
    const idx = this.sessions.findIndex((s) => s.sessionId === row.sessionId);
    if (idx >= 0) {
      const existing = this.sessions[idx] as SessionRow;
      this.sessions[idx] = { ...existing, lastSeenAt: row.lastSeenAt };
    } else {
      this.sessions.push(row);
    }
  }

  async insertGeneration(row: GenerationRow): Promise<void> {
    this.generations.push(row);
  }

  async insertGenerationLines(rows: readonly GenerationLineRow[]): Promise<void> {
    this.generationLines.push(...rows);
  }

  async insertFindings(rows: readonly FindingRow[]): Promise<void> {
    this.findings.push(...rows);
  }

  async selectGenerationsBySessionAndTemplate(sessionId: string, templateCode: string): Promise<GenerationRow[]> {
    return this.generations.filter((g) => g.sessionId === sessionId && g.templateCode === templateCode);
  }

  async selectGenerationById(sessionId: string, id: string): Promise<GenerationRow | null> {
    return this.generations.find((g) => g.sessionId === sessionId && g.id === id) ?? null;
  }

  async selectGenerationLines(sessionId: string, generationId: string): Promise<GenerationLineRow[]> {
    return this.generationLines
      .filter((l) => l.sessionId === sessionId && l.generationId === generationId)
      .sort((a, b) => a.seq - b.seq);
  }

  async selectFindingsByGeneration(sessionId: string, generationId: string): Promise<FindingRow[]> {
    return this.findings.filter((f) => f.sessionId === sessionId && f.generationId === generationId);
  }

  async selectAllGenerationsBySession(sessionId: string): Promise<GenerationRow[]> {
    return this.generations.filter((g) => g.sessionId === sessionId);
  }

  async insertBatch(row: BatchRow): Promise<void> {
    this.batches.push(row);
  }

  async insertBatchItems(rows: readonly BatchItemRow[]): Promise<void> {
    this.batchItems.push(...rows);
  }

  async selectBatchById(sessionId: string, id: string): Promise<BatchRow | null> {
    return this.batches.find((b) => b.sessionId === sessionId && b.id === id) ?? null;
  }

  async selectBatchItems(sessionId: string, batchId: string): Promise<BatchItemRow[]> {
    return this.batchItems
      .filter((i) => i.sessionId === sessionId && i.batchId === batchId)
      .sort((a, b) => a.seq - b.seq);
  }

  async updateBatchItem(sessionId: string, id: string, patch: Partial<BatchItemRow>): Promise<void> {
    const idx = this.batchItems.findIndex((i) => i.sessionId === sessionId && i.id === id);
    if (idx < 0) return;
    this.batchItems[idx] = { ...(this.batchItems[idx] as BatchItemRow), ...patch };
  }

  async insertExport(row: ExportRow): Promise<void> {
    this.exports.push(row);
  }

  async selectExportsByGeneration(sessionId: string, generationId: string): Promise<ExportRow[]> {
    return this.exports.filter((e) => e.sessionId === sessionId && e.generationId === generationId);
  }

  async purgeAll(): Promise<void> {
    this.generations = [];
    this.generationLines = [];
    this.findings = [];
    this.batches = [];
    this.batchItems = [];
    this.exports = [];
  }
}
