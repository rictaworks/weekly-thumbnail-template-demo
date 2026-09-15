// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import { Router } from "./router.js";

describe("Router", () => {
  let main: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    main = document.createElement("main");
    document.body.appendChild(main);
    window.history.pushState({}, "", "/");
  });

  it("登録したパスへnavigateするとハンドラが実行される", async () => {
    const router = new Router(main);
    let called = false;
    router.add("/generate", () => {
      called = true;
    });
    router.add("/", () => undefined);
    router.navigate("/generate");
    await Promise.resolve();
    expect(called).toBe(true);
    expect(window.location.pathname).toBe("/generate");
  });

  it("パスパラメータを抽出してハンドラへ渡す", async () => {
    const router = new Router(main);
    let receivedId: string | undefined;
    router.add("/history/:id", (_m, params) => {
      receivedId = params.id;
    });
    router.navigate("/history/abc-123");
    await Promise.resolve();
    expect(receivedId).toBe("abc-123");
  });

  it("未登録パスはnotFoundハンドラを呼ぶ", async () => {
    const router = new Router(main);
    let notFoundCalled = false;
    router.notFound(() => {
      notFoundCalled = true;
    });
    router.navigate("/nowhere");
    await Promise.resolve();
    expect(notFoundCalled).toBe(true);
  });
});
