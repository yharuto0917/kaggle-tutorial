"use client";

import { useCallback, useSyncExternalStore } from "react";

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

// useSyncExternalStore は getSnapshot が安定参照を返すことを要求するため、
// localStorage の生文字列が変わったときだけ再パースしてキャッシュする。
let cachedRaw: string | null = null;
let cachedParsed: Record<string, QuizResult> = {};

function getAll(): Record<string, QuizResult> {
	if (typeof window === "undefined") return cachedParsed;
	let raw: string | null = null;
	try {
		raw = window.localStorage.getItem(STORAGE_KEY);
	} catch {
		raw = null;
	}
	if (raw !== cachedRaw) {
		cachedRaw = raw;
		try {
			cachedParsed = raw ? (JSON.parse(raw) as Record<string, QuizResult>) : {};
		} catch {
			cachedParsed = {};
		}
	}
	return cachedParsed;
}

function subscribe(onChange: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	// 他タブからの storage 変更と、同一タブ内の保存（カスタムイベント）の両方を購読。
	window.addEventListener("storage", onChange);
	window.addEventListener(QUIZ_RESULT_EVENT, onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(QUIZ_RESULT_EVENT, onChange);
	};
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
		subscribe,
		() => getAll()[id] ?? null,
		() => null,
	);

	const save = useCallback(
		(next: QuizResult) => {
			if (typeof window === "undefined") return;
			try {
				const all = { ...getAll(), [id]: next };
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
				window.dispatchEvent(new CustomEvent(QUIZ_RESULT_EVENT, { detail: { id, ...next } }));
			} catch {
				// localStorage 非対応・容量超過時は永続化を諦める。
			}
		},
		[id],
	);

	return { result, save };
}
