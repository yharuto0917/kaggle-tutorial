import { Hono } from "hono";
import { getDb } from "@/db";
import { type AppEnv } from "./context";
import { progressRoute } from "./routes/progress";
import { quizRoute } from "./routes/quiz";

/**
 * API の Hono アプリ。Next.js のキャッチオール（src/app/api/[[...route]]/route.ts）から
 * hono/vercel の handle でマウントする。runtime='edge' は使わない（force-dynamic）。
 */
const app = new Hono<AppEnv>().basePath("/api");

// リクエストスコープの Drizzle クライアントを 1 度だけ解決して c.var.db に載せる。
// 各ルートは c.get("db") で参照し、getCloudflareContext() の重複呼び出しを避ける。
app.use("*", async (c, next) => {
	c.set("db", getDb());
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
