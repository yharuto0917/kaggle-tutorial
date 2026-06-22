import type { Database } from "@/db";
import { createAuth } from "@/lib/auth";

/**
 * Hono の型環境。リクエストスコープの Drizzle クライアントとログインユーザー ID を
 * Variables に載せ、各ルートは c.get("db") / c.get("userId") で参照する。
 */
export type AppEnv = {
	Bindings: CloudflareEnv;
	Variables: {
		db: Database;
		/** ログイン中のユーザー ID。未ログインなら null。 */
		userId: string | null;
	};
};

/**
 * リクエストの Cookie/ヘッダから Better Auth のセッションを解決し、ユーザー ID を返す。
 * セッションが無ければ null。
 */
export async function resolveUserId(env: CloudflareEnv, headers: Headers): Promise<string | null> {
	const auth = createAuth(env);
	const session = await auth.api.getSession({ headers });
	return session?.user.id ?? null;
}
