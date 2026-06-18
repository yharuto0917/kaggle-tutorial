import { beforeEach, describe, expect, it } from "vitest";
import {
	countCompleted,
	getLessonProgressMap,
	markCompleted,
	markVisited,
	setLessonStatus,
	toggleCompleted,
} from "@/lib/progress-store";

const A = "/learn/track/a";
const B = "/learn/track/b";

beforeEach(() => {
	window.localStorage.clear();
});

describe("progress-store", () => {
	it("markVisited は未記録を in-progress にする", () => {
		markVisited(A);
		expect(getLessonProgressMap()[A]?.status).toBe("in-progress");
	});

	it("markVisited は完了済みを降格しない（冪等）", () => {
		markCompleted(A);
		markVisited(A);
		expect(getLessonProgressMap()[A]?.status).toBe("completed");
	});

	it("markCompleted は completed にする", () => {
		markCompleted(A);
		expect(getLessonProgressMap()[A]?.status).toBe("completed");
	});

	it("toggleCompleted は completed と in-progress を行き来する", () => {
		markCompleted(A);
		toggleCompleted(A);
		expect(getLessonProgressMap()[A]?.status).toBe("in-progress");
		toggleCompleted(A);
		expect(getLessonProgressMap()[A]?.status).toBe("completed");
	});

	it("setLessonStatus(null) は記録を削除する", () => {
		markCompleted(A);
		setLessonStatus(A, null);
		expect(getLessonProgressMap()[A]).toBeUndefined();
	});

	it("リロード相当（再読込）でも進捗が残る", () => {
		markCompleted(A);
		// localStorage の生データから読み直しても completed のまま。
		const raw = window.localStorage.getItem("kt:lesson-progress");
		expect(raw).toContain("completed");
		expect(getLessonProgressMap()[A]?.status).toBe("completed");
	});

	describe("countCompleted", () => {
		it("指定 URL 群の completed 件数を数える", () => {
			markCompleted(A);
			markVisited(B);
			expect(countCompleted(getLessonProgressMap(), [A, B])).toBe(1);
		});

		it("対象が無ければ 0", () => {
			expect(countCompleted({}, [A, B])).toBe(0);
		});
	});
});
