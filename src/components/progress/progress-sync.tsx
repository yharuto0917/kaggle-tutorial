"use client";

import { useEffect } from "react";
import {
	getAllQuizResults,
	QUIZ_RESULT_EVENT,
	replaceAllQuizResults,
} from "@/hooks/use-quiz-result";
import { apiClient } from "@/lib/api-client";
import { getLessonProgressMap, PROGRESS_EVENT, replaceLessonProgress } from "@/lib/progress-store";
import { mergeProgress, mergeQuiz, rowsToProgressMap, rowsToQuizMap } from "@/lib/progress-sync";

/** 直近の同期時刻（epoch ms）を保存する localStorage キー。マウント同期の頻度を抑える。 */
const SYNC_MARKER_KEY = "kt:last-sync";
const SYNC_TTL_MS = 5 * 60_000;

function shouldSync(): boolean {
	try {
		const last = Number(window.localStorage.getItem(SYNC_MARKER_KEY) ?? 0);
		return Date.now() - last > SYNC_TTL_MS;
	} catch {
		return true;
	}
}

function markSynced(): void {
	try {
		window.localStorage.setItem(SYNC_MARKER_KEY, String(Date.now()));
	} catch {
		// 失敗しても致命的ではない（次回また同期が走るだけ）。
	}
}

async function postProgress(lessonId: string, status: string, explicit: boolean): Promise<void> {
	try {
		await apiClient.api.progress.$post({ json: { lessonId, status, explicit } });
	} catch {
		// 同期は best-effort。失敗してもローカルは保持される。
	}
}

async function postQuiz(
	quizId: string,
	correct: boolean,
	selected: number[],
	answeredAt: number,
): Promise<void> {
	try {
		await apiClient.api.quiz.$post({ json: { quizId, correct, selected, answeredAt } });
	} catch {
		// 同期は best-effort。失敗してもローカルは保持される。
	}
}

/**
 * 初回マウント時に localStorage と D1 をマージ（重複は完了優先）し、D1 へ差分を push、
 * ローカルを D1 のミラーにする。Cookie 識別なのでログイン操作は不要。
 *
 * GET は progress → quiz の順に直列で送る。Cookie 未発行の状態で並列に送ると、
 * ミドルウェアがリクエストごとに別々の kt_uid を発行してしまうため。
 */
async function syncProgress(): Promise<void> {
	let pRows: unknown;
	let qRows: unknown;
	try {
		const p = await apiClient.api.progress.$get();
		if (!p.ok) return;
		pRows = await p.json();
		const q = await apiClient.api.quiz.$get();
		if (!q.ok) return;
		qRows = await q.json();
	} catch {
		return;
	}

	const remoteP = rowsToProgressMap(Array.isArray(pRows) ? pRows : []);
	const remoteQ = rowsToQuizMap(Array.isArray(qRows) ? qRows : []);
	const mergedP = mergeProgress(getLessonProgressMap(), remoteP);
	const mergedQ = mergeQuiz(getAllQuizResults(), remoteQ);

	const pushes: Promise<void>[] = [];
	for (const [lessonId, v] of Object.entries(mergedP)) {
		const r = remoteP[lessonId];
		if (!r || r.status !== v.status) pushes.push(postProgress(lessonId, v.status, false));
	}
	for (const [quizId, v] of Object.entries(mergedQ)) {
		const r = remoteQ[quizId];
		if (!r || r.answeredAt !== v.answeredAt || r.correct !== v.correct) {
			pushes.push(postQuiz(quizId, v.correct, v.selected, v.answeredAt));
		}
	}
	await Promise.all(pushes);

	// ローカルを D1 のミラーにする（詳細なし通知 → write-through は反応しない）。
	replaceLessonProgress(mergedP);
	replaceAllQuizResults(mergedQ);
	markSynced();
}

/**
 * localStorage ↔ D1 を橋渡しする同期コンポーネント（UI なし）。ルートレイアウトに 1 つ配置。
 * マウント時に同期し（直近の同期から SYNC_TTL_MS 未満ならスキップ）、以降は単一変更を
 * D1 へ write-through する（こちらはゲートしない）。
 */
export function ProgressSync() {
	useEffect(() => {
		if (shouldSync()) void syncProgress();
	}, []);

	// 単一の変更（detail 付き）を D1 へ書き込む。一括置換（detail なし）は無視。
	useEffect(() => {
		function onProgress(e: Event) {
			const d = (e as CustomEvent).detail as
				| { lessonId: string; status: string; source: "user" | "visit" }
				| undefined;
			if (!d) return;
			// 暗黙の訪問記録（"visit"）は D1 の completed を降格しない（サーバー側でガード）。
			void postProgress(d.lessonId, d.status, d.source !== "visit");
		}
		function onQuiz(e: Event) {
			const d = (e as CustomEvent).detail as
				| { id: string; correct: boolean; selected: number[]; answeredAt: number }
				| undefined;
			if (!d) return;
			void postQuiz(d.id, d.correct, d.selected, d.answeredAt);
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
