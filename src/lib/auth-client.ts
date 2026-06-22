"use client";

import { createAuthClient } from "better-auth/react";

/**
 * ブラウザ側の Better Auth クライアント。baseURL を省略すると現在のオリジン + /api/auth を使う。
 * 例: authClient.signIn.social({ provider: "google" }) / authClient.useSession()
 */
export const authClient = createAuthClient();
