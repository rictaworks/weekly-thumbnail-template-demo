import { Hono } from "hono";
import { TEMPLATES, getTemplate } from "../../master/templates.js";
import { MESSAGES } from "../../errors/messages.js";
import type { Env } from "../env.js";
import type { SessionVariables } from "../session.js";

export const templatesRoute = new Hono<{ Bindings: Env; Variables: SessionVariables }>();

templatesRoute.get("/", (c) => {
  return c.json({ templates: Object.values(TEMPLATES) });
});

templatesRoute.get("/:code", (c) => {
  const template = getTemplate(c.req.param("code"));
  if (!template) return c.json({ error: MESSAGES.templateNotFound }, 404);
  return c.json({ template });
});
