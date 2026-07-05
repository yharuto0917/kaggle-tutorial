import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getDb } from "@/db";
import { newUserId, USER_COOKIE, USER_COOKIE_MAX_AGE } from "@/lib/session";
import type { AppEnv } from "./context";
import { progressRoute } from "./routes/progress";
import { quizRoute } from "./routes/quiz";

/**
 * API の Hono アプリ。Next.js のキャッチオール（src/app/api/[[...route]]/route.ts）から
 * hono/vercel の handle でマウントする。runtime='edge' は使わない（force-dynamic）。
 */
const app = new Hono<AppEnv>().basePath("/api");

// Cookie ベースの匿名識別。未発行なら UUID を発行して HTTP-only Cookie をセットし、
// db とユーザー ID をリクエストコンテキストへ載せる。
app.use("*", async (c, next) => {
	let uid = getCookie(c, USER_COOKIE);
	if (!uid) {
		uid = newUserId();
		setCookie(c, USER_COOKIE, uid, {
			httpOnly: true,
			sameSite: "Lax",
			path: "/",
			maxAge: USER_COOKIE_MAX_AGE,
		});
	}
	c.set("db", getDb());
	c.set("userId", uid);
	await next();
});

// 想定外の例外は JSON で 500 を返し、クライアント側のハンドリングを一貫させる。
app.onError((err, c) => {
	console.error("API error:", err);
	return c.json({ error: "内部エラーが発生しました" }, 500);
});

// ルートを連結してマウント（型を RPC クライアントへ共有するため chain する）。
const routes = app.route("/progress", progressRoute).route("/quiz", quizRoute);

/** hc<AppType> で型共有するためのアプリ型。 */
export type AppType = typeof routes;

export { app };
