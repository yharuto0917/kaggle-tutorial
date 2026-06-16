import type { TOCItemType } from "fumadocs-core/toc";

/** レッスン本文の見出しから生成した目次（静的）。 */
export function Toc({ items }: { items: TOCItemType[] }) {
	if (items.length === 0) return null;

	return (
		<aside className="hidden w-56 shrink-0 xl:block">
			<div className="sticky top-20">
				<p className="mb-2 text-sm font-semibold text-foreground/80">目次</p>
				<ul className="space-y-1 text-sm">
					{items.map((item) => (
						<li key={item.url} style={{ paddingLeft: `${Math.max(0, item.depth - 2) * 12}px` }}>
							<a
								href={item.url}
								className="block text-foreground/60 transition-colors hover:text-foreground"
							>
								{item.title}
							</a>
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
