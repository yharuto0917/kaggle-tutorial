/**
 * Cookie ベースの匿名識別。
 *
 * 初回アクセス時にサーバが HTTP-only Cookie `kt_uid`（UUID）を発行し、それを
 * ユーザー ID として D1 に進捗/クイズを保存する。外部認証・シークレットは不要。
 * UUID は推測不可能なため、Cookie 値そのものを識別子として用いる。
 */
export const USER_COOKIE = "kt_uid";

/** Cookie の有効期間（秒）。1 年。 */
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 新しいユーザー ID を発行する。 */
export function newUserId(): string {
	return crypto.randomUUID();
}
