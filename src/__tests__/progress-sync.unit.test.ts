import { describe, expect, it } from "vitest";
import { mergeProgress, mergeQuiz, rowsToProgressMap, rowsToQuizMap } from "@/lib/progress-sync";

describe("progress-sync マージ", () => {
	describe("mergeProgress（完了優先）", () => {
		it("ローカルのみ・リモートのみを和集合にする", () => {
			const out = mergeProgress(
				{ a: { status: "completed", updatedAt: 1 } },
				{ b: { status: "in-progress", updatedAt: 1 } },
			);
			expect(Object.keys(out).sort()).toEqual(["a", "b"]);
		});

		it("重複は完了を優先する（ローカル completed > リモート in-progress）", () => {
			const out = mergeProgress(
				{ a: { status: "completed", updatedAt: 1 } },
				{ a: { status: "in-progress", updatedAt: 999 } },
			);
			expect(out.a.status).toBe("completed");
		});

		it("リモートが完了ならローカル in-progress では上書きしない", () => {
			const out = mergeProgress(
				{ a: { status: "in-progress", updatedAt: 999 } },
				{ a: { status: "completed", updatedAt: 1 } },
			);
			expect(out.a.status).toBe("completed");
		});

		it("同ランクなら updatedAt が新しい方を採る", () => {
			const out = mergeProgress(
				{ a: { status: "in-progress", updatedAt: 200 } },
				{ a: { status: "in-progress", updatedAt: 100 } },
			);
			expect(out.a.updatedAt).toBe(200);
		});
	});

	describe("mergeQuiz（新しい回答優先）", () => {
		it("answeredAt が新しい方を採る", () => {
			const out = mergeQuiz(
				{ q: { correct: true, selected: [1], answeredAt: 200 } },
				{ q: { correct: false, selected: [0], answeredAt: 100 } },
			);
			expect(out.q.correct).toBe(true);
			expect(out.q.answeredAt).toBe(200);
		});

		it("和集合になる", () => {
			const out = mergeQuiz(
				{ a: { correct: true, selected: [0], answeredAt: 1 } },
				{ b: { correct: false, selected: [1], answeredAt: 1 } },
			);
			expect(Object.keys(out).sort()).toEqual(["a", "b"]);
		});
	});

	describe("行 → マップ変換", () => {
		it("rowsToProgressMap は updatedAt を ms へ、不正 status を捨てる", () => {
			const iso = "2026-01-01T00:00:00.000Z";
			const map = rowsToProgressMap([
				{ lessonId: "/x", status: "completed", updatedAt: iso },
				{ lessonId: "/y", status: "bogus", updatedAt: iso },
			]);
			expect(map["/x"].status).toBe("completed");
			expect(map["/x"].updatedAt).toBe(new Date(iso).getTime());
			expect(map["/y"]).toBeUndefined();
		});

		it("rowsToQuizMap は selected(JSON) を配列へ、壊れていれば空配列", () => {
			const map = rowsToQuizMap([
				{ quizId: "q1", correct: true, selected: "[0,2]", answeredAt: 0 },
				{ quizId: "q2", correct: false, selected: "broken", answeredAt: 0 },
			]);
			expect(map.q1.selected).toEqual([0, 2]);
			expect(map.q2.selected).toEqual([]);
		});
	});
});
