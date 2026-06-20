import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@/db";
import { quizResults } from "@/db/schema";
import { ensureUser, getUserId } from "../context";

/** クイズ結果 API。GET で一覧、POST で 1 件 upsert。 */
export const quizRoute = new Hono()
	.get("/", async (c) => {
		const db = getDb();
		const rows = await db
			.select()
			.from(quizResults)
			.where(eq(quizResults.userId, getUserId(c)));
		return c.json(rows);
	})
	.post("/", async (c) => {
		const body = (await c.req.json().catch(() => null)) as {
			quizId?: unknown;
			correct?: unknown;
			selected?: unknown;
			answeredAt?: unknown;
		} | null;

		const quizId = body?.quizId;
		const correct = body?.correct;
		const selected = body?.selected;
		if (typeof quizId !== "string" || quizId.length === 0) {
			return c.json({ error: "quizId（文字列）が必要です" }, 400);
		}
		if (typeof correct !== "boolean") {
			return c.json({ error: "correct（真偽値）が必要です" }, 400);
		}
		if (!Array.isArray(selected) || !selected.every((n) => typeof n === "number")) {
			return c.json({ error: "selected（数値配列）が必要です" }, 400);
		}

		const db = getDb();
		const userId = getUserId(c);
		await ensureUser(db, userId);

		const answeredAt =
			typeof body?.answeredAt === "number" ? new Date(body.answeredAt) : new Date();
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
