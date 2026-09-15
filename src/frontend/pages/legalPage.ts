import { LEGAL } from "../strings/ja.js";

function section(heading: string, items: readonly string[]): HTMLElement {
  const section = document.createElement("section");
  section.className = "legal-section";
  const h2 = document.createElement("h2");
  h2.textContent = heading;
  const ul = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  }
  section.append(h2, ul);
  return section;
}

export function renderLegalPage(main: HTMLElement): void {
  const backLink = document.createElement("a");
  backLink.href = "/";
  backLink.dataset.link = "true";
  backLink.textContent = LEGAL.backToApp;

  const heading = document.createElement("h1");
  heading.textContent = LEGAL.title;

  const terms = section(LEGAL.termsHeading, LEGAL.terms);
  const disclaimer = section(LEGAL.disclaimerHeading, LEGAL.disclaimer);

  const contactSection = document.createElement("section");
  contactSection.className = "legal-section";
  const contactHeading = document.createElement("h2");
  contactHeading.textContent = LEGAL.contactHeading;
  const dl = document.createElement("dl");

  const c = LEGAL.contact;
  const entries: Array<[string, string, string | null]> = [
    [c.name, c.nameValue, null],
    [c.address, c.addressValue, null],
    [c.tel, c.telValue, `tel:${c.telValue.replace(/-/g, "")}`],
    [c.email, c.emailValue, `mailto:${c.emailValue}`],
    [c.web, c.webValue, c.webValue],
    [c.x, c.xValue, c.xUrl],
    [c.github, c.githubValue, c.githubUrl],
  ];
  for (const [label, value, href] of entries) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = value;
      if (href.startsWith("http")) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      dd.appendChild(a);
    } else {
      dd.textContent = value;
    }
    dl.append(dt, dd);
  }
  contactSection.append(contactHeading, dl);

  main.append(backLink, heading, terms, disclaimer, contactSection);
}
