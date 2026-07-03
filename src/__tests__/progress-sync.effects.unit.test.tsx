import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressSync } from "@/components/progress/progress-sync";
import { PROGRESS_EVENT } from "@/lib/progress-store";

function jsonResponse(body: unknown, ok = true): Response {
	return new Response(JSON.stringify(body), {
		status: ok ? 200 : 500,
		headers: { "content-type": "application/json" },
	});
}

beforeEach(() => {
	window.localStorage.clear();
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("<ProgressSync>（副作用）", () => {
	it("初回マウントで GET が progress → quiz の順に直列で呼ばれる", async () => {
		const calls: string[] = [];
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			calls.push(String(input));
			return jsonResponse([]);
		});
		vi.stubGlobal("fetch", fetchMock);

		render(<ProgressSync />);

		await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(2));
		expect(calls[0]).toContain("/api/progress");
		expect(calls[1]).toContain("/api/quiz");
	});

	it("直近の同期から TTL 内の再マウントでは GET を発行しない", async () => {
		window.localStorage.setItem("kt:last-sync", String(Date.now()));
		const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
			async () => jsonResponse([]),
		);
		vi.stubGlobal("fetch", fetchMock);

		render(<ProgressSync />);

		// マウント同期はゲートされるため、少し待っても GET は飛ばない。
		await new Promise((r) => setTimeout(r, 10));
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("PROGRESS_EVENT（source: user）の dispatch で explicit: true の write-through POST が飛ぶ", async () => {
		// マウント同期をゲートし、write-through だけを観測する。
		window.localStorage.setItem("kt:last-sync", String(Date.now()));
		const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
			async () => jsonResponse({}),
		);
		vi.stubGlobal("fetch", fetchMock);

		render(<ProgressSync />);

		window.dispatchEvent(
			new CustomEvent(PROGRESS_EVENT, {
				detail: { lessonId: "/learn/x", status: "completed", source: "user" },
			}),
		);

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toContain("/api/progress");
		expect(JSON.parse(init?.body as string)).toEqual({
			lessonId: "/learn/x",
			status: "completed",
			explicit: true,
		});
	});

	it("PROGRESS_EVENT（source: visit）の dispatch は explicit: false で POST される", async () => {
		window.localStorage.setItem("kt:last-sync", String(Date.now()));
		const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
			async () => jsonResponse({}),
		);
		vi.stubGlobal("fetch", fetchMock);

		render(<ProgressSync />);

		window.dispatchEvent(
			new CustomEvent(PROGRESS_EVENT, {
				detail: { lessonId: "/learn/x", status: "in-progress", source: "visit" },
			}),
		);

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [, init] = fetchMock.mock.calls[0];
		expect(JSON.parse(init?.body as string)).toEqual({
			lessonId: "/learn/x",
			status: "in-progress",
			explicit: false,
		});
	});
});
