import type { Database } from "@/db";
import { user } from "@/db/schema";

/**
 * Hono の型環境。リクエストスコープの Drizzle クライアントと、Cookie 識別の
 * ユーザー ID を Variables に載せ、各ルートは c.get("db") / c.get("userId") で参照する。
 */
export type AppEnv = {
	Bindings: CloudflareEnv;
	Variables: {
		db: Database;
		/** Cookie 由来のユーザー ID（ミドルウェアで必ず設定される）。 */
		userId: string;
	};
};

/**
 * 進捗/クイズの書き込み前に、対象ユーザー行の存在を保証する（FK 用）。
 * Cookie 識別のため email は合成値を入れる。
 */
export async function ensureUser(db: Database, userId: string): Promise<void> {
	const now = new Date();
	await db
		.insert(user)
		.values({
			id: userId,
			name: "ゲスト",
			email: `${userId}@cookie.local`,
			emailVerified: false,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing();
}
