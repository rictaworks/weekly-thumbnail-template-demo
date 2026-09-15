import type { AppStore } from "../store.js";
import type { ExportRow } from "../types.js";

export class ExportRepository {
  constructor(private readonly store: AppStore) {}

  async record(
    sessionId: string,
    generationId: string,
    fileName: string,
    kind: "単票" | "一括",
    now: () => string,
    newId: () => string,
  ): Promise<ExportRow> {
    const row: ExportRow = {
      id: newId(),
      sessionId,
      generationId,
      fileName,
      kind,
      exportedAt: now(),
    };
    await this.store.insertExport(row);
    return row;
  }

  async listByGeneration(sessionId: string, generationId: string): Promise<ExportRow[]> {
    return this.store.selectExportsByGeneration(sessionId, generationId);
  }
}
