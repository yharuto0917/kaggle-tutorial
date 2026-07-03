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
 * 進捗/クイズの書き込み前に、対象ユーザー行の存在を保証する（FK 用）文を組み立てる。
 * Cookie 識別のため email は合成値を入れる。呼び出し側で本体の upsert と
 * `db.batch([ensureUserStmt(db, userId), upsert])` に束ねて 1 往復にする。
 */
export function ensureUserStmt(db: Database, userId: string) {
	const now = new Date();
	return db
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
