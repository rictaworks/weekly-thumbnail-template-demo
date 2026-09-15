import { expect, test } from "@playwright/test";

// requirements.md 21章・CLAUDE.md：Cookieベースのセッションキーがオーナーキーであり、
// セッションをまたいだレコードの参照・操作はできない。ここではブラウザ経由ではなく実際のHTTP API層
// (wrangler dev + D1)を対象に、他セッションが生成IDを知っていても到達できないことを検証する。
test.describe("セッションをまたいだレコードへの到達不可", () => {
  test("他セッションのCookieでは生成詳細(GET /api/generations/:id)に到達できない", async ({ playwright }) => {
    const contextA = await playwright.request.newContext({ baseURL: "http://localhost:8787" });
    const contextB = await playwright.request.newContext({ baseURL: "http://localhost:8787" });

    try {
      const confirmResponse = await contextA.post("/api/generations/confirm", {
        data: {
          templateCode: "T01",
          weekNumberRaw: "77",
          topicRaw: "セッション分離確認用の話題です",
          contact_note: "",
        },
      });
      expect(confirmResponse.ok()).toBe(true);
      const confirmBody = (await confirmResponse.json()) as { generation: { id: string } };
      const generationId = confirmBody.generation.id;
      expect(generationId).toBeTruthy();

      // 生成した本人(セッションA)は同じレコードへ到達できる。
      const asOwner = await contextA.get(`/api/generations/${generationId}`);
      expect(asOwner.status()).toBe(200);

      // 生成IDを知っていても、別セッション(セッションB、初回アクセスで新規Cookie発行)からは到達できない。
      const asOther = await contextB.get(`/api/generations/${generationId}`);
      expect(asOther.status()).toBe(404);

      // セッションBの履歴一覧にもセッションAの生成は含まれない。
      const historyOther = await contextB.get("/api/generations");
      expect(historyOther.ok()).toBe(true);
      const historyOtherBody = (await historyOther.json()) as { generations: Array<{ id: string }> };
      expect(historyOtherBody.generations.some((g) => g.id === generationId)).toBe(false);
    } finally {
      await contextA.dispose();
      await contextB.dispose();
    }
  });
});
