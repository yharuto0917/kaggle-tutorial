import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { lessonProgress } from "@/db/schema";
import type { AppEnv } from "../context";

/** レッスン進捗 API。要ログイン。GET で一覧、POST で 1 件 upsert。 */
export const progressRoute = new Hono<AppEnv>()
	.get("/", async (c) => {
		const userId = c.get("userId");
		if (!userId) return c.json({ error: "認証が必要です" }, 401);
		const db = c.get("db");
		const rows = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
		return c.json(rows);
	})
	.post("/", async (c) => {
		const userId = c.get("userId");
		if (!userId) return c.json({ error: "認証が必要です" }, 401);

		const body = (await c.req.json().catch(() => null)) as {
			lessonId?: unknown;
			status?: unknown;
		} | null;

		const lessonId = typeof body?.lessonId === "string" ? body.lessonId.trim() : "";
		const status = body?.status;
		if (lessonId.length === 0) {
			return c.json({ error: "lessonId（文字列）が必要です" }, 400);
		}
		if (status !== "in-progress" && status !== "completed") {
			return c.json({ error: "status は in-progress または completed を指定してください" }, 400);
		}

		const db = c.get("db");
		const now = new Date();
		const [row] = await db
			.insert(lessonProgress)
			.values({ userId, lessonId, status, updatedAt: now })
			.onConflictDoUpdate({
				target: [lessonProgress.userId, lessonProgress.lessonId],
				set: { status, updatedAt: now },
			})
			.returning();
		return c.json(row);
	});
