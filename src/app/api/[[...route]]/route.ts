import { handle } from "hono/vercel";
import { app } from "@/server/app";

// D1 などのバインディングへアクセスするため動的実行にする（runtime='edge' は使わない）。
export const dynamic = "force-dynamic";

export const GET = handle(app);
export const POST = handle(app);
