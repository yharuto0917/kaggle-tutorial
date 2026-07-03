"use client";

import { useEffect } from "react";
import {
	getAllQuizResults,
	QUIZ_RESULT_EVENT,
	replaceAllQuizResults,
} from "@/hooks/use-quiz-result";
import { getLessonProgressMap, PROGRESS_EVENT, replaceLessonProgress } from "@/lib/progress-store";
import { mergeProgress, mergeQuiz, rowsToProgressMap, rowsToQuizMap } from "@/lib/progress-sync";

// 同一オリジン。Cookie 識別（kt_uid）は自動送信される。
const PROGRESS_URL = "/api/progress";
const QUIZ_URL = "/api/quiz";

async function postJson(url: string, body: unknown): Promise<void> {
	try {
		await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
	} catch {
		// 同期は best-effort。失敗してもローカルは保持される。
	}
}

/**
 * 初回マウント時に localStorage と D1 をマージ（重複は完了優先）し、D1 へ差分を push、
 * ローカルを D1 のミラーにする。Cookie 識別なのでログイン操作は不要。
 */
async function syncProgress(): Promise<void> {
	let pRows: unknown;
	let qRows: unknown;
	try {
		const [p, q] = await Promise.all([fetch(PROGRESS_URL), fetch(QUIZ_URL)]);
		if (!p.ok || !q.ok) return;
		pRows = await p.json();
		qRows = await q.json();
	} catch {
		return;
	}

	const remoteP = rowsToProgressMap(Array.isArray(pRows) ? pRows : []);
	const remoteQ = rowsToQuizMap(Array.isArray(qRows) ? qRows : []);
	const mergedP = mergeProgress(getLessonProgressMap(), remoteP);
	const mergedQ = mergeQuiz(getAllQuizResults(), remoteQ);

	for (const [lessonId, v] of Object.entries(mergedP)) {
		const r = remoteP[lessonId];
		if (!r || r.status !== v.status)
			await postJson(PROGRESS_URL, { lessonId, status: v.status, explicit: false });
	}
	for (const [quizId, v] of Object.entries(mergedQ)) {
		const r = remoteQ[quizId];
		if (!r || r.answeredAt !== v.answeredAt || r.correct !== v.correct) {
			await postJson(QUIZ_URL, {
				quizId,
				correct: v.correct,
				selected: v.selected,
				answeredAt: v.answeredAt,
			});
		}
	}

	// ローカルを D1 のミラーにする（詳細なし通知 → write-through は反応しない）。
	replaceLessonProgress(mergedP);
	replaceAllQuizResults(mergedQ);
}

/**
 * localStorage ↔ D1 を橋渡しする同期コンポーネント（UI なし）。ルートレイアウトに 1 つ配置。
 * マウント時に同期し、以降は単一変更を D1 へ write-through する。
 */
export function ProgressSync() {
	useEffect(() => {
		void syncProgress();
	}, []);

	// 単一の変更（detail 付き）を D1 へ書き込む。一括置換（detail なし）は無視。
	useEffect(() => {
		function onProgress(e: Event) {
			const d = (e as CustomEvent).detail as
				| { lessonId: string; status: string; source: "user" | "visit" }
				| undefined;
			if (!d) return;
			// 暗黙の訪問記録（"visit"）は D1 の completed を降格しない（サーバー側でガード）。
			void postJson(PROGRESS_URL, {
				lessonId: d.lessonId,
				status: d.status,
				explicit: d.source !== "visit",
			});
		}
		function onQuiz(e: Event) {
			const d = (e as CustomEvent).detail as
				| { id: string; correct: boolean; selected: number[]; answeredAt: number }
				| undefined;
			if (!d) return;
			void postJson(QUIZ_URL, {
				quizId: d.id,
				correct: d.correct,
				selected: d.selected,
				answeredAt: d.answeredAt,
			});
		}
		window.addEventListener(PROGRESS_EVENT, onProgress);
		window.addEventListener(QUIZ_RESULT_EVENT, onQuiz);
		return () => {
			window.removeEventListener(PROGRESS_EVENT, onProgress);
			window.removeEventListener(QUIZ_RESULT_EVENT, onQuiz);
		};
	}, []);

	return null;
}
