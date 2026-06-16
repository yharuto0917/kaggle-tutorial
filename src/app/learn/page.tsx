import Link from "next/link";
import { source } from "@/lib/source";

export const metadata = {
	title: "学習カリキュラム",
};

export default function LearnIndexPage() {
	const pages = source.getPages();

	return (
		<div className="max-w-3xl">
			<h1 className="text-3xl font-bold tracking-tight">学習カリキュラム</h1>
			<p className="mt-2 text-foreground/70">Kaggle で学ぶ機械学習レッスンの一覧です（初版）。</p>
			<ul className="mt-8 space-y-3">
				{pages.map((page) => (
					<li key={page.url}>
						<Link href={page.url} className="text-blue-600 hover:underline dark:text-blue-400">
							{page.data.title}
						</Link>
						{page.data.description ? (
							<p className="text-sm text-foreground/60">{page.data.description}</p>
						) : null}
					</li>
				))}
			</ul>
		</div>
	);
}
