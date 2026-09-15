import { commentDotsIconSvg } from "./icons.js";
import { APP_NAME, CONSULT_BUTTON, DEMO_BANNER_TEXT, FOOTER, NAV } from "../strings/ja.js";

export interface NavLink {
  readonly path: string;
  readonly label: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { path: "/", label: NAV.templateSelect },
  { path: "/generate", label: NAV.generate },
  { path: "/verify", label: NAV.verify },
  { path: "/batch", label: NAV.batch },
  { path: "/history", label: NAV.history },
];

// デモ版共通UI必須要素：アンバーバナー・「デモ一覧へ」戻るリンク・「ご相談はこちら」固定ボタン・フッター。
export function mountShell(root: HTMLElement): HTMLElement {
  root.innerHTML = "";

  const banner = document.createElement("div");
  banner.className = "demo-banner";
  banner.textContent = DEMO_BANNER_TEXT;

  const header = document.createElement("header");
  header.className = "app-header";
  const title = document.createElement("span");
  title.className = "app-header__title";
  title.textContent = APP_NAME;

  const nav = document.createElement("nav");
  nav.className = "app-nav";
  nav.id = "app-nav";
  header.append(title, nav);

  const main = document.createElement("main");
  main.className = "app-main";
  main.id = "app-main";

  const consultButton = document.createElement("a");
  consultButton.className = "consult-button";
  consultButton.href = CONSULT_BUTTON.url;
  consultButton.target = "_blank";
  consultButton.rel = "noopener noreferrer";
  consultButton.innerHTML = `${commentDotsIconSvg()}<span>${CONSULT_BUTTON.label}</span>`;

  const footer = document.createElement("footer");
  footer.className = "app-footer";
  footer.innerHTML = `
    <a href="/legal" data-link="true">${FOOTER.legalLink}</a>
    <span>${FOOTER.copyright} / <a href="${FOOTER.fontLicenseUrl}" target="_blank" rel="noopener">${FOOTER.fontLicense}</a></span>
  `;

  root.append(banner, header, main, consultButton, footer);
  renderNav(nav, "/");
  return main;
}

export function renderNav(nav: HTMLElement, activePath: string): void {
  nav.innerHTML = "";
  for (const link of NAV_LINKS) {
    const a = document.createElement("a");
    a.href = link.path;
    a.textContent = link.label;
    a.dataset.link = "true";
    if (link.path === activePath) a.dataset.active = "true";
    nav.appendChild(a);
  }
  const backLink = document.createElement("a");
  backLink.className = "app-nav__back-link";
  backLink.href = NAV.backToDemoListUrl;
  backLink.target = "_blank";
  backLink.rel = "noopener";
  backLink.textContent = NAV.backToDemoList;
  nav.appendChild(backLink);
}
