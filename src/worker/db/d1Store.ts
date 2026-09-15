import type { AppStore } from "./store.js";
import type { BatchItemRow, BatchRow, ExportRow, FindingRow, GenerationLineRow, GenerationRow, SessionRow } from "./types.js";

function toGeneration(row: Record<string, unknown>): GenerationRow {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    templateCode: row.template_code as string,
    weekNumber: row.week_number as number,
    topicRaw: row.topic_raw as string,
    topicNormalized: row.topic_normalized as string,
    fontSize: row.font_size as number,
    lineCount: row.line_count as number,
    verdict: row.verdict as string,
    revisionNo: row.revision_no as number,
    origin: row.origin as string,
    createdAt: row.created_at as string,
  };
}

function toGenerationLine(row: Record<string, unknown>): GenerationLineRow {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    generationId: row.generation_id as string,
    seq: row.seq as number,
    text: row.text as string,
    width: row.width as number,
    baselineY: row.baseline_y as number,
  };
}

function toFinding(row: Record<string, unknown>): FindingRow {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    generationId: (row.generation_id as string | null) ?? null,
    batchItemId: (row.batch_item_id as string | null) ?? null,
    code: row.code as string,
    severity: row.severity as string,
    target: row.target as string,
    detail: row.detail as string,
  };
}

function toBatch(row: Record<string, unknown>): BatchRow {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    templateCode: row.template_code as string,
    itemCount: row.item_count as number,
    state: row.state as string,
    createdAt: row.created_at as string,
  };
}

function toBatchItem(row: Record<string, unknown>): BatchItemRow {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    batchId: row.batch_id as string,
    seq: row.seq as number,
    weekNumber: row.week_number as number,
    topicRaw: row.topic_raw as string,
    verdict: row.verdict as string,
    generationId: (row.generation_id as string | null) ?? null,
    state: row.state as string,
  };
}

// 本番用D1実装。全クエリのWHERE句にsession_id = ?を必ず含める。
export class D1Store implements AppStore {
  constructor(private readonly db: D1Database) {}

