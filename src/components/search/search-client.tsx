"use client";

import { useEffect, useRef, useState } from "react";

type PagefindUIOptions = {
	element: HTMLElement;
	showSubResults?: boolean;
	showImages?: boolean;
	translations?: Record<string, string>;
};
type PagefindUICtor = new (options: PagefindUIOptions) => unknown;

declare global {
	interface Window {
		PagefindUI?: PagefindUICtor;
	}
}

// Pagefind の生成物（/pagefind/*）はビルド時に作られるため、バンドラを通さず
// 実行時に <link> / <script> で読み込む。索引が無い環境（索引未生成の dev など）では
// 読み込みに失敗するので、その旨を表示する。
const UI_CSS = "/pagefind/pagefind-ui.css";
const UI_JS = "/pagefind/pagefind-ui.js";

function ensureStylesheet(): void {
	if (document.querySelector('link[data-pagefind-ui="true"]')) return;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = UI_CSS;
	link.dataset.pagefindUi = "true";
	document.head.appendChild(link);
}

function loadScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (window.PagefindUI) {
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.src = UI_JS;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("pagefind-ui の読み込みに失敗しました"));
		document.body.appendChild(script);
	});
}

export function SearchClient() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

	useEffect(() => {
		let cancelled = false;

		async function init() {
			try {
				ensureStylesheet();
				await loadScript();
				if (cancelled || !containerRef.current || !window.PagefindUI) {
					if (!cancelled) setStatus("unavailable");
					return;
				}
				containerRef.current.innerHTML = "";
				new window.PagefindUI({
					element: containerRef.current,
					showSubResults: true,
					showImages: false,
					translations: {
						placeholder: "レッスン・用語を検索",
						zero_results: "「[SEARCH_TERM]」に一致する結果がありません",
					},
				});
				setStatus("ready");
			} catch {
				if (!cancelled) setStatus("unavailable");
			}
		}

		void init();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div>
			<div ref={containerRef} className="mt-6" />
			{status === "loading" ? (
				<p className="mt-4 text-sm text-foreground/50">検索を準備しています…</p>
			) : null}
			{status === "unavailable" ? (
				<p className="mt-4 text-sm text-foreground/60">
					検索インデックスが見つかりませんでした。インデックスは本番ビルド（<code>pnpm build</code>
					） の後に <code>/pagefind/</code> へ生成されます。ローカルで試すには{" "}
					<code>pnpm build</code> を実行してください。
				</p>
			) : null}
		</div>
	);
}
