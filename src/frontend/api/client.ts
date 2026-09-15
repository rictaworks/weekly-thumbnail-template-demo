import { COMMON } from "../strings/ja.js";
import type {
  BatchConfirmResponse,
  BatchRowResponse,
  ConfirmResponse,
  EvaluateResponse,
  GenerationDetail,
  GenerationRecord,
  TemplateMaster,
} from "./types.js";

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new ApiError(COMMON.errorGeneric);
  }
  return (await response.json()) as T;
}

export function fetchTemplates(): Promise<{ templates: TemplateMaster[] }> {
  return request("/api/templates");
}

export function fetchTemplate(code: string): Promise<{ template: TemplateMaster }> {
  return request(`/api/templates/${encodeURIComponent(code)}`);
}

export interface EvaluateRequest {
  readonly templateCode: string;
  readonly weekNumberRaw: string;
  readonly topicRaw: string;
  readonly contact_note: string;
}

export function evaluateGeneration(body: EvaluateRequest): Promise<EvaluateResponse> {
  return request("/api/generations/evaluate", { method: "POST", body: JSON.stringify(body) });
}

export function confirmGeneration(body: EvaluateRequest): Promise<ConfirmResponse> {
  return request("/api/generations/confirm", { method: "POST", body: JSON.stringify(body) });
}

export function fetchWeekNumberFromDate(date: string): Promise<{ weekNumber: number }> {
  return request(`/api/generations/week-number/from-date?date=${encodeURIComponent(date)}`);
}

export function fetchNextWeekNumber(templateCode: string): Promise<{ weekNumber: number }> {
  return request(`/api/generations/week-number/next?templateCode=${encodeURIComponent(templateCode)}`);
}

export function fetchHistory(): Promise<{ generations: GenerationRecord[] }> {
  return request("/api/generations");
}

export function fetchGenerationDetail(id: string): Promise<GenerationDetail> {
  return request(`/api/generations/${encodeURIComponent(id)}`);
}

export interface BatchRequest {
  readonly templateCode: string;
  readonly rawText: string;
  readonly contact_note: string;
}

export function validateBatch(body: BatchRequest): Promise<{ rows: BatchRowResponse[] }> {
  return request("/api/batch/validate", { method: "POST", body: JSON.stringify(body) });
}

export function confirmBatch(body: BatchRequest): Promise<BatchConfirmResponse> {
  return request("/api/batch/confirm", { method: "POST", body: JSON.stringify(body) });
}

export function recordExport(generationId: string, kind: "単票" | "一括"): Promise<{ export: { fileName: string } }> {
  return request("/api/exports", { method: "POST", body: JSON.stringify({ generationId, kind }) });
}
