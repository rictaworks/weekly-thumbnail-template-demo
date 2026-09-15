import { fetchGenerationDetail, fetchHistory, fetchTemplate, recordExport } from "../api/client.js";
import { verdictBadge } from "../components/verdict.js";
import { loadAppFont } from "../rendering/fontLoader.js";
import { renderComposition } from "../rendering/canvasRenderer.js";
import { canvasToPngBlob, triggerDownload } from "../rendering/exporter.js";
import { COMMON, HISTORY_PAGE } from "../strings/ja.js";
import type { Composition, GenerationRecord } from "../api/types.js";

function toComposition(detail: Awaited<ReturnType<typeof fetchGenerationDetail>>, weekFontSize: number): Composition {
  const topicLines = [...detail.lines].sort((a, b) => a.seq - b.seq);
  const weekLine = detail.weekLine ?? { seq: 0, text: "", width: 0, baselineY: 0 };
  return {
    templateCode: detail.generation.templateCode,
    weekNumber: detail.generation.weekNumber,
    weekText: weekLine.text,
    weekFontSize,
    weekLine,
    topicNormalized: detail.generation.topicNormalized,
    topicFontSize: detail.generation.fontSize,
    topicLines,
  };
}

export async function renderHistoryPage(main: HTMLElement): Promise<void> {
  const heading = document.createElement("h1");
  heading.textContent = HISTORY_PAGE.heading;
  const notice = document.createElement("p");
  notice.textContent = HISTORY_PAGE.resetNotice;
  main.append(heading, notice);

  let generations: GenerationRecord[];
  try {
    generations = (await fetchHistory()).generations;
  } catch {
    main.appendChild(document.createTextNode(COMMON.errorGeneric));
    return;
  }

  if (generations.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = HISTORY_PAGE.empty;
    main.appendChild(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "data-table";
  const head = document.createElement("tr");
  for (const label of [HISTORY_PAGE.columnTemplate, HISTORY_PAGE.columnWeekNumber, HISTORY_PAGE.columnRevision, HISTORY_PAGE.columnVerdict, HISTORY_PAGE.columnCreatedAt, ""]) {
    const th = document.createElement("th");
    th.textContent = label;
    head.appendChild(th);
  }
  table.appendChild(head);

  const preview = document.createElement("canvas");
  preview.style.maxWidth = "100%";
  preview.style.border = "1px solid var(--color-border)";

  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = HISTORY_PAGE.reExportButton;
  exportButton.disabled = true;

  await loadAppFont().catch(() => undefined);
  let activeGenerationId: string | null = null;

  for (const generation of generations) {
    const tr = document.createElement("tr");
    const templateTd = document.createElement("td");
    templateTd.textContent = generation.templateCode;
    const weekTd = document.createElement("td");
    weekTd.textContent = String(generation.weekNumber);
    const revisionTd = document.createElement("td");
    revisionTd.textContent = String(generation.revisionNo);
    const verdictTd = document.createElement("td");
    verdictTd.appendChild(verdictBadge(generation.verdict));
    const createdTd = document.createElement("td");
    createdTd.textContent = generation.createdAt;
    const actionTd = document.createElement("td");
    const reproduceButton = document.createElement("button");
    reproduceButton.type = "button";
    reproduceButton.className = "secondary";
    reproduceButton.textContent = HISTORY_PAGE.reproduceButton;
    reproduceButton.addEventListener("click", async () => {
      const detail = await fetchGenerationDetail(generation.id);
      const { template } = await fetchTemplate(generation.templateCode);
      const weekSlot = template.slots.find((s) => s.code === "S-WEEK");
      const weekFontSize = weekSlot?.typography?.maxSize ?? detail.generation.fontSize;
      renderComposition(preview, toComposition(detail, weekFontSize), template);
      activeGenerationId = generation.id;
      exportButton.disabled = false;
    });
    actionTd.appendChild(reproduceButton);

    tr.append(templateTd, weekTd, revisionTd, verdictTd, createdTd, actionTd);
    table.appendChild(tr);
  }

  exportButton.addEventListener("click", async () => {
    if (!activeGenerationId) return;
    const blob = await canvasToPngBlob(preview);
    const { export: exportRecord } = await recordExport(activeGenerationId, "単票");
    triggerDownload(blob, exportRecord.fileName);
  });

  main.append(table, preview, exportButton);
}
