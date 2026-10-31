import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildColabGithubUrl,
	DEFAULT_COLAB_GITHUB_BRANCH,
	DEFAULT_COLAB_GITHUB_REPO,
	isPlaceholderColabUrl,
	isValidExplicitColabUrl,
	normalizeNotebookSlug,
	REGISTERED_NOTEBOOK_SLUGS,
	REGISTERED_NOTEBOOKS,
	resolveNotebookLinks,
	sanitizeKaggleUrl,
} from "@/lib/colab";

function collectNotebookSlugsOnDisk(dir: string, prefix = ""): string[] {
	if (!existsSync(dir)) return [];
	const results: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			results.push(...collectNotebookSlugsOnDisk(path.join(dir, entry.name), rel));
		} else if (entry.isFile() && entry.name.endsWith(".ipynb")) {
			results.push(rel.replace(/\.ipynb$/i, ""));
		}
	}
	return results.sort();
}

function collectMdxFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collectMdxFiles(full));
		} else if (entry.isFile() && entry.name.endsWith(".mdx")) {
			results.push(full);
		}
	}
	return results.sort();
}

describe("colab URL 解決・スラッグ正規化", () => {
	it("先頭スラッシュ・バックスラッシュや .ipynb 拡張子を除去してスラッグを正規化する", () => {
		expect(normalizeNotebookSlug("/competitions/titanic")).toBe("competitions/titanic");
		expect(normalizeNotebookSlug("competitions\\titanic.ipynb")).toBe("competitions/titanic");
		expect(normalizeNotebookSlug(" /learn/ml-basics/02-problem-framing/ ")).toBe(
			"learn/ml-basics/02-problem-framing",
		);
	});

	it("旧トップページのダミー Colab URL をプレースホルダと判定する", () => {
		expect(isPlaceholderColabUrl("https://colab.research.google.com/")).toBe(true);
		expect(isPlaceholderColabUrl("https://colab.research.google.com")).toBe(true);
		expect(isPlaceholderColabUrl("  ")).toBe(true);
		expect(
			isPlaceholderColabUrl(
				"https://colab.research.google.com/github/yharuto0917/kaggle-tutorial/blob/main/public/notebooks/competitions/titanic.ipynb",
			),
		).toBe(false);
	});

	it("スラッシュを含むブランチ名は Colab ルータ仕様に合わせて %2F にエンコードする", () => {
		const url = buildColabGithubUrl("competitions/titanic", {
			repo: "yharuto0917/kaggle-tutorial",
			branch: "gemini/feat/colab-notebooks-part1",
		});
		expect(url).toBe(
			"https://colab.research.google.com/github/yharuto0917/kaggle-tutorial/blob/gemini%2Ffeat%2Fcolab-notebooks-part1/public/notebooks/competitions/titanic.ipynb",
		);
	});

	it("登録済みページの URL から Colab 起動 URL と同一オリジンダウンロード URL を解決する", () => {
		const resolved = resolveNotebookLinks({
			pageUrl: "/learn/python-data-analysis/01-python-basics",
			config: { repo: DEFAULT_COLAB_GITHUB_REPO, branch: DEFAULT_COLAB_GITHUB_BRANCH },
		});
		expect(resolved).toEqual({
			colabUrl:
				"https://colab.research.google.com/github/yharuto0917/kaggle-tutorial/blob/main/public/notebooks/learn/python-data-analysis/01-python-basics.ipynb",
			downloadUrl: "/notebooks/learn/python-data-analysis/01-python-basics.ipynb",
			downloadFilename: "01-python-basics.ipynb",
		});
	});

	it("旧ダミー URL が渡されても登録済みページなら自動解決 URL にフォールバックする", () => {
		const resolved = resolveNotebookLinks({
			explicitColabUrl: "https://colab.research.google.com/",
			pageUrl: "/competitions/titanic",
			config: { repo: DEFAULT_COLAB_GITHUB_REPO, branch: "dev" },
		});
		expect(resolved.colabUrl).toBe(
			"https://colab.research.google.com/github/yharuto0917/kaggle-tutorial/blob/dev/public/notebooks/competitions/titanic.ipynb",
		);
		expect(resolved.downloadUrl).toBe("/notebooks/competitions/titanic.ipynb");
		expect(resolved.downloadFilename).toBe("titanic.ipynb");
	});

	it("未登録のページではダミーリンクを出さず null を返す", () => {
		const resolved = resolveNotebookLinks({
			explicitColabUrl: "https://colab.research.google.com/",
			pageUrl: "/learn/advanced/01-target-encoding",
		});
		expect(resolved).toEqual({
			colabUrl: null,
			downloadUrl: null,
			downloadFilename: null,
		});
	});

	it("有効な外部 Colab URL が明示指定された場合はそれを優先する", () => {
		const customUrl = "https://colab.research.google.com/drive/1ABCDEF_example";
		const resolved = resolveNotebookLinks({
			explicitColabUrl: customUrl,
			pageUrl: "/learn/advanced/01-target-encoding",
		});
		expect(resolved.colabUrl).toBe(customUrl);
		expect(resolved.downloadUrl).toBeNull();
	});

	it("非許可ドメインや非 HTTPS の Colab / Kaggle URL を拒否する", () => {
		expect(isValidExplicitColabUrl("https://example.com/notebook.ipynb")).toBe(false);
		expect(isValidExplicitColabUrl("http://colab.research.google.com/drive/123")).toBe(false);
		expect(isValidExplicitColabUrl("https://colab.research.google.com/?hl=ja")).toBe(false);
		expect(isValidExplicitColabUrl("javascript:alert(1)")).toBe(false);
		expect(isValidExplicitColabUrl("https://colab.research.google.com/drive/123")).toBe(true);

		expect(sanitizeKaggleUrl("https://www.kaggle.com/competitions/titanic")).toBe(
			"https://www.kaggle.com/competitions/titanic",
		);
		expect(sanitizeKaggleUrl("https://kaggle.com/code")).toBe("https://kaggle.com/code");
		expect(sanitizeKaggleUrl("https://evil-kaggle.com/code")).toBeNull();
		expect(sanitizeKaggleUrl("http://www.kaggle.com/code")).toBeNull();
		expect(sanitizeKaggleUrl("javascript:alert(1)")).toBeNull();
	});
});

