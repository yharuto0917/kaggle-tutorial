import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export { schema };
export type Database = ReturnType<typeof getDb>;

/**
 * リクエストスコープで Drizzle クライアントを取得する。
 * D1 バインディング `DB` は wrangler.jsonc で定義し、OpenNext の実行コンテキスト経由で参照する。
 */
export function getDb() {
	const { env } = getCloudflareContext();
	return drizzle(env.DB, { schema });
}
