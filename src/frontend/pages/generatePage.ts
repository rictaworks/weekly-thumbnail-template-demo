import { confirmGeneration, evaluateGeneration, fetchNextWeekNumber, fetchTemplates, fetchWeekNumberFromDate, recordExport } from "../api/client.js";
import { createHoneypotField } from "../components/honeypot.js";
import { findingsList, verdictBadge } from "../components/verdict.js";
import { loadAppFont } from "../rendering/fontLoader.js";
import { renderComposition } from "../rendering/canvasRenderer.js";
import { canvasToPngBlob, triggerDownload } from "../rendering/exporter.js";
import { setDraft } from "../state/draftStore.js";
import { COMMON, GENERATE_PAGE } from "../strings/ja.js";
import type { EvaluateResponse, TemplateMaster } from "../api/types.js";

function parseTemplateCodeFromQuery(): string | null {
  return new URLSearchParams(window.location.search).get("template");
}

export async function renderGeneratePage(main: HTMLElement): Promise<void> {
  const heading = document.createElement("h1");
  heading.textContent = GENERATE_PAGE.heading;
  main.appendChild(heading);

  let templates: TemplateMaster[];
  try {
    templates = (await fetchTemplates()).templates;
  } catch {
    const error = document.createElement("p");
    error.textContent = COMMON.errorGeneric;
    main.appendChild(error);
    return;
  }

  const requestedCode = parseTemplateCodeFromQuery();
  let selectedTemplate = templates.find((t) => t.code === requestedCode) ?? templates[0];
  if (!selectedTemplate) return;

  const layout = document.createElement("div");
  layout.className = "generate-layout";

  // --- 左カラム：入力 ---
  const form = document.createElement("form");
  form.className = "card";
  form.noValidate = true;

  const templateField = document.createElement("div");
  templateField.className = "field";
  const templateLabel = document.createElement("label");
  templateLabel.textContent = "テンプレート";
  const templateSelect = document.createElement("select");
  for (const t of templates) {
    const option = document.createElement("option");
    option.value = t.code;
    option.textContent = t.code;
    if (t.code === selectedTemplate.code) option.selected = true;
    templateSelect.appendChild(option);
  }
  templateField.append(templateLabel, templateSelect);

  const weekField = document.createElement("div");
  weekField.className = "field";
  const weekLabel = document.createElement("label");
  weekLabel.textContent = GENERATE_PAGE.weekNumberLabel;
  const weekInput = document.createElement("input");
  weekInput.type = "text";
  weekInput.placeholder = GENERATE_PAGE.weekNumberDirect;

  const weekDateRow = document.createElement("div");
  const weekDateInput = document.createElement("input");
  weekDateInput.type = "date";
  const weekDateButton = document.createElement("button");
  weekDateButton.type = "button";
  weekDateButton.className = "secondary";
  weekDateButton.textContent = GENERATE_PAGE.weekNumberFromDate;
  weekDateRow.append(weekDateInput, weekDateButton);

  const weekAutoButton = document.createElement("button");
  weekAutoButton.type = "button";
  weekAutoButton.className = "secondary";
  weekAutoButton.textContent = GENERATE_PAGE.weekNumberAuto;

  weekField.append(weekLabel, weekInput, weekDateRow, weekAutoButton);

  const topicField = document.createElement("div");
  topicField.className = "field";
  const topicLabel = document.createElement("label");
  topicLabel.textContent = GENERATE_PAGE.topicLabel;
  const topicInput = document.createElement("textarea");
  topicInput.rows = 6;
  topicInput.placeholder = GENERATE_PAGE.topicPlaceholder;
  const charCount = document.createElement("div");
  charCount.className = "char-count";
  charCount.textContent = GENERATE_PAGE.charCount(0, 60);
  topicField.append(topicLabel, topicInput, charCount);

  const honeypot = createHoneypotField();

  const actions = document.createElement("div");
  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.textContent = GENERATE_PAGE.confirmButton;
  confirmButton.disabled = true;
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.className = "secondary";
  exportButton.textContent = GENERATE_PAGE.exportButton;
  exportButton.disabled = true;
  const verifyLink = document.createElement("a");
  verifyLink.href = "/verify";
  verifyLink.dataset.link = "true";
  verifyLink.textContent = GENERATE_PAGE.verifyLinkButton;
  actions.append(confirmButton, exportButton, verifyLink);

  form.append(templateField, weekField, topicField, honeypot.element, actions);

  // --- 中央カラム：プレビュー ---
  const previewCard = document.createElement("div");
  previewCard.className = "card";
  const previewHeading = document.createElement("h2");
  previewHeading.textContent = GENERATE_PAGE.previewHeading;
  const canvas = document.createElement("canvas");
  canvas.style.maxWidth = "100%";
  canvas.style.border = "1px solid var(--color-border)";
  previewCard.append(previewHeading, canvas);

  // --- 右カラム：組版情報・判定 ---
  const infoCard = document.createElement("div");
  infoCard.className = "card";
  const compositionHeading = document.createElement("h2");
  compositionHeading.textContent = GENERATE_PAGE.compositionHeading;
  const compositionInfo = document.createElement("div");
  const verdictHeading = document.createElement("h2");
  verdictHeading.textContent = GENERATE_PAGE.verdictHeading;
  const verdictContainer = document.createElement("div");
  infoCard.append(compositionHeading, compositionInfo, verdictHeading, verdictContainer);

  layout.append(form, previewCard, infoCard);
  main.appendChild(layout);

  let fontReady = false;
  try {
    await loadAppFont();
    fontReady = true;
  } catch {
    const warning = document.createElement("p");
    warning.textContent = "同梱フォントの読み込みに失敗したため、プレビューを表示できません。";
    previewCard.appendChild(warning);
  }

  let latestEvaluation: EvaluateResponse | null = null;
  let confirmedGenerationId: string | null = null;

  async function evaluate(): Promise<void> {
    const templateCode = templateSelect.value;
    const template = templates.find((t) => t.code === templateCode);
    if (!template) return;
    selectedTemplate = template;

    charCount.textContent = GENERATE_PAGE.charCount(Array.from(topicInput.value.replace(/\n/g, "")).length, 60);

    try {
      const evaluation = await evaluateGeneration({
        templateCode,
        weekNumberRaw: weekInput.value,
        topicRaw: topicInput.value,
        contact_note: honeypot.input.value,
      });
      latestEvaluation = evaluation;

      verdictContainer.innerHTML = "";
      verdictContainer.appendChild(verdictBadge(evaluation.verdict));
      verdictContainer.appendChild(findingsList(evaluation.findings));

      compositionInfo.innerHTML = "";
      if (evaluation.composition) {
        const sizeLine = document.createElement("p");
        sizeLine.textContent = GENERATE_PAGE.compositionFontSize(evaluation.composition.topicFontSize);
        const lineCountLine = document.createElement("p");
        lineCountLine.textContent = GENERATE_PAGE.compositionLineCount(evaluation.composition.topicLines.length);
        compositionInfo.append(sizeLine, lineCountLine);
      }

      if (evaluation.composition && fontReady) {
        renderComposition(canvas, evaluation.composition, template);
      }

      const canConfirm = evaluation.verdict !== "不適合" && evaluation.composition !== null;
      confirmButton.disabled = !canConfirm;
      confirmedGenerationId = null;
      exportButton.disabled = true;

      setDraft({ template, weekNumberRaw: weekInput.value, topicRaw: topicInput.value, evaluation });
    } catch {
      verdictContainer.textContent = COMMON.errorGeneric;
    }
  }

  templateSelect.addEventListener("change", () => {
    void evaluate();
  });
  weekInput.addEventListener("input", () => {
    void evaluate();
  });
  topicInput.addEventListener("input", () => {
    void evaluate();
  });

  weekDateButton.addEventListener("click", async () => {
    if (!weekDateInput.value) return;
    const { weekNumber } = await fetchWeekNumberFromDate(weekDateInput.value);
    weekInput.value = String(weekNumber);
    void evaluate();
  });

  weekAutoButton.addEventListener("click", async () => {
    const { weekNumber } = await fetchNextWeekNumber(templateSelect.value);
    weekInput.value = String(weekNumber);
    void evaluate();
  });

  confirmButton.addEventListener("click", async () => {
    try {
      const result = await confirmGeneration({
        templateCode: templateSelect.value,
        weekNumberRaw: weekInput.value,
        topicRaw: topicInput.value,
        contact_note: honeypot.input.value,
      });
      confirmedGenerationId = result.generation.id;
      confirmButton.disabled = true;
      exportButton.disabled = false;
    } catch {
      verdictContainer.textContent = COMMON.errorGeneric;
    }
  });

  exportButton.addEventListener("click", async () => {
    if (!latestEvaluation?.composition || !confirmedGenerationId) return;
    const blob = await canvasToPngBlob(canvas);
    const { export: exportRecord } = await recordExport(confirmedGenerationId, "単票");
    triggerDownload(blob, exportRecord.fileName);
  });

  void evaluate();
}
