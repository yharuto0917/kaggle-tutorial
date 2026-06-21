import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { AppEnv } from "@/server/context";
import { progressRoute } from "@/server/routes/progress";
import { quizRoute } from "@/server/routes/quiz";

// 本番の app.ts は getDb()（OpenNext の getCloudflareContext）に依存し workerd テストでは
// 解決できないため、同じ構成のアプリをテスト用 D1（env.DB）で再構築してルートハンドラを検証する。
function makeApp() {
	const app = new Hono<AppEnv>().basePath("/api");
	app.use("*", async (c, next) => {
		c.set("db", drizzle(env.DB, { schema }));
		await next();
	});
	return app.route("/progress", progressRoute).route("/quiz", quizRoute);
}

const app = makeApp();
const db = drizzle(env.DB, { schema });

function headers(userId: string): Record<string, string> {
	return { "content-type": "application/json", "x-user-id": userId };
}

beforeEach(async () => {
	await db.delete(schema.lessonProgress);
	await db.delete(schema.quizResults);
	await db.delete(schema.user);
});

describe("API（workers / D1）", () => {
	it("マイグレーションで自前テーブルが作成され、tag-cache 名と衝突しない", async () => {
		const res = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{
			name: string;
		}>();
		const names = res.results.map((r) => r.name);
		expect(names).toContain("user");
		expect(names).toContain("lesson_progress");
		expect(names).toContain("quiz_results");
		// OpenNext tag-cache の `revalidations` / `tags` は別ストレージのため、ここには現れない。
		expect(names).not.toContain("revalidations");
	});

	describe("/api/progress", () => {
		it("POST で作成し GET で取得できる", async () => {
			const post = await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ lessonId: "/learn/ml-basics/01-what-is-ml", status: "completed" }),
			});
			expect(post.status).toBe(200);
			const created = (await post.json()) as { lessonId: string; status: string };
			expect(created).toMatchObject({
				lessonId: "/learn/ml-basics/01-what-is-ml",
				status: "completed",
			});

			const get = await app.request("/api/progress", { headers: headers("u1") });
			const rows = (await get.json()) as Array<{ lessonId: string; status: string }>;
			expect(rows).toHaveLength(1);
			expect(rows[0].status).toBe("completed");
		});

		it("同一レッスンの再 POST は upsert で 1 行更新（重複しない）", async () => {
			const body = { lessonId: "/learn/x", status: "in-progress" as const };
			await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify(body),
			});
			await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ ...body, status: "completed" }),
			});

			const rows = (await (
				await app.request("/api/progress", { headers: headers("u1") })
			).json()) as Array<{
				status: string;
			}>;
			expect(rows).toHaveLength(1);
			expect(rows[0].status).toBe("completed");
		});

		it("ユーザーごとに分離される", async () => {
			await app.request("/api/progress", {
				method: "POST",
				headers: headers("alice"),
				body: JSON.stringify({ lessonId: "/learn/x", status: "completed" }),
			});
			const bob = (await (
				await app.request("/api/progress", { headers: headers("bob") })
			).json()) as unknown[];
			expect(bob).toHaveLength(0);
		});

		it("不正な body は 400", async () => {
			const res = await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ status: "completed" }),
			});
			expect(res.status).toBe(400);
		});
	});

	describe("/api/quiz", () => {
		it("POST で作成し、selected が JSON 文字列で保存される", async () => {
			const post = await app.request("/api/quiz", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ quizId: "ml2-06", correct: true, selected: [0, 2] }),
			});
			expect(post.status).toBe(200);
			const created = (await post.json()) as { quizId: string; correct: boolean; selected: string };
			expect(created.quizId).toBe("ml2-06");
			expect(created.correct).toBe(true);
			expect(JSON.parse(created.selected)).toEqual([0, 2]);

			const rows = (await (
				await app.request("/api/quiz", { headers: headers("u1") })
			).json()) as unknown[];
			expect(rows).toHaveLength(1);
		});

		it("correct が真偽値でなければ 400", async () => {
			const res = await app.request("/api/quiz", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ quizId: "q1", correct: "yes", selected: [0] }),
			});
			expect(res.status).toBe(400);
		});

		it("selected が数値配列でなければ 400", async () => {
			const res = await app.request("/api/quiz", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ quizId: "q1", correct: true, selected: ["a"] }),
			});
			expect(res.status).toBe(400);
		});
	});

	it("未定義ルートは 404", async () => {
		const res = await app.request("/api/unknown", { headers: headers("u1") });
		expect(res.status).toBe(404);
	});
});
