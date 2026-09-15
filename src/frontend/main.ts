import { mountShell, renderNav } from "./components/layout.js";
import { Router } from "./router.js";
import { renderTemplateSelectPage } from "./pages/templateSelectPage.js";
import { renderGeneratePage } from "./pages/generatePage.js";
import { renderVerifyPage } from "./pages/verifyPage.js";
import { renderBatchPage } from "./pages/batchPage.js";
import { renderHistoryPage } from "./pages/historyPage.js";
import { renderLegalPage } from "./pages/legalPage.js";

const root = document.getElementById("app");
if (!root) throw new Error("アプリのルート要素が見つかりません");

const main = mountShell(root);

const router = new Router(main, (path) => {
  const nav = document.getElementById("app-nav");
  if (nav) renderNav(nav, path);
});

router.add("/", (m) => renderTemplateSelectPage(m));
router.add("/generate", (m) => renderGeneratePage(m));
router.add("/verify", (m) => renderVerifyPage(m));
router.add("/batch", (m) => renderBatchPage(m));
router.add("/history", (m) => renderHistoryPage(m));
router.add("/legal", (m) => renderLegalPage(m));

router.start();
