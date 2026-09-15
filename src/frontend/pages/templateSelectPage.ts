import { fetchTemplates } from "../api/client.js";
import { COMMON, TEMPLATE_SELECT_PAGE } from "../strings/ja.js";
import type { TemplateMaster } from "../api/types.js";

function templateCard(template: TemplateMaster): HTMLElement {
  const card = document.createElement("article");
  card.className = "card";

  const ratio = document.createElement("div");
  ratio.style.aspectRatio = `${template.canvasWidth} / ${template.canvasHeight}`;
  ratio.style.background = template.palette.band;
  ratio.style.borderRadius = "4px";
  ratio.style.marginBottom = "8px";

  const heading = document.createElement("h3");
  heading.textContent = `${template.code}（${template.canvasWidth}×${template.canvasHeight}）`;

  const button = document.createElement("button");
  button.textContent = TEMPLATE_SELECT_PAGE.selectButton;
  button.addEventListener("click", () => {
    window.history.pushState({}, "", `/generate?template=${template.code}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  card.append(ratio, heading, button);
  return card;
}

export async function renderTemplateSelectPage(main: HTMLElement): Promise<void> {
  const heading = document.createElement("h1");
  heading.textContent = TEMPLATE_SELECT_PAGE.heading;

  const notice = document.createElement("p");
  notice.textContent = TEMPLATE_SELECT_PAGE.editNotice;

  const grid = document.createElement("div");
  grid.className = "template-grid";
  grid.textContent = COMMON.loading;

  main.append(heading, notice, grid);

  try {
    const { templates } = await fetchTemplates();
    grid.innerHTML = "";
    for (const template of templates) {
      grid.appendChild(templateCard(template));
    }
  } catch {
    grid.textContent = COMMON.errorGeneric;
  }
}