  async upsertSession(row: SessionRow): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO sessions (session_id, created_at, last_seen_at) VALUES (?, ?, ?) " +
          "ON CONFLICT(session_id) DO UPDATE SET last_seen_at = excluded.last_seen_at",
      )
      .bind(row.sessionId, row.createdAt, row.lastSeenAt)
      .run();
  }

  async insertGeneration(row: GenerationRow): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO generations (id, session_id, template_code, week_number, topic_raw, topic_normalized, font_size, line_count, verdict, revision_no, origin, created_at) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        row.id,
        row.sessionId,
        row.templateCode,
        row.weekNumber,
        row.topicRaw,
        row.topicNormalized,
        row.fontSize,
        row.lineCount,
        row.verdict,
        row.revisionNo,
        row.origin,
        row.createdAt,
      )
      .run();
  }

  async insertGenerationLines(rows: readonly GenerationLineRow[]): Promise<void> {
    for (const row of rows) {
      await this.db
        .prepare(
          "INSERT INTO generation_lines (id, session_id, generation_id, seq, text, width, baseline_y) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(row.id, row.sessionId, row.generationId, row.seq, row.text, row.width, row.baselineY)
        .run();
    }
  }

  async insertFindings(rows: readonly FindingRow[]): Promise<void> {
    for (const row of rows) {
      await this.db
        .prepare(
          "INSERT INTO findings (id, session_id, generation_id, batch_item_id, code, severity, target, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(row.id, row.sessionId, row.generationId, row.batchItemId, row.code, row.severity, row.target, row.detail)
        .run();
    }
  }

  async selectGenerationsBySessionAndTemplate(sessionId: string, templateCode: string): Promise<GenerationRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM generations WHERE session_id = ? AND template_code = ?")
      .bind(sessionId, templateCode)
      .all();
    return (result.results ?? []).map((r) => toGeneration(r as Record<string, unknown>));
  }

  async selectGenerationById(sessionId: string, id: string): Promise<GenerationRow | null> {
    const row = await this.db
      .prepare("SELECT * FROM generations WHERE session_id = ? AND id = ?")
      .bind(sessionId, id)
      .first();
    return row ? toGeneration(row as Record<string, unknown>) : null;
  }

  async selectGenerationLines(sessionId: string, generationId: string): Promise<GenerationLineRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM generation_lines WHERE session_id = ? AND generation_id = ? ORDER BY seq ASC")
      .bind(sessionId, generationId)
      .all();
    return (result.results ?? []).map((r) => toGenerationLine(r as Record<string, unknown>));
  }

  async selectFindingsByGeneration(sessionId: string, generationId: string): Promise<FindingRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM findings WHERE session_id = ? AND generation_id = ?")
      .bind(sessionId, generationId)
      .all();
    return (result.results ?? []).map((r) => toFinding(r as Record<string, unknown>));
  }

  async selectAllGenerationsBySession(sessionId: string): Promise<GenerationRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM generations WHERE session_id = ? ORDER BY revision_no DESC, created_at DESC")
      .bind(sessionId)
      .all();
    return (result.results ?? []).map((r) => toGeneration(r as Record<string, unknown>));
  }

  async insertBatch(row: BatchRow): Promise<void> {
    await this.db
      .prepare("INSERT INTO batches (id, session_id, template_code, item_count, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(row.id, row.sessionId, row.templateCode, row.itemCount, row.state, row.createdAt)
      .run();
  }

  async insertBatchItems(rows: readonly BatchItemRow[]): Promise<void> {
    for (const row of rows) {
      await this.db
        .prepare(
          "INSERT INTO batch_items (id, session_id, batch_id, seq, week_number, topic_raw, verdict, generation_id, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(row.id, row.sessionId, row.batchId, row.seq, row.weekNumber, row.topicRaw, row.verdict, row.generationId, row.state)
        .run();
    }
  }

  async selectBatchById(sessionId: string, id: string): Promise<BatchRow | null> {
    const row = await this.db.prepare("SELECT * FROM batches WHERE session_id = ? AND id = ?").bind(sessionId, id).first();
    return row ? toBatch(row as Record<string, unknown>) : null;
  }

  async selectBatchItems(sessionId: string, batchId: string): Promise<BatchItemRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM batch_items WHERE session_id = ? AND batch_id = ? ORDER BY seq ASC")
      .bind(sessionId, batchId)
      .all();
    return (result.results ?? []).map((r) => toBatchItem(r as Record<string, unknown>));
  }

  async updateBatchItem(sessionId: string, id: string, patch: Partial<BatchItemRow>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (patch.verdict !== undefined) {
      fields.push("verdict = ?");
      values.push(patch.verdict);
    }
    if (patch.generationId !== undefined) {
      fields.push("generation_id = ?");
      values.push(patch.generationId);
    }
    if (patch.state !== undefined) {
      fields.push("state = ?");
      values.push(patch.state);
    }
    if (fields.length === 0) return;
    values.push(sessionId, id);
    await this.db
      .prepare(`UPDATE batch_items SET ${fields.join(", ")} WHERE session_id = ? AND id = ?`)
      .bind(...values)
      .run();
  }

  async insertExport(row: ExportRow): Promise<void> {
    await this.db
      .prepare("INSERT INTO exports (id, session_id, generation_id, file_name, kind, exported_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(row.id, row.sessionId, row.generationId, row.fileName, row.kind, row.exportedAt)
      .run();
  }

  async selectExportsByGeneration(sessionId: string, generationId: string): Promise<ExportRow[]> {
    const result = await this.db
      .prepare("SELECT * FROM exports WHERE session_id = ? AND generation_id = ?")
      .bind(sessionId, generationId)
      .all();
    return (result.results ?? []).map((r) => ({
      id: r.id as string,
      sessionId: r.session_id as string,
      generationId: r.generation_id as string,
      fileName: r.file_name as string,
      kind: r.kind as string,
      exportedAt: r.exported_at as string,
    }));
  }

  async purgeAll(): Promise<void> {
    await this.db.batch([
      this.db.prepare("DELETE FROM exports"),
      this.db.prepare("DELETE FROM batch_items"),
      this.db.prepare("DELETE FROM batches"),
      this.db.prepare("DELETE FROM findings"),
      this.db.prepare("DELETE FROM generation_lines"),
      this.db.prepare("DELETE FROM generations"),
    ]);
  }
}
