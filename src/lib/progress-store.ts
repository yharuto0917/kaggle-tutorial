/**
 * レッスン進捗を localStorage に保存するストア。
 *
 * - 状態は `in-progress`（閲覧開始）/ `completed`（完了）の 2 値。
 * - データ構造は将来の D1 スキーマ `lesson_progress(lesson_id, status, updated_at)`
 *   と整合させ、Phase3 の同期へ移行しやすくする。
 * - クイズ結果は別キー（`kt:quiz-results`、`lesson_progress` とは別テーブル相当）に
 *   保存され、`<Quiz>` が正解時にこのストアの `markCompleted` を呼ぶことで連動する。
 *
 * React からは `useSyncExternalStore`（src/hooks/use-progress.ts）経由で購読する。
 * getSnapshot が安定参照を返せるよう、生文字列が変わったときだけ再パースしてキャッシュする。
 */

export type LessonStatus = "in-progress" | "completed";

export type LessonProgress = {
	status: LessonStatus;
	/** 最終更新時刻（エポックミリ秒） */
	updatedAt: number;
};

/** レッスン URL（例: /learn/python-data-analysis/06-eda）→ 進捗 のマップ。 */
export type LessonProgressMap = Record<string, LessonProgress>;

const STORAGE_KEY = "kt:lesson-progress";

/** 進捗が変わったときに発火するイベント名（同一タブ内の購読用）。 */
export const PROGRESS_EVENT = "kt:lesson-progress";

const EMPTY: LessonProgressMap = {};

let cachedRaw: string | null = null;
let cachedParsed: LessonProgressMap = EMPTY;

/** 現在の進捗マップを返す（安定参照。生文字列が変わったときだけ再パース）。 */
export function getLessonProgressMap(): LessonProgressMap {
	if (typeof window === "undefined") return EMPTY;
	let raw: string | null = null;
	try {
		raw = window.localStorage.getItem(STORAGE_KEY);
	} catch {
		raw = null;
	}
	if (raw !== cachedRaw) {
		cachedRaw = raw;
		try {
			cachedParsed = raw ? (JSON.parse(raw) as LessonProgressMap) : EMPTY;
		} catch {
			cachedParsed = EMPTY;
		}
	}
	return cachedParsed;
}

/** 進捗変更（storage / カスタムイベント）を購読する。 */
export function subscribeProgress(onChange: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	window.addEventListener("storage", onChange);
	window.addEventListener(PROGRESS_EVENT, onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(PROGRESS_EVENT, onChange);
	};
}

/**
 * 1 件変更時に同期層（#25）が拾うための詳細。一括置換時は付けない。
 * `source` は暗黙の訪問記録（"visit"）か、ユーザーの明示操作（"user"）かを区別する。
 * 同期層はこれを見て、暗黙の in-progress で D1 の completed を降格しないようにする。
 */
export type LessonProgressChange = {
	lessonId: string;
	status: LessonStatus;
	source: "user" | "visit";
};

function write(map: LessonProgressMap, detail?: LessonProgressChange): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
		window.dispatchEvent(new CustomEvent(PROGRESS_EVENT, detail ? { detail } : undefined));
	} catch {
		// localStorage 非対応・容量超過時は永続化を諦める。
	}
}

/** レッスンの状態を設定する。null を渡すと記録を削除する。 */
export function setLessonStatus(
	lessonId: string,
	status: LessonStatus | null,
	source: "user" | "visit" = "user",
): void {
	const current = getLessonProgressMap();
	const next: LessonProgressMap = { ...current };
	if (status === null) {
		delete next[lessonId];
	} else {
		next[lessonId] = { status, updatedAt: Date.now() };
	}
	write(next, status === null ? undefined : { lessonId, status, source });
}

/** 進捗マップ全体を置き換える（ログイン時の D1 ミラー用）。詳細なしで通知し書き戻しを防ぐ。 */
export function replaceLessonProgress(map: LessonProgressMap): void {
	write(map);
}

/** 未記録のレッスンを「閲覧開始（in-progress）」にする。完了済みは変更しない（冪等）。 */
export function markVisited(lessonId: string): void {
	if (getLessonProgressMap()[lessonId]) return;
	setLessonStatus(lessonId, "in-progress", "visit");
}

/** レッスンを完了にする。 */
export function markCompleted(lessonId: string): void {
	if (getLessonProgressMap()[lessonId]?.status === "completed") return;
	setLessonStatus(lessonId, "completed");
}

/** 完了/未完了をトグルする（完了 → 閲覧開始へ戻す）。 */
export function toggleCompleted(lessonId: string): void {
	const status = getLessonProgressMap()[lessonId]?.status;
	setLessonStatus(lessonId, status === "completed" ? "in-progress" : "completed");
}

/** 与えた URL 群のうち「完了」の件数を数える（進捗バー用の純粋関数）。 */
export function countCompleted(map: LessonProgressMap, urls: string[]): number {
	return urls.reduce((acc, url) => (map[url]?.status === "completed" ? acc + 1 : acc), 0);
}
