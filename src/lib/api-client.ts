import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/**
 * Hono RPC クライアント（型はサーバの AppType を共有）。
 * 例: `apiClient.api.progress.$get()` / `apiClient.api.quiz.$post({ json })`。
 * src/components/progress/progress-sync.tsx の D1 同期で使用する。
 * ルートはバリデータ未導入のため body の型検査は効かないが、パス/メソッドの
 * 型安全は効く（ルート改名がコンパイルエラーになる）。
 */
export const apiClient = hc<AppType>("/");
