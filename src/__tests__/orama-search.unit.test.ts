import { beforeAll, describe, expect, it } from "vitest";
import { type AnyOrama } from "@orama/orama";
import { createSearchIndex, searchIndex, type SearchDoc } from "@/lib/orama-search";

const DOCS: SearchDoc[] = [
	{
		id: "/learn/gb/05-lightgbm",
		title: "LightGBM 実践",
		description: "高速・省メモリな勾配ブースティング",
		keywords: "lightgbm lgbm gbdt",
		url: "/learn/gb/05-lightgbm",
		type: "レッスン",
	},
	{
		id: "/glossary#cross-validation",
		title: "交差検証",
		description: "データを分割して評価する手法",
		keywords: "cross validation CV",
		url: "/glossary#cross-validation",
		type: "用語",
	},
	{
		id: "/learn/dl/02-pytorch",
		title: "PyTorch 入門",
		description: "Tensor と autograd",
		keywords: "pytorch tensor",
		url: "/learn/dl/02-pytorch",
		type: "レッスン",
	},
];

describe("orama-search", () => {
	let db: AnyOrama;
	beforeAll(async () => {
		db = await createSearchIndex(DOCS);
	});

	it("完全一致で見つかる", async () => {
		const hits = await searchIndex(db, "LightGBM");
		expect(hits[0]?.url).toBe("/learn/gb/05-lightgbm");
	});

	it("タイポを許容する（1 文字違い lightgbx → LightGBM）", async () => {
		const hits = await searchIndex(db, "lightgbx");
		expect(hits.map((h) => h.url)).toContain("/learn/gb/05-lightgbm");
	});

	it("別名（keywords）でもタイポ許容（pytorxh → PyTorch）", async () => {
		const hits = await searchIndex(db, "pytorxh");
		expect(hits.map((h) => h.url)).toContain("/learn/dl/02-pytorch");
	});

	it("空クエリは空配列", async () => {
		expect(await searchIndex(db, "   ")).toEqual([]);
	});
});
