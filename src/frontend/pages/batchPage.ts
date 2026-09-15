import { confirmBatch, fetchTemplates, validateBatch } from "../api/client.js";
import { createHoneypotField } from "../components/honeypot.js";
import { verdictBadge } from "../components/verdict.js";
import { loadAppFont } from "../rendering/fontLoader.js";
import { renderComposition } from "../rendering/canvasRenderer.js";
import { canvasToPngBlob, bundleZip, triggerDownload } from "../rendering/exporter.js";
import { BATCH_PAGE, COMMON } from "../strings/ja.js";
import type { BatchRowResponse, TemplateMaster } from "../api/types.js";

export async function renderBatchPage(main: HTMLElement): Promise<void> {
  const heading = document.createElement("h1");
  heading.textContent = BATCH_PAGE.heading;
  main.appendChild(heading);

  let templates: TemplateMaster[];
  try {
    templates = (await fetchTemplates()).templates;
  } catch {
    main.appendChild(document.createTextNode(COMMON.errorGeneric));
    return;
  }
  const firstTemplate = templates[0];
  if (!firstTemplate) return;
  const defaultTemplate: TemplateMaster = firstTemplate;

  const templateSelect = document.createElement("select");
  for (const t of templates) {
    const option = document.createElement("option");
    option.value = t.code;
    option.textContent = t.code;
    templateSelect.appendChild(option);
  }

  const notice = document.createElement("p");
  notice.textContent = BATCH_PAGE.formatNotice;

  const textarea = document.createElement("textarea");
  textarea.rows = 10;
  textarea.style.width = "100%";
  textarea.placeholder = BATCH_PAGE.inputPlaceholder;

  const honeypot = createHoneypotField();

  const validateButton = document.createElement("button");
  validateButton.type = "button";
  validateButton.textContent = BATCH_PAGE.validateButton;

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "secondary";
  confirmButton.textContent = BATCH_PAGE.confirmButton;
  confirmButton.disabled = true;

  const exportAllButton = document.createElement("button");
  exportAllButton.type = "button";
  exportAllButton.className = "secondary";
  exportAllButton.textContent = BATCH_PAGE.exportButton;
  exportAllButton.disabled = true;

  const table = document.createElement("table");
  table.className = "data-table";

  const preview = document.createElement("canvas");
  preview.style.maxWidth = "100%";
  preview.style.border = "1px solid var(--color-border)";

  main.append(templateSelect, notice, textarea, honeypot.element, validateButton, confirmButton, exportAllButton, table, preview);

  await loadAppFont().catch(() => undefined);

  let lastRows: readonly BatchRowResponse[] = [];

  function renderTable(rows: readonly BatchRowResponse[]): void {
    table.innerHTML = "";
    const head = document.createElement("tr");
    for (const label of [BATCH_PAGE.rowSeq, BATCH_PAGE.rowWeekNumber, BATCH_PAGE.rowTopic, BATCH_PAGE.rowVerdict, BATCH_PAGE.rowFontSize, BATCH_PAGE.rowLineCount]) {
      const th = document.createElement("th");
      th.textContent = label;
      head.appendChild(th);
    }
    table.appendChild(head);

    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        if (row.composition) renderComposition(preview, row.composition, templates.find((t) => t.code === templateSelect.value) ?? defaultTemplate);
      });

      const seqTd = document.createElement("td");
      seqTd.textContent = String(row.seq);
      const weekTd = document.createElement("td");
      weekTd.textContent = row.weekNumber === null ? "-" : String(row.weekNumber);
      const topicTd = document.createElement("td");
      topicTd.textContent = row.topicRaw;
      const verdictTd = document.createElement("td");
      verdictTd.appendChild(verdictBadge(row.verdict));
      const sizeTd = document.createElement("td");
      sizeTd.textContent = row.composition ? String(row.composition.topicFontSize) : "-";
      const linesTd = document.createElement("td");
      linesTd.textContent = row.composition ? String(row.composition.topicLines.length) : "-";

      tr.append(seqTd, weekTd, topicTd, verdictTd, sizeTd, linesTd);
      table.appendChild(tr);
    }
  }

  validateButton.addEventListener("click", async () => {
    try {
      const { rows } = await validateBatch({
        templateCode: templateSelect.value,
        rawText: textarea.value,
        contact_note: honeypot.input.value,
      });
      lastRows = rows;
      renderTable(rows);
      confirmButton.disabled = rows.every((r) => r.verdict === "不適合");
    } catch {
      table.textContent = COMMON.errorGeneric;
    }
  });

  confirmButton.addEventListener("click", async () => {
    try {
      const result = await confirmBatch({
        templateCode: templateSelect.value,
        rawText: textarea.value,
        contact_note: honeypot.input.value,
      });
      lastRows = result.rows;
      renderTable(result.rows);
      confirmButton.disabled = true;
      exportAllButton.disabled = result.confirmedCount === 0;
    } catch {
      table.textContent = COMMON.errorGeneric;
    }
  });

  exportAllButton.addEventListener("click", async () => {
    const confirmable = lastRows.filter((r) => r.composition && (r.verdict === "適合" || r.verdict === "注意付き適合"));
    const activeTemplate = templates.find((t) => t.code === templateSelect.value) ?? defaultTemplate;
    const entries = [];
    for (const row of confirmable) {
      if (!row.composition) continue;
      const canvas = document.createElement("canvas");
      renderComposition(canvas, row.composition, activeTemplate);
      const blob = await canvasToPngBlob(canvas);
      const fileName = `${activeTemplate.code}_${String(row.composition.weekNumber).padStart(3, "0")}.png`;
      entries.push({ fileName, blob });
    }
    const zipBlob = await bundleZip(entries);
    triggerDownload(zipBlob, `${activeTemplate.code}_batch.zip`);
  });
}
