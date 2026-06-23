/**
 * ダッシュボードの集計ロジック（純粋関数）。
 * D1 から取得した行を入力に、UI から独立してテストできる形で集計する。
 */

export type TrackInput = { title: string; urls: string[] };

export type TrackProgress = { title: string; total: number; done: number };

/** トラック別・全体の完了数を集計する。 */
export function trackProgress(
	completedLessonIds: Set<string>,
	tracks: TrackInput[],
): { tracks: TrackProgress[]; total: number; done: number } {
	const result = tracks.map((t) => ({
		title: t.title,
		total: t.urls.length,
		done: t.urls.filter((u) => completedLessonIds.has(u)).length,
	}));
	const total = result.reduce((acc, t) => acc + t.total, 0);
	const done = result.reduce((acc, t) => acc + t.done, 0);
	return { tracks: result, total, done };
}

/** クイズの正答率を集計する。 */
export function quizAccuracy(rows: { correct: boolean }[]): {
	total: number;
	correct: number;
	pct: number;
} {
	const total = rows.length;
	const correct = rows.filter((r) => r.correct).length;
	return { total, correct, pct: total > 0 ? Math.round((correct / total) * 100) : 0 };
}

const DAY_MS = 86_400_000;

function dayStr(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/**
 * 連続学習日数を求める。`now` の日付（活動が無ければ前日）から遡って、
 * 活動のある日が連続している数を数える（今日まだ未活動でも継続中として扱う）。
 */
export function computeStreak(timestamps: number[], now: number): number {
	const days = new Set(timestamps.map(dayStr));
	if (days.size === 0) return 0;
	let cursor = now;
	if (!days.has(dayStr(cursor))) cursor -= DAY_MS;
	let streak = 0;
	while (days.has(dayStr(cursor))) {
		streak += 1;
		cursor -= DAY_MS;
	}
	return streak;
}
