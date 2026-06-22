import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { AppEnv } from "@/server/context";
import { progressRoute } from "@/server/routes/progress";
import { quizRoute } from "@/server/routes/quiz";

const db = drizzle(env.DB, { schema });

// 本番 app.ts は Better Auth（getCloudflareContext / シークレット）に依存し workerd テストでは
// 解決できないため、セッションをモックしたアプリを再構築してルートハンドラを検証する。
// userId はテスト用ヘッダ x-test-user から注入する（本番は Better Auth セッションが設定）。
function makeApp() {
	const app = new Hono<AppEnv>().basePath("/api");
	app.use("*", async (c, next) => {
		c.set("db", db);
		c.set("userId", c.req.header("x-test-user") || null);
		await next();
	});
	return app.route("/progress", progressRoute).route("/quiz", quizRoute);
}

const app = makeApp();

function headers(userId?: string): Record<string, string> {
	const h: Record<string, string> = { "content-type": "application/json" };
	if (userId) h["x-test-user"] = userId;
	return h;
}

async function seedUser(id: string) {
	const now = new Date();
	await db
		.insert(schema.user)
		.values({
			id,
			name: id,
			email: `${id}@example.com`,
			emailVerified: false,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing();
}

beforeEach(async () => {
	await db.delete(schema.lessonProgress);
	await db.delete(schema.quizResults);
	await db.delete(schema.session);
	await db.delete(schema.account);
	await db.delete(schema.user);
});

describe("API（workers / D1）", () => {
	it("マイグレーションで自前 + Better Auth テーブルが作成され、tag-cache 名と衝突しない", async () => {
		const res = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{
			name: string;
		}>();
		const names = res.results.map((r) => r.name);
		for (const t of [
			"user",
			"lesson_progress",
			"quiz_results",
			"session",
			"account",
			"verification",
		]) {
			expect(names).toContain(t);
		}
		expect(names).not.toContain("revalidations");
	});

	describe("認証", () => {
		it("未ログインの GET /api/progress は 401", async () => {
			const res = await app.request("/api/progress", { headers: headers() });
			expect(res.status).toBe(401);
		});
		it("未ログインの POST /api/quiz は 401", async () => {
			const res = await app.request("/api/quiz", {
				method: "POST",
				headers: headers(),
				body: JSON.stringify({ quizId: "q1", correct: true, selected: [0] }),
			});
			expect(res.status).toBe(401);
		});
	});

	describe("/api/progress（要ログイン）", () => {
		it("POST で作成し GET で取得できる", async () => {
			await seedUser("u1");
			const post = await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ lessonId: "/learn/ml-basics/01-what-is-ml", status: "completed" }),
			});
			expect(post.status).toBe(200);

			const rows = (await (
				await app.request("/api/progress", { headers: headers("u1") })
			).json()) as Array<{ status: string }>;
			expect(rows).toHaveLength(1);
			expect(rows[0].status).toBe("completed");
		});

		it("同一レッスンの再 POST は upsert で 1 行更新（重複しない）", async () => {
			await seedUser("u1");
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
			).json()) as Array<{ status: string }>;
			expect(rows).toHaveLength(1);
			expect(rows[0].status).toBe("completed");
		});

		it("ユーザーごとに分離される", async () => {
			await seedUser("alice");
			await app.request("/api/progress", {
				method: "POST",
				headers: headers("alice"),
				body: JSON.stringify({ lessonId: "/learn/x", status: "completed" }),
			});
			await seedUser("bob");
			const bob = (await (
				await app.request("/api/progress", { headers: headers("bob") })
			).json()) as unknown[];
			expect(bob).toHaveLength(0);
		});

		it("不正な body は 400", async () => {
			await seedUser("u1");
			const res = await app.request("/api/progress", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ status: "completed" }),
			});
			expect(res.status).toBe(400);
		});
	});

	describe("/api/quiz（要ログイン）", () => {
		it("POST で作成し、selected が JSON 文字列で保存される", async () => {
			await seedUser("u1");
			const post = await app.request("/api/quiz", {
				method: "POST",
				headers: headers("u1"),
				body: JSON.stringify({ quizId: "ml2-06", correct: true, selected: [0, 2] }),
			});
			expect(post.status).toBe(200);
			const created = (await post.json()) as { selected: string };
			expect(JSON.parse(created.selected)).toEqual([0, 2]);
		});

		it("selected が数値配列でなければ 400", async () => {
			await seedUser("u1");
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
