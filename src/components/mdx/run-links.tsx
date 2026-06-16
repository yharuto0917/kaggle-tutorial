/**
 * コード例を外部環境で実行するための導線（Google Colab / Kaggle で開く）。
 * MDX 本文でコードブロックの近くに配置して使う。
 */
export function RunLinks({ colab, kaggle }: { colab?: string; kaggle?: string }) {
	if (!colab && !kaggle) return null;

	const linkClass =
		"inline-flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium text-foreground/80 no-underline transition hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]";

	return (
		<div className="not-prose my-4 flex flex-wrap gap-3">
			{colab ? (
				<a href={colab} target="_blank" rel="noopener noreferrer" className={linkClass}>
					Google Colab で開く ↗
				</a>
			) : null}
			{kaggle ? (
				<a href={kaggle} target="_blank" rel="noopener noreferrer" className={linkClass}>
					Kaggle で開く ↗
				</a>
			) : null}
		</div>
	);
}
