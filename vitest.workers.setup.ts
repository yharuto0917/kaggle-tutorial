import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll } from "vitest";

// workers プロジェクトの各テスト前に、drizzle 生成マイグレーションをテスト用 D1 へ適用する。
beforeAll(async () => {
	await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
