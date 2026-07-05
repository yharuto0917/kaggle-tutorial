/**
 * ダッシュボードの集計ロジック（純粋関数）。
 * D1 から取得した行を入力に、UI から独立してテストできる形で集計する。
 */

import type { NavGroup } from "@/lib/nav";

export type TrackInput = { title: string; urls: string[] };

export type TrackProgress = { title: string; total: number; done: number };

/**
 * ナビゲーショングループを trackProgress の入力へ変換する。
 * 空グループは除外し、無題グループは「その他」にフォールバックする。
 * /learn（LearnProgress）と /dashboard の両方から使い、変換規則を一箇所に集約する。
 */
export function navGroupsToTracks(groups: NavGroup[]): TrackInput[] {
	return groups
		.filter((group) => group.items.length > 0)
		.map((group) => ({ title: group.title ?? "その他", urls: group.items.map((i) => i.url) }));
}

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

/** value / total を安全にパーセント表示用の整数へ丸める（total が 0 なら 0）。 */
export function percent(value: number, total: number): number {
	return total > 0 ? Math.round((value / total) * 100) : 0;
}

/** クイズの正答率を集計する。 */
export function quizAccuracy(rows: { correct: boolean }[]): {
	total: number;
	correct: number;
	pct: number;
} {
	const total = rows.length;
	const correct = rows.filter((r) => r.correct).length;
	return { total, correct, pct: percent(correct, total) };
}

const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 3600_000;

/** JST（UTC+9）の日付文字列（YYYY-MM-DD）を返す。サイトが日本語向けのため日付境界も JST に揃える。 */
export function dayStr(ms: number): string {
	return new Date(ms + JST_OFFSET_MS).toISOString().slice(0, 10);
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
