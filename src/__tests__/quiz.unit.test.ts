import { describe, expect, it } from "vitest";
import { gradeQuiz, isMultipleChoice, normalizeAnswer } from "@/lib/quiz";

describe("quiz 採点ロジック", () => {
	describe("normalizeAnswer", () => {
		it("単一の数値を配列へ正規化する", () => {
			expect(normalizeAnswer(2)).toEqual([2]);
		});
		it("配列はそのまま返す", () => {
			expect(normalizeAnswer([0, 2])).toEqual([0, 2]);
		});
	});

	describe("isMultipleChoice", () => {
		it("配列なら複数選択", () => {
			expect(isMultipleChoice([0, 1])).toBe(true);
		});
		it("数値なら単一選択", () => {
			expect(isMultipleChoice(1)).toBe(false);
		});
	});

	describe("gradeQuiz（単一選択）", () => {
		it("正解の選択肢を選べば正解", () => {
			expect(gradeQuiz(1, [1])).toBe(true);
		});
		it("誤った選択肢なら不正解", () => {
			expect(gradeQuiz(1, [0])).toBe(false);
		});
	});

	describe("gradeQuiz（複数選択）", () => {
		it("順不同で一致すれば正解", () => {
			expect(gradeQuiz([0, 2], [2, 0])).toBe(true);
		});
		it("選択が不足していれば不正解", () => {
			expect(gradeQuiz([0, 2], [0])).toBe(false);
		});
		it("余分に選べば不正解", () => {
			expect(gradeQuiz([0, 2], [0, 1, 2])).toBe(false);
		});
		it("正解数は同じでも中身が違えば不正解", () => {
			expect(gradeQuiz([0, 2], [0, 1])).toBe(false);
		});
	});

	it("未選択は不正解", () => {
		expect(gradeQuiz(0, [])).toBe(false);
	});
});
