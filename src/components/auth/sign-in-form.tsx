"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** メール/パスワードと Google でのサインイン/サインアップフォーム。 */
export function SignInForm() {
	const router = useRouter();
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleEmail(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const res =
			mode === "signup"
				? await authClient.signUp.email({ email, password, name })
				: await authClient.signIn.email({ email, password });
		setLoading(false);
		if (res.error) {
			setError(res.error.message ?? "サインインに失敗しました");
		} else {
			router.push("/learn");
		}
	}

	async function handleGoogle() {
		setError(null);
		await authClient.signIn.social({ provider: "google", callbackURL: "/learn" });
	}

	return (
		<div className="mt-6 space-y-5">
			<button
				type="button"
				onClick={handleGoogle}
				className="flex w-full items-center justify-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/[.03] dark:border-white/20 dark:hover:bg-white/[.05]"
			>
				Google でサインイン
			</button>

			<div className="flex items-center gap-3 text-xs text-foreground/40">
				<span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
				または
				<span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
			</div>

			<form onSubmit={handleEmail} className="space-y-3">
				{mode === "signup" ? (
					<input
						type="text"
						placeholder="名前"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
					/>
				) : null}
				<input
					type="email"
					placeholder="メールアドレス"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
				/>
				<input
					type="password"
					placeholder="パスワード（8 文字以上）"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					minLength={8}
					className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
				/>
				{error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
				<button
					type="submit"
					disabled={loading}
					className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? "処理中…" : mode === "signup" ? "アカウント作成" : "サインイン"}
				</button>
			</form>

			<button
				type="button"
				onClick={() => {
					setMode(mode === "signin" ? "signup" : "signin");
					setError(null);
				}}
				className="text-sm text-blue-600 hover:underline dark:text-blue-400"
			>
				{mode === "signin" ? "アカウントを作成する" : "すでにアカウントをお持ちの方はサインイン"}
			</button>
		</div>
	);
}
