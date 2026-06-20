import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Hono } from "hono";
import { progressRoute } from "./routes/progress";
import { quizRoute } from "./routes/quiz";

/**
 * API の Hono アプリ。Next.js のキャッチオール（src/app/api/[[...route]]/route.ts）から
 * hono/vercel の handle でマウントする。runtime='edge' は使わない（force-dynamic）。
 */
const app = new Hono<{ Bindings: CloudflareEnv }>().basePath("/api");

// Cloudflare バインディング（D1 など）を c.env に載せる。
app.use("*", async (c, next) => {
	c.env = getCloudflareContext().env;
	await next();
});

// ルートを連結してマウント（型を RPC クライアントへ共有するため chain する）。
const routes = app.route("/progress", progressRoute).route("/quiz", quizRoute);

/** hc<AppType> で型共有するためのアプリ型。 */
export type AppType = typeof routes;

export { app };
