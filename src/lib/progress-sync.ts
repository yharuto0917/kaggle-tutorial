import type { LessonProgressMap, LessonStatus } from "@/lib/progress-store";
import type { QuizResultMap } from "@/hooks/use-quiz-result";

/**
 * localStorage（匿名）と D1（ログイン後）の進捗/クイズをマージする純粋関数群。
 * UI から独立してテストできるようにしてある。
 */

function statusRank(s: LessonStatus): number {
	return s === "completed" ? 1 : 0;
}

/**
 * レッスン進捗をマージする。重複は「完了優先」、同ランクなら updatedAt が新しい方を採る。
 */
export function mergeProgress(
	local: LessonProgressMap,
	remote: LessonProgressMap,
): LessonProgressMap {
	const out: LessonProgressMap = { ...remote };
	for (const [lessonId, l] of Object.entries(local)) {
		const r = out[lessonId];
		if (!r) {
			out[lessonId] = l;
			continue;
		}
		const dr = statusRank(l.status) - statusRank(r.status);
		if (dr > 0) out[lessonId] = l;
		else if (dr === 0 && l.updatedAt >= r.updatedAt) out[lessonId] = l;
		// dr < 0（remote の方が完了）はそのまま remote を残す
	}
	return out;
}

/** クイズ結果をマージする。重複は answeredAt が新しい方を採る。 */
export function mergeQuiz(local: QuizResultMap, remote: QuizResultMap): QuizResultMap {
	const out: QuizResultMap = { ...remote };
	for (const [quizId, l] of Object.entries(local)) {
		const r = out[quizId];
		if (!r || l.answeredAt >= r.answeredAt) out[quizId] = l;
	}
	return out;
}

/** API（/api/progress）の行配列を LessonProgressMap へ変換する。 */
export function rowsToProgressMap(
	rows: Array<{ lessonId: string; status: string; updatedAt: string | number }>,
): LessonProgressMap {
	const map: LessonProgressMap = {};
	for (const r of rows) {
		if (r.status !== "in-progress" && r.status !== "completed") continue;
		map[r.lessonId] = { status: r.status, updatedAt: new Date(r.updatedAt).getTime() };
	}
	return map;
}

/** API（/api/quiz）の行配列を QuizResultMap へ変換する。 */
export function rowsToQuizMap(
	rows: Array<{ quizId: string; correct: boolean; selected: string; answeredAt: string | number }>,
): QuizResultMap {
	const map: QuizResultMap = {};
	for (const r of rows) {
		let selected: number[] = [];
		try {
			const parsed = JSON.parse(r.selected) as unknown;
			if (Array.isArray(parsed))
				selected = parsed.filter((n): n is number => typeof n === "number");
		} catch {
			selected = [];
		}
		map[r.quizId] = {
			correct: r.correct,
			selected,
			answeredAt: new Date(r.answeredAt).getTime(),
		};
	}
	return map;
}
