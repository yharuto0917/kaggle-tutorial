import { describe, expect, it } from "vitest";

describe("smoke (workers / workerd)", () => {
	it("Workers ランタイム上で実行されている", () => {
		// workerd では navigator.userAgent が "Cloudflare-Workers" になる
		expect(navigator.userAgent).toBe("Cloudflare-Workers");
		expect(1 + 1).toBe(2);
	});
});
