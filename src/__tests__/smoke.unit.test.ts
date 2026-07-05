import { describe, expect, it } from "vitest";

describe("smoke (unit / jsdom)", () => {
	it("jsdom 環境で DOM が利用できる", () => {
		expect(typeof document).toBe("object");
		const el = document.createElement("div");
		el.textContent = "Kaggle Tutorial";
		expect(el.textContent).toBe("Kaggle Tutorial");
	});
});
