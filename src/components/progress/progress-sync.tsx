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
		// マーカー未設定や非数値（外部改変・旧版の書き込み等）は NaN になりうる。
		// NaN のまま比較すると常に false になり同期が永久に止まるため、その場合は同期する。
		const last = Number(window.localStorage.getItem(SYNC_MARKER_KEY));
		if (!Number.isFinite(last)) return true;
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

/** kt_uid Cookie を確立するまで後続リクエストを待たせるゲート（初回訪問の UID 分裂対策）。 */
let cookieReady: Promise<void> | null = null;

/**
 * kt_uid Cookie 未発行の状態で複数の API リクエストを並行させると、サーバーの
 * ミドルウェアがリクエストごとに別々の UUID を発行し、進捗が別ユーザーへ分裂する
 * （例: 初回訪問時にマウント同期の GET とレッスンの write-through POST が同時発火）。
 * 最初の 1 本が完了して Cookie が確立するまで後続を待たせることでこれを防ぐ。
 */
function withSession<T>(send: () => Promise<T>): Promise<T> {
	if (cookieReady) return cookieReady.then(send);
	const first = send();
	cookieReady = first.then(
		() => undefined,
		() => undefined,
	);
	return first;
}

/** 進捗 1 件を D1 へ送る。best-effort（例外は握りつぶす）。成功可否を返す。 */
async function postProgress(lessonId: string, status: string, explicit: boolean): Promise<boolean> {
	try {
		const res = await withSession(() =>
			apiClient.api.progress.$post({ json: { lessonId, status, explicit } }),
		);
		return res.ok;
	} catch {
		// 同期は best-effort。失敗してもローカルは保持される。
		return false;
	}
}

/** クイズ結果 1 件を D1 へ送る。best-effort（例外は握りつぶす）。成功可否を返す。 */
async function postQuiz(
	quizId: string,
	correct: boolean,
	selected: number[],
	answeredAt: number,
): Promise<boolean> {
	try {
		const res = await withSession(() =>
			apiClient.api.quiz.$post({ json: { quizId, correct, selected, answeredAt } }),
		);
		return res.ok;
	} catch {
		// 同期は best-effort。失敗してもローカルは保持される。
		return false;
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
		// 最初の GET を withSession に通し、これで Cookie を確立してから後続を送る。
		const p = await withSession(() => apiClient.api.progress.$get());
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

	const pushes: Promise<boolean>[] = [];
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
	const pushed = await Promise.all(pushes);

	// ローカルを D1 のミラーにする（詳細なし通知 → write-through は反応しない）。
	// push 待ちの間にユーザーが行った変更（例: 完了クリック）を巻き戻さないよう、
	// 書き戻す直前に最新のローカルと再マージする（完了優先なので降格は起きない）。
	replaceLessonProgress(mergeProgress(getLessonProgressMap(), remoteP));
	replaceAllQuizResults(mergeQuiz(getAllQuizResults(), remoteQ));

	// push が全て成功したときだけ同期済みマーカーを更新する。1 件でも失敗していれば
	// マーカーを据え置き、次回マウントで差分の再送を試みる（best-effort の取りこぼし対策）。
	if (pushed.every(Boolean)) markSynced();
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
			// 明示操作（"user"）のみを explicit として送る。source 欠落・不明時は暗黙扱い
			// （explicit=false）にフォールバックし、D1 の completed を降格させない（fail-safe）。
			void postProgress(d.lessonId, d.status, d.source === "user");
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
