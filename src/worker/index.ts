import { Hono } from "hono";
import { D1Store } from "./db/d1Store.js";
import { sessionMiddleware } from "./api/session.js";
import { templatesRoute } from "./api/routes/templates.js";
import { generationRoute } from "./api/routes/generation.js";
import { batchRoute } from "./api/routes/batch.js";
import { exportRoute } from "./api/routes/export.js";
import { runDailyReset } from "./cron/dailyReset.js";
import type { Env } from "./api/env.js";
import type { SessionVariables } from "./api/session.js";

const app = new Hono<{ Bindings: Env; Variables: SessionVariables }>();

app.use("/api/*", async (c, next) => {
  const store = new D1Store(c.env.DB);
  const middleware = sessionMiddleware(store, () => new Date().toISOString(), () => crypto.randomUUID());
  return middleware(c, next);
});

app.route("/api/templates", templatesRoute);
app.route("/api/generations", generationRoute);
app.route("/api/batch", batchRoute);
app.route("/api/exports", exportRoute);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await runDailyReset(new D1Store(env.DB));
  },
};
