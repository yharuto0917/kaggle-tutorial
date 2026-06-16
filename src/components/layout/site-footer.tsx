import Link from "next/link";

/** 全ページ共通のフッター。 */
export function SiteFooter() {
	return (
		<footer className="border-t border-black/10 dark:border-white/10">
			<div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-foreground/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
				<p>Kaggle Tutorial — Kaggle で学ぶ実践機械学習</p>
				<nav className="flex gap-4">
					<Link href="/learn" className="transition-colors hover:text-foreground">
						学習
					</Link>
				</nav>
			</div>
		</footer>
	);
}
