"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** ヘッダー右側の認証状態表示。未ログインならサインインリンク、ログイン中ならサインアウト。 */
export function AuthNav() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <span className="text-sm text-foreground/40">…</span>;
	}

	if (!session) {
		return (
			<Link href="/signin" className="text-foreground/70 transition-colors hover:text-foreground">
				ログイン
			</Link>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<span className="hidden text-foreground/60 sm:inline">{session.user.name}</span>
			<button
				type="button"
				onClick={() => authClient.signOut().then(() => router.refresh())}
				className="text-foreground/70 transition-colors hover:text-foreground"
			>
				ログアウト
			</button>
		</div>
	);
}
