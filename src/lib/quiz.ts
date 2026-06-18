/**
 * クイズ（理解度チェック）の型と採点ロジック。
 * 採点は副作用のない純粋関数として切り出し、UI から独立してテストできるようにする。
 */

/** 正解の指定。単一選択は選択肢インデックス、複数選択はインデックスの配列。 */
export type QuizAnswer = number | number[];

export type QuizProps = {
	/** 永続化のためのキー（同一ページ内で一意にする） */
	id: string;
	/** 設問文 */
	question: string;
	/** 選択肢（表示順がそのままインデックスになる） */
	options: string[];
	/** 正解インデックス（配列を渡すと複数選択になる） */
	answer: QuizAnswer;
	/** 採点後に表示する解説（任意） */
	explanation?: string;
};

/** 正解指定を常にインデックス配列へ正規化する。 */
export function normalizeAnswer(answer: QuizAnswer): number[] {
	return Array.isArray(answer) ? answer : [answer];
}

/** answer が配列なら複数選択として扱う。 */
export function isMultipleChoice(answer: QuizAnswer): boolean {
	return Array.isArray(answer);
}

/**
 * 選んだ選択肢が正解かどうかを判定する。
 * 複数選択は順不同で比較し、過不足があれば不正解とする。
 */
export function gradeQuiz(answer: QuizAnswer, selected: number[]): boolean {
	const correct = normalizeAnswer(answer);
	if (correct.length !== selected.length) return false;
	const a = [...correct].sort((x, y) => x - y);
	const b = [...selected].sort((x, y) => x - y);
	return a.every((value, index) => value === b[index]);
}
