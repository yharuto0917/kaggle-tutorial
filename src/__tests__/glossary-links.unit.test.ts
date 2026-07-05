import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { glossary } from "@/lib/glossary";

/**
 * content/learn 配下の .mdx / .md ファイルから、実在するレッスン URL の集合を組み立てる。
 *
 * fumadocs のページ URL はファイルパスで決まり、meta.json は並び順・表示制御のみを担う。
 * そのため meta.json は解釈せずファイルを直接走査する。こうすることで fumadocs の
 * meta 構文（"..." 残り、"---区切り---"、"[Label](url)" 外部リンク、"!除外" など）に
 * 影響されず、ドリフト防止テスト自体がドリフト・クラッシュしないようにする。
 * fumadocs の生成物（@/.source）は vitest の unit プロジェクトからは不安定なため使わない。
 */
function buildValidLessonUrls(): Set<string> {
	const contentRoot = path.join(process.cwd(), "content", "learn");
	const valid = new Set<string>();
	for (const entry of readdirSync(contentRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const track = entry.name;
		for (const file of readdirSync(path.join(contentRoot, track))) {
			const match = /^(.+)\.mdx?$/.exec(file);
			if (!match) continue;
			const slug = match[1];
			// index はトラックのトップページ URL（/learn/<track>）になる。
			valid.add(slug === "index" ? `/learn/${track}` : `/learn/${track}/${slug}`);
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
