import { hc } from "hono/client";
import type { AppType } from "@/server/app";

/**
 * Hono RPC クライアント（型はサーバの AppType を共有）。
 * 例: `apiClient.api.progress.$get()` / `apiClient.api.quiz.$post({ json })`。
 * #25 の localStorage → D1 同期で使用する。
 */
export const apiClient = hc<AppType>("/");
