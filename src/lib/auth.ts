import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { account, session, user, verification } from "@/db/schema";

/**
 * Better Auth インスタンスをリクエストスコープで生成する。
 *
 * Cloudflare のバインディング/シークレットはリクエスト時にしか参照できないため、
 * モジュールトップではなく env を受け取って都度生成する。
 * 必要なシークレット（BETTER_AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）は
 * `.dev.vars`（ローカル）や `wrangler secret`（本番）で投入する（README 参照）。
 */
export function createAuth(env: CloudflareEnv) {
	const db = drizzle(env.DB, { schema: { user, session, account, verification } });
	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: { user, session, account, verification },
		}),
		emailAndPassword: { enabled: true },
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
