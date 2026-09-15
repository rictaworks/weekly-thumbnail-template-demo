import { getCookie, setCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { AppStore } from "../db/store.js";
import type { Env } from "./env.js";

const SESSION_COOKIE_NAME = "wt_session";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

export interface SessionVariables {
  sessionId: string;
}

// Cookieベースのセッションキーをオーナーキーとして発行・照合する。認証・認可は設計に組み込まない。
export function sessionMiddleware(store: AppStore, now: () => string, newId: () => string) {
  return async (c: Context<{ Bindings: Env; Variables: SessionVariables }>, next: Next) => {
    let sessionId = getCookie(c, SESSION_COOKIE_NAME);
    if (!sessionId) {
      sessionId = newId();
      setCookie(c, SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "Lax",
        secure: true,
        path: "/",
        maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      });
    }
    const timestamp = now();
    await store.upsertSession({ sessionId, createdAt: timestamp, lastSeenAt: timestamp });
    c.set("sessionId", sessionId);
    await next();
  };
}
