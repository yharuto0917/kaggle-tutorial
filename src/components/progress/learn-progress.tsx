"use client";

import { useProgressMap } from "@/hooks/use-progress";
import { navGroupsToTracks, trackProgress } from "@/lib/dashboard";
import type { NavGroup } from "@/lib/nav";
import { ProgressBar } from "./progress-bar";

/** /learn 一覧の先頭に置く、全体＋トラック別の進捗サマリ。 */
export function LearnProgress({ groups }: { groups: NavGroup[] }) {
	const map = useProgressMap();
	const completed = new Set(
		Object.entries(map)
			.filter(([, v]) => v.status === "completed")
			.map(([lessonId]) => lessonId),
	);
	const tp = trackProgress(completed, navGroupsToTracks(groups));
	if (tp.total === 0) return null;

	return (
		<section className="mt-8 rounded-lg border border-black/10 bg-black/[.02] p-5 dark:border-white/15 dark:bg-white/[.03]">
			<h2 className="mb-3 text-sm font-semibold">あなたの進捗</h2>
			<ProgressBar value={tp.done} total={tp.total} label="全体" />
			<div className="mt-4 space-y-3">
				{tp.tracks.map((track) => (
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
