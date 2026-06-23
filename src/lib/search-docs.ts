import { glossary } from "@/lib/glossary";
import type { SearchDoc } from "@/lib/orama-search";
import { competitionsSource, source } from "@/lib/source";

/**
 * 検索ドキュメント一覧を、レッスン・コンペ・用語集から構築する（ビルド時の静的データ）。
 * /search のサーバコンポーネントで生成し、クライアントの Orama 検索へ渡す。
 */
export function buildSearchDocs(): SearchDoc[] {
	const docs: SearchDoc[] = [];

	for (const page of source.getPages()) {
		docs.push({
			id: page.url,
			title: page.data.title,
			description: page.data.description ?? "",
			keywords: "",
			url: page.url,
			type: "レッスン",
		});
	}

	for (const page of competitionsSource.getPages()) {
		docs.push({
			id: page.url,
			title: page.data.title,
			description: page.data.description ?? "",
			keywords: "",
			url: page.url,
			type: "コンペ",
		});
	}

	for (const entry of glossary) {
		docs.push({
			id: `/glossary#${entry.slug}`,
			title: entry.term,
			description: entry.definition,
			keywords: (entry.aliases ?? []).join(" "),
			url: `/glossary#${entry.slug}`,
			type: "用語",
		});
	}

	return docs;
}
