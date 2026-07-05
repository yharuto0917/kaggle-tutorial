import type { MDXComponents } from "mdx/types";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { createHeading } from "./heading";
import { Quiz } from "./quiz";
import { RunLinks } from "./run-links";

/**
 * レッスン本文（fumadocs の MDX body）へ渡すコンポーネント群。
 * - pre: コピー ボタン付きコードブロック
 * - h2/h3/h4: アンカーリンク付き見出し
 * - Callout / RunLinks / Quiz: 本文中で使うカスタムコンポーネント
 */
export const mdxComponents: MDXComponents = {
	pre: CodeBlock,
	h2: createHeading("h2"),
	h3: createHeading("h3"),
	h4: createHeading("h4"),
	Callout,
	RunLinks,
	Quiz,
};
