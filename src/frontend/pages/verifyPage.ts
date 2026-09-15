import { loadAppFont } from "../rendering/fontLoader.js";
import { renderComposition } from "../rendering/canvasRenderer.js";
import { atWidth, toGrayscale, withOverlays } from "../rendering/previewScaler.js";
import { getDraft } from "../state/draftStore.js";
import { VERIFY_PAGE } from "../strings/ja.js";
import type { Finding } from "../api/types.js";

const CHECKLIST: readonly { code: string; label: string }[] = [
  { code: "F-V1-BOUNDS", label: "V1 枠内収容" },
  { code: "F-V2-MIN-SIZE", label: "V2 サイズ下限" },
  { code: "F-V3-SAFE-MARGIN", label: "V3 セーフマージン" },
  { code: "F-V4-FORBIDDEN-AREA", label: "V4 占有禁止領域" },
  { code: "F-V5-SCALE-READABILITY", label: "V5 縮小時可読性" },
  { code: "F-V6-CONTRAST", label: "V6 コントラスト" },
  { code: "F-V7-GRAYSCALE", label: "V7 グレースケール" },
];

function buildChecklist(findings: readonly Finding[]): HTMLElement {
  const list = document.createElement("ul");
  list.className = "finding-list";
  for (const item of CHECKLIST) {
    const failed = findings.some((f) => f.code === item.code);
    const li = document.createElement("li");
    li.textContent = `${item.label}: ${failed ? "未達" : "充足"}`;
    list.appendChild(li);
  }
  return list;
}

export async function renderVerifyPage(main: HTMLElement): Promise<void> {
  const heading = document.createElement("h1");
  heading.textContent = VERIFY_PAGE.heading;
  main.appendChild(heading);

  const draft = getDraft();
  if (!draft || !draft.evaluation.composition) {
    const notice = document.createElement("p");
    notice.textContent = VERIFY_PAGE.noDraftNotice;
    main.appendChild(notice);
    return;
  }

  const overlayRow = document.createElement("div");
  const safeMarginToggle = buildToggle(VERIFY_PAGE.overlaySafeMargin);
  const forbiddenAreaToggle = buildToggle(VERIFY_PAGE.overlayForbiddenArea);
  const slotBoundsToggle = buildToggle(VERIFY_PAGE.overlaySlotBounds);
  overlayRow.append(safeMarginToggle.wrapper, forbiddenAreaToggle.wrapper, slotBoundsToggle.wrapper);
  main.appendChild(overlayRow);

  const compareGrid = document.createElement("div");
  compareGrid.className = "verify-compare";
  main.appendChild(compareGrid);

  const checklistHeading = document.createElement("h2");
  checklistHeading.textContent = VERIFY_PAGE.checklistHeading;
  main.appendChild(checklistHeading);
  main.appendChild(buildChecklist(draft.evaluation.findings));

  let baseCanvas: HTMLCanvasElement | null = null;

  function redraw(): void {
    if (!baseCanvas) return;
    compareGrid.innerHTML = "";
    const overlaid = withOverlays(baseCanvas, draft!.template, {
      safeMargin: safeMarginToggle.input.checked,
      forbiddenArea: forbiddenAreaToggle.input.checked,
      slotBounds: slotBoundsToggle.input.checked,
    });
    compareGrid.append(
      labeledCanvas(VERIFY_PAGE.actualSize, overlaid),
      labeledCanvas(VERIFY_PAGE.listingWidth, atWidth(overlaid, 360)),
      labeledCanvas(VERIFY_PAGE.microWidth, atWidth(overlaid, 210)),
      labeledCanvas(VERIFY_PAGE.grayscale, toGrayscale(overlaid)),
    );
  }

  // フォント読み込みはトグル操作のイベント登録をブロックしない。
  for (const toggle of [safeMarginToggle, forbiddenAreaToggle, slotBoundsToggle]) {
    toggle.input.addEventListener("change", redraw);
  }

  await loadAppFont();
  baseCanvas = document.createElement("canvas");
  renderComposition(baseCanvas, draft.evaluation.composition, draft.template);
  redraw();
}

function buildToggle(label: string): { wrapper: HTMLElement; input: HTMLInputElement } {
  const wrapper = document.createElement("label");
  wrapper.style.marginRight = "16px";
  const input = document.createElement("input");
  input.type = "checkbox";
  wrapper.append(input, document.createTextNode(` ${label}`));
  return { wrapper, input };
}

function labeledCanvas(label: string, canvas: HTMLCanvasElement): HTMLElement {
  const wrapper = document.createElement("div");
  const caption = document.createElement("div");
  caption.textContent = label;
  caption.className = "char-count";
  wrapper.append(caption, canvas);
  return wrapper;
}
