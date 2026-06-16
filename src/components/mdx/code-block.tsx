"use client";

import { type ComponentPropsWithoutRef, useRef, useState } from "react";

/**
 * Shiki でハイライト済みの <pre> をラップし、コピー ボタンを付与する。
 * 元の className / style（Shiki テーマ）はそのまま内側の <pre> へ引き継ぐ。
 */
export function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
	const ref = useRef<HTMLPreElement>(null);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const text = ref.current?.textContent ?? "";
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// クリップボード API 非対応時は何もしない
		}
	};

	return (
		<div className="group relative my-6">
			<button
				type="button"
				onClick={handleCopy}
				aria-label="コードをコピー"
				className="absolute right-2 top-2 z-10 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/80 opacity-0 transition hover:bg-white/20 focus:opacity-100 group-hover:opacity-100"
			>
				{copied ? "コピー済み" : "コピー"}
			</button>
			<pre ref={ref} {...props}>
				{children}
			</pre>
		</div>
	);
}
