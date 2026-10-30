import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RunLinks } from "@/components/mdx/run-links";
import { LessonProvider } from "@/components/progress/lesson-context";

let mockedPathname = "/";

vi.mock("next/navigation", () => ({
	usePathname: () => mockedPathname,
}));

afterEach(() => {
	mockedPathname = "/";
	cleanup();
});

describe("<RunLinks>", () => {
	it("登録済みレッスン内では Colab 起動リンク・.ipynb ダウンロード・Kaggle リンクを表示する", () => {
		render(
			<LessonProvider lessonId="/learn/python-data-analysis/01-python-basics">
				<RunLinks kaggle="https://www.kaggle.com/code" />
			</LessonProvider>,
		);

		const colabLink = screen.getByRole("link", { name: /Google Colab で開く/ });
		expect(colabLink.getAttribute("href")).toContain(
			"/public/notebooks/learn/python-data-analysis/01-python-basics.ipynb",
		);
		expect(colabLink.getAttribute("target")).toBe("_blank");

		const downloadLink = screen.getByRole("link", { name: /\.ipynb をダウンロード/ });
		expect(downloadLink.getAttribute("href")).toBe(
			"/notebooks/learn/python-data-analysis/01-python-basics.ipynb",
		);
		expect(downloadLink.getAttribute("download")).toBe("01-python-basics.ipynb");

		const kaggleLink = screen.getByRole("link", { name: /Kaggle で開く/ });
		expect(kaggleLink.getAttribute("href")).toBe("https://www.kaggle.com/code");
	});

	it("LessonProvider 外（/competitions/*）でも usePathname から自動解決する", () => {
		mockedPathname = "/competitions/titanic";
		render(<RunLinks kaggle="https://www.kaggle.com/competitions/titanic" />);

		const colabLink = screen.getByRole("link", { name: /Google Colab で開く/ });
		expect(colabLink.getAttribute("href")).toContain(
			"/public/notebooks/competitions/titanic.ipynb",
		);

		const downloadLink = screen.getByRole("link", { name: /\.ipynb をダウンロード/ });
		expect(downloadLink.getAttribute("download")).toBe("titanic.ipynb");
	});

	it("未登録レッスンではダミーの Colab リンクを表示せず Kaggle リンクのみ表示する", () => {
		render(
			<LessonProvider lessonId="/learn/advanced/01-target-encoding">
				<RunLinks kaggle="https://www.kaggle.com/code" />
			</LessonProvider>,
		);

		expect(screen.queryByRole("link", { name: /Google Colab で開く/ })).toBeNull();
		expect(screen.queryByRole("link", { name: /\.ipynb をダウンロード/ })).toBeNull();
		expect(screen.getByRole("link", { name: /Kaggle で開く/ })).toBeTruthy();
	});

	it("すべてのリンクが未解決の場合は何も描画しない", () => {
		mockedPathname = "/learn/advanced/01-target-encoding";
		const { container } = render(<RunLinks />);
		expect(container.firstChild).toBeNull();
	});

	it("明示的な notebook prop 指定時は現在の URL より優先し、不正ドメインの URL は除外する", () => {
		mockedPathname = "/learn/advanced/01-target-encoding";
		render(
			<RunLinks
				notebook="competitions/house-prices"
				colab="https://example.com/fake-colab"
				kaggle="https://example.com/fake-kaggle"
			/>,
		);

		const colabLink = screen.getByRole("link", { name: /Google Colab で開く/ });
		expect(colabLink.getAttribute("href")).toContain(
			"/public/notebooks/competitions/house-prices.ipynb",
		);
		const downloadLink = screen.getByRole("link", { name: /\.ipynb をダウンロード/ });
		expect(downloadLink.getAttribute("download")).toBe("house-prices.ipynb");
		expect(screen.queryByRole("link", { name: /Kaggle で開く/ })).toBeNull();
	});
});
