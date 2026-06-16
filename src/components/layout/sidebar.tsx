"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav";

/** /learn 配下のサイドバーナビ。現在のパスを usePathname でハイライトする。 */
export function Sidebar({ groups }: { groups: NavGroup[] }) {
	const pathname = usePathname();

	return (
		<aside className="hidden w-60 shrink-0 md:block">
			<nav className="sticky top-8 space-y-6">
				{groups.map((group, index) => (
					<div key={group.title ?? `group-${index}`}>
						{group.title ? (
							<p className="mb-2 text-sm font-semibold text-foreground/80">{group.title}</p>
						) : null}
						<ul className="space-y-0.5 border-l border-black/10 dark:border-white/15">
							{group.items.map((item) => {
								const active = pathname === item.url;
								return (
									<li key={item.url}>
										<Link
											href={item.url}
											aria-current={active ? "page" : undefined}
											className={`-ml-px block border-l py-1 pl-3 text-sm transition-colors ${
												active
													? "border-blue-500 font-medium text-blue-600 dark:text-blue-400"
													: "border-transparent text-foreground/70 hover:border-black/20 hover:text-foreground dark:hover:border-white/30"
											}`}
										>
											{item.title}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</nav>
		</aside>
	);
}
