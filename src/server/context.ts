import type { Context } from "hono";
import type { Database } from "@/db";
import { user } from "@/db/schema";

/**
 * 認証導入前（#24 まで）の暫定ユーザー解決。
 *
 * Better Auth 導入後は、ここをセッションからの user 取得に差し替える。
 * それまではヘッダ `x-user-id`（無ければデモユーザー）でユーザーを識別する。
 */
export const DEMO_USER_ID = "demo-user";

export function getUserId(c: Context): string {
	const header = c.req.header("x-user-id")?.trim();
	return header && header.length > 0 ? header : DEMO_USER_ID;
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
