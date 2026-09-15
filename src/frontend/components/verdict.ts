import { verdictIconSvg } from "./icons.js";
import { VERDICT_LABEL } from "../strings/ja.js";
import type { Finding, Verdict } from "../api/types.js";

export function verdictBadge(verdict: Verdict): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "verdict-badge";
  badge.dataset.verdict = verdict;
  badge.innerHTML = `${verdictIconSvg(verdict)}<span>${VERDICT_LABEL[verdict] ?? verdict}</span>`;
  return badge;
}

export function findingsList(findings: readonly Finding[]): HTMLElement {
  const list = document.createElement("ul");
  list.className = "finding-list";
  for (const finding of findings) {
    const item = document.createElement("li");
    item.textContent = `[${finding.severity}] ${finding.target}: ${finding.detail}`;
    list.appendChild(item);
  }
  return list;
}