describe("Notebook Registry と実ファイル・MDX の整合性", () => {
	const notebooksRoot = path.join(process.cwd(), "public", "notebooks");

	it("REGISTERED_NOTEBOOK_SLUGS と public/notebooks 配下の .ipynb が過不足なく一致する", () => {
		const onDisk = collectNotebookSlugsOnDisk(notebooksRoot);
		const registered = [...REGISTERED_NOTEBOOKS].sort();
		expect(onDisk).toEqual(registered);
	});

	it("scripts/generate-notebooks.mjs の生成結果とディスク上の .ipynb が完全一致する", () => {
		const generatorPath = path.join(process.cwd(), "scripts", "generate-notebooks.mjs");
		expect(() =>
			execFileSync(process.execPath, [generatorPath, "--check"], {
				cwd: process.cwd(),
				encoding: "utf8",
			}),
		).not.toThrow();
	});

	it("すべての .ipynb が nbformat v4 に準拠し、出力セルが空にクリアされている", () => {
		for (const slug of REGISTERED_NOTEBOOK_SLUGS) {
			const filePath = path.join(notebooksRoot, `${slug}.ipynb`);
			const raw = readFileSync(filePath, "utf8");
			const parsed = JSON.parse(raw) as {
				nbformat: unknown;
				cells: Array<{
					cell_type: string;
					source: unknown;
					outputs?: unknown[];
					execution_count?: unknown;
				}>;
			};

			expect(parsed.nbformat, `${slug}: nbformat must be 4`).toBe(4);
			expect(Array.isArray(parsed.cells), `${slug}: cells must be an array`).toBe(true);
			expect(parsed.cells.length, `${slug}: cells must not be empty`).toBeGreaterThan(0);

			const codeCells = parsed.cells.filter((c) => c.cell_type === "code");
			expect(codeCells.length, `${slug}: must contain at least one code cell`).toBeGreaterThan(0);

			for (const cell of codeCells) {
				expect(Array.isArray(cell.source), `${slug}: code cell source must be string[]`).toBe(true);
				expect(cell.outputs, `${slug}: outputs must be stripped`).toEqual([]);
				expect(cell.execution_count, `${slug}: execution_count must be null`).toBeNull();
			}
		}
	});

	it("content/ 配下の全 MDX からダミーの Colab トップ URL が撤去されている", () => {
		const contentRoot = path.join(process.cwd(), "content");
		const mdxFiles = collectMdxFiles(contentRoot);
		const offenders = mdxFiles
			.filter((file) =>
				/colab\s*=\s*["']https:\/\/colab\.research\.google\.com\/?["']/.test(
					readFileSync(file, "utf8"),
				),
			)
			.map((file) => path.relative(process.cwd(), file));

		expect(offenders).toEqual([]);
	});
});
