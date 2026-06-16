import type { BreadcrumbItem } from "fumadocs-core/breadcrumb";
import Link from "next/link";

/** レッスンの現在地を示すパンくずリスト。 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
	if (items.length === 0) return null;

	return (
		<nav
			aria-label="パンくず"
			className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground/60"
		>
			{items.map((item, index) => (
				<span key={item.url ?? `crumb-${index}`} className="flex items-center gap-1.5">
					{index > 0 ? <span className="text-foreground/30">/</span> : null}
					{item.url ? (
						<Link href={item.url} className="transition-colors hover:text-foreground">
							{item.name}
						</Link>
					) : (
						<span className="text-foreground/80">{item.name}</span>
					)}
				</span>
			))}
		</nav>
	);
}
