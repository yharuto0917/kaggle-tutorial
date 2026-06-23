"use client";

import { useEffect, useRef } from "react";
import {
	getAllQuizResults,
	QUIZ_RESULT_EVENT,
	replaceAllQuizResults,
} from "@/hooks/use-quiz-result";
import { authClient } from "@/lib/auth-client";
import { getLessonProgressMap, PROGRESS_EVENT, replaceLessonProgress } from "@/lib/progress-store";
import { mergeProgress, mergeQuiz, rowsToProgressMap, rowsToQuizMap } from "@/lib/progress-sync";

// ベース URL は同一オリジン。Cookie（Better Auth セッション）は同一オリジンで送られる。
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
 * ログイン時に localStorage の進捗/クイズを D1 とマージし（重複は完了優先）、
 * D1 へ差分を push してローカルを D1 のミラーにする。
 */
async function syncOnLogin(): Promise<void> {
	let pRows: unknown;
	let qRows: unknown;
	try {
		const [p, q] = await Promise.all([fetch(PROGRESS_URL), fetch(QUIZ_URL)]);
		if (!p.ok || !q.ok) return; // 未認証・エラー時は何もしない
		pRows = await p.json();
		qRows = await q.json();
	} catch {
		return;
	}

	const remoteP = rowsToProgressMap(Array.isArray(pRows) ? pRows : []);
	const remoteQ = rowsToQuizMap(Array.isArray(qRows) ? qRows : []);
	const mergedP = mergeProgress(getLessonProgressMap(), remoteP);
	const mergedQ = mergeQuiz(getAllQuizResults(), remoteQ);

	// D1 に無い / 異なる項目だけ push（idempotent upsert）。
	for (const [lessonId, v] of Object.entries(mergedP)) {
		const r = remoteP[lessonId];
		if (!r || r.status !== v.status) await postJson(PROGRESS_URL, { lessonId, status: v.status });
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

	// ローカルを D1 のミラーにする（詳細なし通知 → 書き戻しは発生しない）。
	replaceLessonProgress(mergedP);
	replaceAllQuizResults(mergedQ);
}

/**
 * 認証状態に応じて localStorage ↔ D1 を橋渡しする同期コンポーネント（UI なし）。
 * ルートレイアウトに 1 つだけ配置する。
 *
 * 注: `apiClient`（Hono RPC）の型共有はそのまま利用可能だが、本同期は入力型の都合で
 * `fetch` を用いている（`apiClient` は #23 で導入済み・他用途で利用）。
 */
export function ProgressSync() {
	const { data: session } = authClient.useSession();
	const userId = session?.user.id ?? null;
	const loggedInRef = useRef(false);
	const syncedFor = useRef<string | null>(null);

	useEffect(() => {
		loggedInRef.current = userId !== null;
		if (!userId || syncedFor.current === userId) return;
		syncedFor.current = userId;
		void syncOnLogin();
	}, [userId]);

	// ログイン中は単一の変更を D1 へ書き込む（write-through）。一括置換（detail なし）は無視。
	useEffect(() => {
		function onProgress(e: Event) {
			const d = (e as CustomEvent).detail as { lessonId: string; status: string } | undefined;
			if (!loggedInRef.current || !d) return;
			void postJson(PROGRESS_URL, { lessonId: d.lessonId, status: d.status });
		}
		function onQuiz(e: Event) {
			const d = (e as CustomEvent).detail as
				| { id: string; correct: boolean; selected: number[]; answeredAt: number }
				| undefined;
			if (!loggedInRef.current || !d) return;
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
