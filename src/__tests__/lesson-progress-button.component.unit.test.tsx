import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LessonProgressButton } from "@/components/progress/lesson-progress-button";
import { getLessonProgressMap } from "@/lib/progress-store";

const LESSON = "/learn/track/lesson-1";

beforeEach(() => {
	window.localStorage.clear();
});
afterEach(cleanup);

describe("<LessonProgressButton>", () => {
	it("マウント時に in-progress を記録する", () => {
		render(<LessonProgressButton lessonId={LESSON} />);
		expect(getLessonProgressMap()[LESSON]?.status).toBe("in-progress");
	});

	it("クリックで完了になり、表示が切り替わる", () => {
		render(<LessonProgressButton lessonId={LESSON} />);

		fireEvent.click(screen.getByRole("button", { name: "このレッスンを完了にする" }));

		expect(getLessonProgressMap()[LESSON]?.status).toBe("completed");
		expect(screen.getByRole("button", { name: "✓ 完了済み（取り消す）" })).toBeTruthy();
	});

	it("もう一度クリックすると完了が取り消される", () => {
		render(<LessonProgressButton lessonId={LESSON} />);

		fireEvent.click(screen.getByRole("button", { name: "このレッスンを完了にする" }));
		fireEvent.click(screen.getByRole("button", { name: "✓ 完了済み（取り消す）" }));

		expect(getLessonProgressMap()[LESSON]?.status).toBe("in-progress");
	});
});
