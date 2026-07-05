// KaTeX のスタイルを /learn 配下のページに適用する（数式のビルド時 HTML 化に対応）。
import "katex/dist/katex.min.css";
import { Sidebar } from "@/components/layout/sidebar";
import { buildNav } from "@/lib/nav";
import { source } from "@/lib/source";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
	const groups = buildNav(source.pageTree);

	return (
		<div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
			<Sidebar groups={groups} />
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
