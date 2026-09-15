import type { AppStore } from "../store.js";
import type { BatchItemRow, BatchRow } from "../types.js";

export interface BatchItemInput {
  readonly seq: number;
  readonly weekNumber: number;
  readonly topicRaw: string;
  readonly verdict: string;
}

export interface BatchDetail {
  readonly batch: BatchRow;
  readonly items: BatchItemRow[];
}

// 全メソッドがsessionIdをオーナーキーとして受け取る。
export class BatchRepository {
  constructor(private readonly store: AppStore) {}

  async save(
    sessionId: string,
    templateCode: string,
    items: readonly BatchItemInput[],
    now: () => string,
    newId: () => string,
  ): Promise<BatchDetail> {
    const batch: BatchRow = {
      id: newId(),
      sessionId,
      templateCode,
      itemCount: items.length,
      state: "受付済み",
      createdAt: now(),
    };
    await this.store.insertBatch(batch);

    const itemRows: BatchItemRow[] = items.map((item) => ({
      id: newId(),
      sessionId,
      batchId: batch.id,
      seq: item.seq,
      weekNumber: item.weekNumber,
      topicRaw: item.topicRaw,
      verdict: item.verdict,
      generationId: null,
      state: "未確定",
    }));
    await this.store.insertBatchItems(itemRows);

    return { batch, items: itemRows };
  }

  async get(sessionId: string, batchId: string): Promise<BatchDetail | null> {
    const batch = await this.store.selectBatchById(sessionId, batchId);
    if (!batch) return null;
    const items = await this.store.selectBatchItems(sessionId, batchId);
    return { batch, items };
  }

  async markConfirmed(sessionId: string, itemId: string, generationId: string): Promise<void> {
    await this.store.updateBatchItem(sessionId, itemId, { generationId, state: "確定済み" });
  }
}
