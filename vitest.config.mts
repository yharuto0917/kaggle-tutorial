import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// `@/` を src/ へ解決する（tsconfig の paths とそろえる）。
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Next.js 16 / OpenNext (Cloudflare Workers) 向けテスト基盤。
 *
 * - `unit`   : React コンポーネント / MDX 変換などを jsdom 環境で実行
 *              （`*.unit.test.ts(x)`）
 * - `workers`: Hono ルート / D1 アクセスを Workers ランタイム (workerd) で実行
 *              （`*.workers.test.ts`）
 *
 * 注: Phase 0 では workers プロジェクトを最小の miniflare 設定で起動する。
 *     D1 などのバインディングを使う本格的なテストは Phase 3 で wrangler 設定
 *     （configPath）へ寄せ、`readD1Migrations()` でマイグレーションを適用する。
 */
export default defineConfig({
	test: {
		projects: [
			{
				resolve: { alias: [{ find: /^@\//, replacement: `${srcDir}/` }] },
				test: {
					name: "unit",
					environment: "jsdom",
					setupFiles: ["./vitest.setup.ts"],
					include: ["src/**/*.unit.test.{ts,tsx}"],
				},
			},
			{
				plugins: [
					cloudflareTest({
						miniflare: {
							compatibilityDate: "2026-06-15",
							compatibilityFlags: ["nodejs_compat"],
						},
					}),
				],
				test: {
					name: "workers",
					include: ["src/**/*.workers.test.ts"],
				},
			},
		],
	},
});
