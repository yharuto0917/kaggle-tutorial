import type { Item, Root } from "fumadocs-core/page-tree";
import type { ReactNode } from "react";

/** クライアントコンポーネントへ渡すための、シリアライズ可能なナビゲーションモデル。 */
export type NavItem = { title: string; url: string };
export type NavGroup = { title: string | null; description?: string; items: NavItem[] };

function toText(name: ReactNode): string {
	return typeof name === "string" ? name : "";
}

/**
 * fumadocs のページツリー（Root）を、サイドバー描画用の単純な配列へ変換する。
 * フォルダ（コース）ごとにグループ化し、直下のページ（レッスン）を一覧にする。
 */
export function buildNav(tree: Root): NavGroup[] {
	const groups: NavGroup[] = [];
	const rootItems: NavItem[] = [];

	for (const node of tree.children) {
		if (node.type === "folder") {
			groups.push({
				title: toText(node.name),
				description: node.description ? toText(node.description) : undefined,
				items: node.children
					.filter((child): child is Item => child.type === "page")
					.map((child) => ({ title: toText(child.name), url: child.url })),
			});
		} else if (node.type === "page") {
			rootItems.push({ title: toText(node.name), url: node.url });
		}
	}

	if (rootItems.length > 0) {
		groups.unshift({ title: null, items: rootItems });
	}

	return groups;
}
