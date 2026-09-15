import type { Composition, EvaluateResponse, TemplateMaster } from "../api/types.js";

export interface Draft {
  readonly template: TemplateMaster;
  readonly weekNumberRaw: string;
  readonly topicRaw: string;
  readonly evaluation: EvaluateResponse;
}

// 単票生成画面から検版画面へ、直近の組版結果を受け渡すためのモジュール内状態（画面間でAPIを再要求しない）。
let current: Draft | null = null;

export function setDraft(draft: Draft): void {
  current = draft;
}

export function getDraft(): Draft | null {
  return current;
}

export function draftComposition(): Composition | null {
  return current?.evaluation.composition ?? null;
}
