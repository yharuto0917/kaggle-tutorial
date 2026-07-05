import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { lessonProgress } from "@/db/schema";
import { type AppEnv, ensureUserStmt } from "../context";

/** レッスン進捗 API（Cookie 識別）。GET で一覧、POST で 1 件 upsert。 */
export const progressRoute = new Hono<AppEnv>()
	.get("/", async (c) => {
		const db = c.get("db");
		const rows = await db
			.select()
			.from(lessonProgress)
			.where(eq(lessonProgress.userId, c.get("userId")));
		return c.json(rows);
	})
	.post("/", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			lessonId?: unknown;
			status?: unknown;
			explicit?: unknown;
		} | null;

		const lessonId = typeof body?.lessonId === "string" ? body.lessonId.trim() : "";
		const status = body?.status;
		const explicit = body?.explicit === true;
		if (lessonId.length === 0) {
			return c.json({ error: "lessonId（文字列）が必要です" }, 400);
		}
		if (status !== "in-progress" && status !== "completed") {
			return c.json({ error: "status は in-progress または completed を指定してください" }, 400);
		}

		const db = c.get("db");
		const userId = c.get("userId");
		const now = new Date();
		const upsert = db
			.insert(lessonProgress)
			.values({ userId, lessonId, status, updatedAt: now })
			.onConflictDoUpdate({
				target: [lessonProgress.userId, lessonProgress.lessonId],
				// レッスン訪問（markVisited）由来の暗黙 in-progress は、既に completed の
				// 行を降格させない（explicit なユーザー操作の取り消しのみ許可）。
				set:
					status === "completed" || explicit
						? { status, updatedAt: now }
						: {
								status: sql`CASE WHEN ${lessonProgress.status} = 'completed' THEN 'completed' ELSE 'in-progress' END`,
								updatedAt: sql`CASE WHEN ${lessonProgress.status} = 'completed' THEN ${lessonProgress.updatedAt} ELSE ${now.getTime()} END`,
							},
			})
			.returning();
		// ユーザー行の作成（FK 用）と本体の upsert を 1 往復（batch）にまとめる。
		const [, [row]] = await db.batch([ensureUserStmt(db, userId), upsert]);
		return c.json(row);
	});
