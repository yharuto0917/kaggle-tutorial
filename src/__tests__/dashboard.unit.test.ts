import { describe, expect, it } from "vitest";
import { computeStreak, quizAccuracy, trackProgress } from "@/lib/dashboard";

describe("dashboard 集計", () => {
	describe("trackProgress", () => {
		it("トラック別と全体の完了数を集計する", () => {
			const completed = new Set(["/t1/a", "/t1/b", "/t2/a"]);
			const out = trackProgress(completed, [
				{ title: "T1", urls: ["/t1/a", "/t1/b", "/t1/c"] },
				{ title: "T2", urls: ["/t2/a", "/t2/b"] },
			]);
			expect(out.tracks[0]).toEqual({ title: "T1", total: 3, done: 2 });
			expect(out.tracks[1]).toEqual({ title: "T2", total: 2, done: 1 });
			expect(out.total).toBe(5);
			expect(out.done).toBe(3);
		});
	});

	describe("quizAccuracy", () => {
		it("正答率（%）を計算する", () => {
			expect(
				quizAccuracy([{ correct: true }, { correct: false }, { correct: true }, { correct: true }]),
			).toEqual({ total: 4, correct: 3, pct: 75 });
		});
		it("0 件なら 0%", () => {
			expect(quizAccuracy([])).toEqual({ total: 0, correct: 0, pct: 0 });
		});
	});

	describe("computeStreak", () => {
		const NOW = Date.UTC(2026, 5, 23, 12, 0, 0); // 2026-06-23
		const day = (d: number) => Date.UTC(2026, 5, d, 9, 0, 0);

		it("今日から連続している日数を数える", () => {
			expect(computeStreak([day(23), day(22), day(21)], NOW)).toBe(3);
		});
		it("途切れたらそこで止まる", () => {
			expect(computeStreak([day(23), day(21), day(20)], NOW)).toBe(1);
		});
		it("今日未活動でも昨日からの連続は継続扱い", () => {
			expect(computeStreak([day(22), day(21)], NOW)).toBe(2);
		});
		it("活動が無ければ 0", () => {
			expect(computeStreak([], NOW)).toBe(0);
		});
		it("2 日以上前で途切れていれば 0", () => {
			expect(computeStreak([day(20), day(19)], NOW)).toBe(0);
		});
		it("UTC 深夜の活動を JST の日付として数える（JST 境界）", () => {
			// UTC 2026-06-22 20:00 = JST 2026-06-23 05:00（JST では「今日」の活動）
			const lateUtcActivity = Date.UTC(2026, 5, 22, 20, 0, 0);
			// UTC 2026-06-23 03:00 = JST 2026-06-23 12:00（「今日」の基準時刻）
			const now = Date.UTC(2026, 5, 23, 3, 0, 0);
			expect(computeStreak([lateUtcActivity], now)).toBe(1);
		});
		it("JST では同日でも UTC 日付が割れる活動は 1 日として数える", () => {
			// JST 2026-06-23 06:00（UTC 06-22 21:00）と JST 2026-06-23 22:00（UTC 06-23 13:00）
			const morningJst = Date.UTC(2026, 5, 22, 21, 0, 0);
			const eveningJst = Date.UTC(2026, 5, 23, 13, 0, 0);
			const now = eveningJst;
			expect(computeStreak([morningJst, eveningJst], now)).toBe(1);
		});
	});
});
