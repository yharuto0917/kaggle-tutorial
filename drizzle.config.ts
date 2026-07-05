import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit の設定。
 *
 * - `generate` でスキーマから SQL マイグレーションを `drizzle/` に生成する。
 * - 適用は wrangler（`pnpm db:migrate:local` / `db:migrate:remote`）で行う。
 *   wrangler.jsonc の d1_databases[].migrations_dir もこの `out` と一致させる。
 * - 固有制約: `drizzle-kit push` は使用しない（OpenNext tag-cache と同居するため）。
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
});
