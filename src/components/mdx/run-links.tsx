"use client";

import { usePathname } from "next/navigation";
import { useLessonId } from "@/components/progress/lesson-context";
import { resolveNotebookLinks, sanitizeKaggleUrl } from "@/lib/colab";

export interface RunLinksProps {
	/** 個別の Google Colab URL を明示上書きする場合のみ指定（通常は省略し自動解決） */
	readonly colab?: string;
	/** 対応する Notebook スラッグを明示指定する場合（省略時は現在のページ URL から自動推論） */
	readonly notebook?: string;
	/** Kaggle コンペまたは Kaggle Code へのリンク */
	readonly kaggle?: string;
}

/**
 * コード例を外部環境で実行するための導線（Google Colab で開く / .ipynb ダウンロード / Kaggle で開く）。
 * MDX 本文でコードブロックの近くに配置して使う。
 */
export function RunLinks({ colab, notebook, kaggle }: RunLinksProps) {
	const lessonId = useLessonId();
	const pathname = usePathname();
	const pageUrl = lessonId ?? pathname;

	const { colabUrl, downloadUrl, downloadFilename } = resolveNotebookLinks({
		explicitColabUrl: colab,
		notebook,
		pageUrl,
	});
	const validKaggle = sanitizeKaggleUrl(kaggle);

	if (!colabUrl && !downloadUrl && !validKaggle) return null;

	const linkClass =
		"inline-flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium text-foreground/80 no-underline transition hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]";

	return (
		<div className="not-prose my-4 flex flex-wrap gap-3">
			{colabUrl ? (
				<a href={colabUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
					Google Colab で開く ↗
				</a>
			) : null}
			{downloadUrl ? (
				<a href={downloadUrl} download={downloadFilename ?? undefined} className={linkClass}>
					.ipynb をダウンロード ↓
				</a>
			) : null}
			{validKaggle ? (
				<a href={validKaggle} target="_blank" rel="noopener noreferrer" className={linkClass}>
					Kaggle で開く ↗
				</a>
			) : null}
		</div>
	);
}
