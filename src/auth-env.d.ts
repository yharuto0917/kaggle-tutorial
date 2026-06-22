// Better Auth 用のシークレット/環境変数を CloudflareEnv に補強する。
// これらは wrangler.jsonc には置かず、`.dev.vars`（ローカル）/ `wrangler secret`（本番）で投入する。
declare global {
	interface CloudflareEnv {
		/** Better Auth のセッション署名鍵（必須） */
		BETTER_AUTH_SECRET: string;
		/** 認証のベース URL（例: http://localhost:3000 / 本番ドメイン） */
		BETTER_AUTH_URL?: string;
		/** Google OAuth クライアント ID */
		GOOGLE_CLIENT_ID: string;
		/** Google OAuth クライアントシークレット */
		GOOGLE_CLIENT_SECRET: string;
	}
}

export {};
