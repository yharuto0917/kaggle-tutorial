import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Quiz } from "@/components/mdx/quiz";

beforeEach(() => {
	window.localStorage.clear();
});
afterEach(cleanup);

describe("<Quiz> 回答→即時採点→解説表示", () => {
	it("単一選択で正解を選ぶと『正解！』と解説が出る", () => {
		render(
			<Quiz
				id="t-single"
				question="2 + 2 は？"
				options={["3", "4", "5"]}
				answer={1}
				explanation="2 + 2 = 4 です。"
			/>,
		);

		// 採点前は結果も解説も出ていない。
		expect(screen.queryByText("正解！")).toBeNull();
		expect(screen.queryByText("2 + 2 = 4 です。")).toBeNull();

		fireEvent.click(screen.getByRole("radio", { name: "4" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(screen.getByText("正解！")).toBeTruthy();
		expect(screen.getByText("2 + 2 = 4 です。")).toBeTruthy();
		// 採点後は「もう一度」へ切り替わる。
		expect(screen.getByRole("button", { name: "もう一度" })).toBeTruthy();
	});

	it("単一選択で誤答を選ぶと『不正解』になる", () => {
		render(<Quiz id="t-wrong" question="2 + 2 は？" options={["3", "4", "5"]} answer={1} />);

		fireEvent.click(screen.getByRole("radio", { name: "3" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(screen.getByText("不正解")).toBeTruthy();
	});

	it("複数選択は正解の組をすべて選ぶと正解になる", () => {
		render(
			<Quiz id="t-multi" question="偶数はどれ？" options={["1", "2", "3", "4"]} answer={[1, 3]} />,
		);

		fireEvent.click(screen.getByRole("checkbox", { name: "2" }));
		fireEvent.click(screen.getByRole("checkbox", { name: "4" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		expect(screen.getByText("正解！")).toBeTruthy();
	});

	it("結果を localStorage に保存する", () => {
		render(<Quiz id="t-store" question="2 + 2 は？" options={["3", "4"]} answer={1} />);

		fireEvent.click(screen.getByRole("radio", { name: "4" }));
		fireEvent.click(screen.getByRole("button", { name: "回答する" }));

		const saved = JSON.parse(window.localStorage.getItem("kt:quiz-results") ?? "{}");
		expect(saved["t-store"]?.correct).toBe(true);
		expect(saved["t-store"]?.selected).toEqual([1]);
	});

	it("未選択では回答ボタンが無効", () => {
		render(<Quiz id="t-disabled" question="2 + 2 は？" options={["3", "4"]} answer={1} />);
		expect(screen.getByRole("button", { name: "回答する" })).toHaveProperty("disabled", true);
	});
});
