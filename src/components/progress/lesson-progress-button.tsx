"use client";

import { useEffect } from "react";
import { useLessonProgress } from "@/hooks/use-progress";

/**
 * レッスン本文末尾に置く完了トグル。
 * - マウント時に「閲覧開始（in-progress）」を記録する（完了済みは変更しない）。
 * - ボタンで完了 / 未完了を手動トグルできる。
 */
export function LessonProgressButton({ lessonId }: { lessonId: string }) {
	const { status, markVisited, toggle } = useLessonProgress(lessonId);

	useEffect(() => {
		markVisited();
		// markVisited は冪等。lessonId ごとに一度だけ実行する。
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lessonId]);

	const completed = status === "completed";

	return (
		<div className="not-prose mt-12 flex items-center gap-3 border-t border-black/10 pt-6 dark:border-white/15">
			<button
				type="button"
				onClick={toggle}
				aria-pressed={completed}
				className={`rounded-md px-4 py-2 text-sm font-medium transition ${
					completed
						? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
						: "bg-blue-600 text-white hover:bg-blue-700"
				}`}
			>
				{completed ? "✓ 完了済み（取り消す）" : "このレッスンを完了にする"}
			</button>
			{completed ? <span className="text-sm text-foreground/60">お疲れさまでした！</span> : null}
		</div>
	);
}
