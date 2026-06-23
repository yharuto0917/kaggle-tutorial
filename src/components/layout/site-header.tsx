import Link from "next/link";

/** 全ページ共通のグローバルヘッダー（sticky）。 */
export function SiteHeader() {
	return (
		<header className="sticky top-0 z-40 border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link href="/" className="font-bold tracking-tight">
					Kaggle Tutorial
				</Link>
				<nav className="flex items-center gap-6 text-sm">
					<Link
						href="/learn"
						className="text-foreground/70 transition-colors hover:text-foreground"
					>
						学習
					</Link>
					<Link
						href="/competitions"
						className="text-foreground/70 transition-colors hover:text-foreground"
					>
						コンペ
					</Link>
					<Link
						href="/glossary"
						className="text-foreground/70 transition-colors hover:text-foreground"
					>
						用語集
					</Link>
					<Link
						href="/dashboard"
						className="text-foreground/70 transition-colors hover:text-foreground"
					>
						進捗
					</Link>
					<Link
						href="/search"
						aria-label="サイト内検索"
						className="flex items-center gap-1 text-foreground/70 transition-colors hover:text-foreground"
					>
						<span aria-hidden>🔍</span>
						<span>検索</span>
					</Link>
				</nav>
			</div>
		</header>
	);
}
