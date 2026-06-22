import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { quizResults } from "@/db/schema";
import type { AppEnv } from "../context";

/** クイズ結果 API。要ログイン。GET で一覧、POST で 1 件 upsert。 */
export const quizRoute = new Hono<AppEnv>()
	.get("/", async (c) => {
		const userId = c.get("userId");
		if (!userId) return c.json({ error: "認証が必要です" }, 401);
		const db = c.get("db");
		const rows = await db.select().from(quizResults).where(eq(quizResults.userId, userId));
		return c.json(rows);
	})
	.post("/", async (c) => {
		const userId = c.get("userId");
		if (!userId) return c.json({ error: "認証が必要です" }, 401);

		const body = (await c.req.json().catch(() => null)) as {
			quizId?: unknown;
			correct?: unknown;
			selected?: unknown;
			answeredAt?: unknown;
		} | null;

		const quizId = typeof body?.quizId === "string" ? body.quizId.trim() : "";
		const correct = body?.correct;
		const selected = body?.selected;
		if (quizId.length === 0) {
			return c.json({ error: "quizId（文字列）が必要です" }, 400);
		}
		if (typeof correct !== "boolean") {
			return c.json({ error: "correct（真偽値）が必要です" }, 400);
		}
		if (
			!Array.isArray(selected) ||
			!selected.every((n) => typeof n === "number" && Number.isInteger(n) && n >= 0)
		) {
			return c.json({ error: "selected（0 以上の整数配列）が必要です" }, 400);
		}

		const db = c.get("db");
		const answeredAt =
			typeof body?.answeredAt === "number" && Number.isFinite(body.answeredAt)
				? new Date(body.answeredAt)
				: new Date();
		const [row] = await db
			.insert(quizResults)
			.values({
				userId,
				quizId,
				correct,
				selected: JSON.stringify(selected),
				answeredAt,
			})
			.onConflictDoUpdate({
				target: [quizResults.userId, quizResults.quizId],
				set: { correct, selected: JSON.stringify(selected), answeredAt },
			})
			.returning();
		return c.json(row);
	});
