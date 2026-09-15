import type { AppStore } from "../store.js";
import type { FindingRow, GenerationLineRow, GenerationRow } from "../types.js";
import type { Composition, Finding, TemplateCode, Verdict } from "../../types.js";

export interface SaveGenerationInput {
  readonly sessionId: string;
  readonly templateCode: TemplateCode;
  readonly weekNumber: number;
  readonly topicRaw: string;
  readonly composition: Composition;
  readonly verdict: Verdict;
  readonly findings: readonly Finding[];
  readonly origin: "単票" | "一括" | "改訂";
  readonly now: () => string;
  readonly newId: () => string;
}

export interface GenerationDetail {
  readonly generation: GenerationRow;
  readonly lines: GenerationLineRow[];
  readonly findings: FindingRow[];
}

// 全メソッドがsessionIdをオーナーキーとして受け取り、他セッションのレコードには一切到達できない。
export class GenerationRepository {
  constructor(private readonly store: AppStore) {}

  async nextRevision(sessionId: string, templateCode: string, weekNumber: number): Promise<number> {
    const existing = await this.store.selectGenerationsBySessionAndTemplate(sessionId, templateCode);
    const sameWeek = existing.filter((g) => g.weekNumber === weekNumber);
    if (sameWeek.length === 0) return 1;
    return Math.max(...sameWeek.map((g) => g.revisionNo)) + 1;
  }

  async findDuplicateWeek(sessionId: string, templateCode: string, weekNumber: number): Promise<boolean> {
    const existing = await this.store.selectGenerationsBySessionAndTemplate(sessionId, templateCode);
    return existing.some((g) => g.weekNumber === weekNumber);
  }

  async listWeekNumbers(sessionId: string, templateCode: string): Promise<number[]> {
    const existing = await this.store.selectGenerationsBySessionAndTemplate(sessionId, templateCode);
    return existing.map((g) => g.weekNumber);
  }

  async save(input: SaveGenerationInput): Promise<GenerationRow> {
    const revisionNo = await this.nextRevision(input.sessionId, input.templateCode, input.weekNumber);
    const id = input.newId();
    const createdAt = input.now();

    const generation: GenerationRow = {
      id,
      sessionId: input.sessionId,
      templateCode: input.templateCode,
      weekNumber: input.weekNumber,
      topicRaw: input.topicRaw,
      topicNormalized: input.composition.topicNormalized,
      fontSize: input.composition.topicFontSize,
      lineCount: input.composition.topicLines.length,
      verdict: input.verdict,
      revisionNo,
      origin: input.origin,
      createdAt,
    };
    await this.store.insertGeneration(generation);

    const lines: GenerationLineRow[] = input.composition.topicLines.map((line) => ({
      id: input.newId(),
      sessionId: input.sessionId,
      generationId: id,
      seq: line.seq,
      text: line.text,
      width: Math.round(line.width),
      baselineY: Math.round(line.baselineY),
    }));
    await this.store.insertGenerationLines(lines);

    const findingRows: FindingRow[] = input.findings.map((f) => ({
      id: input.newId(),
      sessionId: input.sessionId,
      generationId: id,
      batchItemId: null,
      code: f.code,
      severity: f.severity,
      target: f.target,
      detail: f.detail,
    }));
    await this.store.insertFindings(findingRows);

    return generation;
  }

  // セッションキーが一致しない限り、生成IDを知っていてもレコードへ到達できない。
  async load(sessionId: string, id: string): Promise<GenerationDetail | null> {
    const generation = await this.store.selectGenerationById(sessionId, id);
    if (!generation) return null;
    const lines = await this.store.selectGenerationLines(sessionId, id);
    const findings = await this.store.selectFindingsByGeneration(sessionId, id);
    return { generation, lines, findings };
  }

  async listHistory(sessionId: string): Promise<GenerationRow[]> {
    const rows = await this.store.selectAllGenerationsBySession(sessionId);
    return [...rows].sort((a, b) => {
      if (a.templateCode !== b.templateCode) return a.templateCode.localeCompare(b.templateCode);
      if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
      return b.revisionNo - a.revisionNo;
    });
  }
}
