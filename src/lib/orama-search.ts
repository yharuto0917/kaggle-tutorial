import { type AnyOrama, create, insertMultiple, search } from "@orama/orama";

/** 検索対象のドキュメント。 */
export type SearchDoc = {
	id: string;
	title: string;
	description: string;
	/** 別名・英語表記など（タイポ許容検索の対象） */
	keywords: string;
	url: string;
	/** 表示用の種別ラベル（レッスン / コンペ / 用語 など） */
	type: string;
};

export type SearchHit = {
	id: string;
	title: string;
	description: string;
	url: string;
	type: string;
};

const schema = {
	title: "string",
	description: "string",
	keywords: "string",
	url: "string",
	type: "string",
} as const;

/** ドキュメントから Orama 検索インデックスを構築する。 */
export async function createSearchIndex(docs: SearchDoc[]): Promise<AnyOrama> {
	const db = create({ schema });
	await insertMultiple(db, docs);
	return db;
}

/**
 * タイポ許容（Levenshtein 距離 1）で検索する。title / keywords / description を対象にする。
 * 空クエリは空配列。
 */
export async function searchIndex(db: AnyOrama, term: string, limit = 8): Promise<SearchHit[]> {
	const q = term.trim();
	if (q.length === 0) return [];
	const res = await search(db, {
		term: q,
		properties: ["title", "keywords", "description"],
		tolerance: 1,
		limit,
	});
	return res.hits.map((h) => {
		const d = h.document as Record<string, unknown>;
		return {
			id: String(d.id),
			title: String(d.title),
			description: String(d.description),
			url: String(d.url),
			type: String(d.type),
		};
	});
}
