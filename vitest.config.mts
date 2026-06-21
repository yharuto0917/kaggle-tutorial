import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// `@/` を src/ へ解決する（tsconfig の paths とそろえる）。
const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const alias = [{ find: /^@\//, replacement: `${srcDir}/` }];

/**
 * Next.js 16 / OpenNext (Cloudflare Workers) 向けテスト基盤。
 *
 * - `unit`   : React コンポーネント / MDX 変換などを jsdom 環境で実行
 *              （`*.unit.test.ts(x)`）
 * - `workers`: Hono ルート / D1 アクセスを Workers ランタイム (workerd) で実行
 *              （`*.workers.test.ts`）。drizzle の生成マイグレーションを D1 に適用してから走る。
 */
export default defineConfig(async () => {
	// 生成済みマイグレーション（drizzle-kit generate の出力）を読み込み、
	// バインディング経由でテスト用 D1 に適用する（drizzle-kit push は使わない方針と整合）。
	const migrations = await readD1Migrations("./drizzle");

	return {
		test: {
			projects: [
				{
					resolve: { alias },
					test: {
						name: "unit",
						environment: "jsdom",
						setupFiles: ["./vitest.setup.ts"],
						include: ["src/**/*.unit.test.{ts,tsx}"],
					},
				},
				{
					resolve: { alias },
					plugins: [
						cloudflareTest({
							miniflare: {
								compatibilityDate: "2026-06-15",
								compatibilityFlags: ["nodejs_compat"],
								d1Databases: ["DB"],
								bindings: { TEST_MIGRATIONS: migrations },
							},
						}),
					],
					test: {
						name: "workers",
						include: ["src/**/*.workers.test.ts"],
						setupFiles: ["./vitest.workers.setup.ts"],
					},
				},
			],
		},
	};
});
