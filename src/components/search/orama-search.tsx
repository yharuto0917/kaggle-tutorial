"use client";

import type { AnyOrama } from "@orama/orama";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSearchIndex, type SearchDoc, type SearchHit, searchIndex } from "@/lib/orama-search";

/** 検索語の入力が落ち着いてから検索を実行するまでの遅延（ミリ秒）。 */
const SEARCH_DEBOUNCE_MS = 150;

/**
 * Orama によるタイポ許容のインスタント検索。タイトル・別名・説明を対象にする。
 * 本文の全文検索は下部の Pagefind が担う（併用）。
 */
export function OramaSearch({ documents }: { documents: SearchDoc[] }) {
	const [db, setDb] = useState<AnyOrama | null>(null);
	const [term, setTerm] = useState("");
	const [hits, setHits] = useState<SearchHit[]>([]);

	useEffect(() => {
		let cancelled = false;
		createSearchIndex(documents).then((d) => {
			if (!cancelled) setDb(d);
		});
		return () => {
			cancelled = true;
		};
	}, [documents]);

	useEffect(() => {
		if (!db) return;
		let cancelled = false;
		const timer = setTimeout(() => {
			searchIndex(db, term).then((r) => {
				if (!cancelled) setHits(r);
			});
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [db, term]);

	return (
		<div>
			<input
				type="search"
				value={term}
				onChange={(e) => setTerm(e.target.value)}
				placeholder="レッスン・用語をすばやく検索（タイポ許容）"
				aria-label="クイック検索"
				className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
			/>

			{term.trim().length > 0 ? (
				hits.length > 0 ? (
					<ul className="mt-3 divide-y divide-black/5 rounded-md border border-black/10 dark:divide-white/10 dark:border-white/15">
						{hits.map((h) => (
							<li key={h.id}>
								<Link
									href={h.url}
									className="block px-3 py-2 transition hover:bg-black/[.03] dark:hover:bg-white/[.05]"
								>
									<span className="flex items-center gap-2">
										<span className="rounded bg-black/5 px-1.5 py-0.5 text-xs text-foreground/60 dark:bg-white/10">
											{h.type}
										</span>
										<span className="text-sm font-medium">{h.title}</span>
									</span>
									{h.description ? (
										<span className="mt-0.5 block truncate text-xs text-foreground/60">
											{h.description}
										</span>
									) : null}
								</Link>
							</li>
						))}
					</ul>
				) : (
					<p className="mt-3 text-sm text-foreground/60">一致する候補がありません。</p>
				)
			) : null}
		</div>
	);
}
