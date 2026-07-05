import type { Link, Root, Text } from "mdast";
import { visit } from "unist-util-visit";

export interface GlossaryLinkOptions {
	/** ラベル（用語・別名）→ slug のマップ */
	map: Record<string, string>;
	/** 用語集ページのベースパス */
	basePath?: string;
}

// [[ラベル]] または [[ラベル|slug]]
const PATTERN = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/**
 * 本文中の `[[用語]]` を用語集ページ（/glossary#<slug>）へのリンクへ変換する remark プラグイン。
 * マップに無い用語はそのままテキストとして残す（壊さない）。
 */
export function remarkGlossaryLinks(options: GlossaryLinkOptions) {
	const { map, basePath = "/glossary" } = options;

	return (tree: Root) => {
		visit(tree, "text", (node: Text, index, parent) => {
			if (!parent || typeof index !== "number" || !node.value.includes("[[")) {
				return;
			}

			const value = node.value;
			const replacement: Array<Text | Link> = [];
			let lastIndex = 0;
			let match: RegExpExecArray | null;
			PATTERN.lastIndex = 0;

			while ((match = PATTERN.exec(value)) !== null) {
				const [full, label, explicitSlug] = match;
				if (match.index > lastIndex) {
					replacement.push({ type: "text", value: value.slice(lastIndex, match.index) });
				}

				const slug = explicitSlug ?? map[label];
				if (slug) {
					replacement.push({
						type: "link",
						url: `${basePath}#${slug}`,
						children: [{ type: "text", value: label }],
					});
				} else {
					replacement.push({ type: "text", value: full });
				}
				lastIndex = match.index + full.length;
			}

			if (replacement.length === 0) return;
			if (lastIndex < value.length) {
				replacement.push({ type: "text", value: value.slice(lastIndex) });
			}

			parent.children.splice(index, 1, ...replacement);
			return index + replacement.length;
		});
	};
}
