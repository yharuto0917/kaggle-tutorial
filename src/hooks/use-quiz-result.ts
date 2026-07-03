"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";

/** localStorage に保存するクイズ 1 問分の結果。 */
export type QuizResult = {
	/** 正解だったか */
	correct: boolean;
	/** 選んだ選択肢インデックス */
	selected: number[];
	/** 回答時刻（エポックミリ秒） */
	answeredAt: number;
};

/** 全クイズ結果を入れる localStorage キー（id → 結果）。 */
const STORAGE_KEY = "kt:quiz-results";

/** 進捗トラッキング（#16）が購読できるよう、保存時に発火するイベント名。 */
export const QUIZ_RESULT_EVENT = "kt:quiz-result";

/** クイズ ID → 結果 のマップ。 */
export type QuizResultMap = Record<string, QuizResult>;

const EMPTY: QuizResultMap = {};

const store = createLocalStore<QuizResultMap>(STORAGE_KEY, QUIZ_RESULT_EVENT, EMPTY);

/** 保存済みのクイズ結果を全件取得する（同期層 #25 用）。 */
export function getAllQuizResults(): QuizResultMap {
	return store.get();
}

/** クイズ結果全体を置き換える（ログイン時の D1 ミラー用）。詳細なしで通知し書き戻しを防ぐ。 */
export function replaceAllQuizResults(map: QuizResultMap): void {
	store.write(map);
}

/**
 * クイズ 1 問の結果を localStorage に読み書きするフック。
 *
 * - `useSyncExternalStore` で localStorage を購読し、保存済みの結果を返す
 *   （リロードや他タブの更新にも追従し、SSR では null を返す）。
 * - 保存時に `kt:quiz-result` イベントを発火し、進捗ストア側（Phase2: localStorage、
 *   Phase3: D1 同期）が購読できるようにする。
 */
export function useQuizResult(id: string) {
	const result = useSyncExternalStore<QuizResult | null>(
		store.subscribe,
		() => store.get()[id] ?? null,
		() => null,
	);

	const save = useCallback(
		(next: QuizResult) => {
			const all = { ...store.get(), [id]: next };
			store.write(all, { id, ...next });
		},
		[id],
	);

	return { result, save };
}
