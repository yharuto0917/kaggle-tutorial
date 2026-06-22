import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Hono } from "hono";
import { getDb } from "@/db";
import { createAuth } from "@/lib/auth";
import { type AppEnv, resolveUserId } from "./context";
import { progressRoute } from "./routes/progress";
import { quizRoute } from "./routes/quiz";

/**
 * API の Hono アプリ。Next.js のキャッチオール（src/app/api/[[...route]]/route.ts）から
 * hono/vercel の handle でマウントする。runtime='edge' は使わない（force-dynamic）。
 */
const app = new Hono<AppEnv>().basePath("/api");

// Better Auth のエンドポイント（/api/auth/*）。セッション解決ミドルウェアより前に登録し、
// 認証ハンドラ自身はそのミドルウェアを経由しないようにする。env はリクエスト時に解決する。
app.on(["GET", "POST"], "/auth/*", (c) => {
	const auth = createAuth(getCloudflareContext().env);
	return auth.handler(c.req.raw);
});

// 以降のルート（progress / quiz）向け: db とログインユーザーをコンテキストへ載せる。
app.use("*", async (c, next) => {
	const env = getCloudflareContext().env;
	c.set("db", getDb());
	c.set("userId", await resolveUserId(env, c.req.raw.headers));
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
