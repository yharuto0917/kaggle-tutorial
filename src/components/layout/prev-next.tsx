import type { Item } from "fumadocs-core/page-tree";
import Link from "next/link";

/** レッスン間の前後ナビゲーション。 */
export function PrevNext({ previous, next }: { previous?: Item; next?: Item }) {
	if (!previous && !next) return null;

	return (
		<nav className="mt-12 grid grid-cols-2 gap-4 border-t border-black/10 pt-6 dark:border-white/15">
			<div>
				{previous ? (
					<Link
						href={previous.url}
						className="block rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
					>
						<span className="text-xs text-foreground/50">前のレッスン</span>
						<span className="mt-1 block text-sm font-medium text-blue-600 dark:text-blue-400">
							← {previous.name}
						</span>
					</Link>
				) : null}
			</div>
			<div className="text-right">
				{next ? (
					<Link
						href={next.url}
						className="block rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
					>
						<span className="text-xs text-foreground/50">次のレッスン</span>
						<span className="mt-1 block text-sm font-medium text-blue-600 dark:text-blue-400">
							{next.name} →
						</span>
					</Link>
				) : null}
			</div>
		</nav>
	);
}
