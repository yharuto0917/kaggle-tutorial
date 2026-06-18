"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressMap } from "@/hooks/use-progress";
import type { NavGroup } from "@/lib/nav";
import { countCompleted } from "@/lib/progress-store";

/** /learn 配下のサイドバーナビ。現在地のハイライトと、各レッスンの完了状態を表示する。 */
export function Sidebar({ groups }: { groups: NavGroup[] }) {
	const pathname = usePathname();
	const progress = useProgressMap();

	return (
		<aside className="hidden w-60 shrink-0 md:block">
			<nav className="sticky top-20 space-y-6">
				{groups.map((group, index) => {
					const done = countCompleted(
						progress,
						group.items.map((item) => item.url),
					);
					return (
						<div key={group.title ?? `group-${index}`}>
							{group.title ? (
								<p className="mb-2 flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground/80">
									<span>{group.title}</span>
									<span className="text-xs font-normal text-foreground/50">
										{done}/{group.items.length}
									</span>
								</p>
							) : null}
							<ul className="space-y-0.5 border-l border-black/10 dark:border-white/15">
								{group.items.map((item) => {
									const active = pathname === item.url;
									const status = progress[item.url]?.status;
									return (
										<li key={item.url}>
											<Link
												href={item.url}
												aria-current={active ? "page" : undefined}
												className={`-ml-px flex items-center gap-1.5 border-l py-1 pl-3 text-sm transition-colors ${
													active
														? "border-blue-500 font-medium text-blue-600 dark:text-blue-400"
														: "border-transparent text-foreground/70 hover:border-black/20 hover:text-foreground dark:hover:border-white/30"
												}`}
											>
												<span
													aria-hidden
													className={
														status === "completed"
															? "text-emerald-500"
															: status === "in-progress"
																? "text-foreground/40"
																: "text-transparent"
													}
												>
													{status === "completed" ? "✓" : "•"}
												</span>
												<span className="flex-1">{item.title}</span>
											</Link>
										</li>
									);
								})}
							</ul>
						</div>
					);
				})}
			</nav>
		</aside>
	);
}
