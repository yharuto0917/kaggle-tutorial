import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { glossary } from "@/lib/glossary";

/**
 * content/learn/*\/meta.json から、実在するレッスン URL の集合を組み立てる。
 * fumadocs の生成物（@/.source）は vitest の unit プロジェクトからは不安定なため、
 * meta.json をソースとして直接読む（source.getPages() が返す URL と同じ形式）。
 */
function buildValidLessonUrls(): Set<string> {
	const contentRoot = path.join(process.cwd(), "content", "learn");
	const root = JSON.parse(readFileSync(path.join(contentRoot, "meta.json"), "utf8")) as {
		pages: string[];
	};

	const valid = new Set<string>();
	for (const track of root.pages) {
		const meta = JSON.parse(readFileSync(path.join(contentRoot, track, "meta.json"), "utf8")) as {
			pages: string[];
		};
		for (const page of meta.pages) {
			valid.add(`/learn/${track}/${page}`);
		}
	}
	return valid;
}

describe("glossary の関連レッスンリンク", () => {
	it("すべての related.href が実在するレッスン URL を指している", () => {
		const validUrls = buildValidLessonUrls();
		const brokenLinks = glossary.flatMap((entry) =>
			(entry.related ?? [])
				.filter((r) => !validUrls.has(r.href))
				.map((r) => `${entry.slug}: ${r.href}`),
		);
		expect(brokenLinks).toEqual([]);
	});
});
