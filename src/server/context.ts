import type { Context } from "hono";
import type { Database } from "@/db";
import { user } from "@/db/schema";

/**
 * Hono の型環境。リクエストスコープの Drizzle クライアントを Variables に載せ、
 * 各ルートは c.get("db") で取得する（getCloudflareContext() の二重解決を避ける）。
 */
export type AppEnv = {
	Bindings: CloudflareEnv;
	Variables: { db: Database };
};

/**
 * 認証導入前（#24 まで）の暫定ユーザー解決。
 *
 * Better Auth 導入後は、ここをセッションからの user 取得に差し替える。
 * それまではヘッダ `x-user-id`（無ければデモユーザー）でユーザーを識別する。
 *
 * x-user-id は誰でも詐称でき、任意ユーザーの読み書き（IDOR）や user 行の
 * 無制限生成を許してしまう。よって本番では信頼せず、常にデモユーザーへ
 * フォールバックする。ヘッダ識別は開発時の動作確認に限定する（認証は #24）。
 */
export const DEMO_USER_ID = "demo-user";

export function getUserId(c: Context): string {
	if (process.env.NODE_ENV !== "production") {
		const header = c.req.header("x-user-id")?.trim();
		if (header && header.length > 0) return header;
	}
	return DEMO_USER_ID;
}

/**
 * 進捗/クイズの書き込み前に、対象ユーザー行の存在を保証する（FK 制約のため）。
 * 暫定措置。認証導入後（#24）はユーザー作成は認証側が担うため不要になる。
 */
export async function ensureUser(db: Database, userId: string): Promise<void> {
	const now = new Date();
	await db
		.insert(user)
		.values({
			id: userId,
			name: "Demo User",
			email: `${userId}@example.com`,
			emailVerified: false,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing();
}
