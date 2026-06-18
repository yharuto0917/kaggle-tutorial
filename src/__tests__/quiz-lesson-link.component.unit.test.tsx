import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Quiz } from "@/components/mdx/quiz";
import { LessonProvider } from "@/components/progress/lesson-context";
import { getLessonProgressMap } from "@/lib/progress-store";

const LESSON = "/learn/track/lesson-q";

beforeEach(() => {
	window.localStorage.clear();
});
afterEach(cleanup);

describe("クイズ達成連動", () => {
	it("レッスン内で正解するとレッスンが完了になる", () => {
		render(
			<LessonProvider lessonId={LESSON}>
				<Quiz id="link-q" question="2 + 2 は？" options={["3", "4"]} answer={1} />
			</LessonProvider>,
		);

		fireEvent.click(screen.getByRole("radio", { name: "4" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(getLessonProgressMap()[LESSON]?.status).toBe("completed");
	});

	it("誤答ではレッスンは完了にならない", () => {
		render(
			<LessonProvider lessonId={LESSON}>
				<Quiz id="link-q2" question="2 + 2 は？" options={["3", "4"]} answer={1} />
			</LessonProvider>,
		);

		fireEvent.click(screen.getByRole("radio", { name: "3" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(getLessonProgressMap()[LESSON]).toBeUndefined();
	});

	it("LessonProvider が無ければ進捗へ影響しない", () => {
		render(<Quiz id="link-q3" question="2 + 2 は？" options={["3", "4"]} answer={1} />);

		fireEvent.click(screen.getByRole("radio", { name: "4" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(Object.keys(getLessonProgressMap())).toHaveLength(0);
	});
});
