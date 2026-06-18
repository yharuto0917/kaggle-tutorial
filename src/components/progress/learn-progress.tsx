"use client";

import { useProgressMap } from "@/hooks/use-progress";
import type { NavGroup } from "@/lib/nav";
import { countCompleted } from "@/lib/progress-store";
import { ProgressBar } from "./progress-bar";

/** /learn 一覧の先頭に置く、全体＋トラック別の進捗サマリ。 */
export function LearnProgress({ groups }: { groups: NavGroup[] }) {
	const map = useProgressMap();

	const tracks = groups
		.filter((group) => group.items.length > 0)
		.map((group) => {
			const urls = group.items.map((item) => item.url);
			return {
				title: group.title ?? "その他",
				total: urls.length,
				done: countCompleted(map, urls),
			};
		});

	const total = tracks.reduce((acc, t) => acc + t.total, 0);
	const done = tracks.reduce((acc, t) => acc + t.done, 0);
	if (total === 0) return null;

	return (
		<section className="mt-8 rounded-lg border border-black/10 bg-black/[.02] p-5 dark:border-white/15 dark:bg-white/[.03]">
			<h2 className="mb-3 text-sm font-semibold">あなたの進捗</h2>
			<ProgressBar value={done} total={total} label="全体" />
			<div className="mt-4 space-y-3">
				{tracks.map((track) => (
					<ProgressBar
						key={track.title}
						value={track.done}
						total={track.total}
						label={track.title}
					/>
				))}
			</div>
		</section>
	);
}
