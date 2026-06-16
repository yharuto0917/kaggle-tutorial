import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

/**
 * 学習コンテンツ（content/learn 配下の MDX）のコレクション定義。
 * ビルド時に `.source` へコンパイルされ、`src/lib/source.ts` の loader から読み込む。
 */
export const docs = defineDocs({
	dir: "content/learn",
});

/** コンペウォークスルー（content/competitions 配下の MDX）のコレクション定義。 */
export const competitions = defineDocs({
	dir: "content/competitions",
});

export default defineConfig({
	mdxOptions: {
		// 数式（$...$ / $$...$$）を KaTeX でビルド時に HTML 化する。
		// 関数形式で渡し、fumadocs の既定 remark/rehype プラグイン（TOC 抽出など）を保持する。
		remarkPlugins: (v) => [remarkMath, ...v],
		rehypePlugins: (v) => [rehypeKatex, ...v],
		// Shiki は JS RegExp エンジンを使用し、Oniguruma WASM を同梱しない（Worker サイズ対策）。
		// fumadocs 既定（transformer 等）を継承しつつ、エンジンとテーマを最小構成で指定する。
		rehypeCodeOptions: {
			...rehypeCodeDefaultOptions,
			engine: "js",
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
});
