import Link from "next/link";
import { competitionsSource } from "@/lib/source";

export const metadata = {
	title: "コンペウォークスルー",
};

export default function CompetitionsIndexPage() {
	const pages = competitionsSource.getPages();

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="text-3xl font-bold tracking-tight">コンペウォークスルー</h1>
			<p className="mt-2 text-foreground/70">
				Kaggle のコンペを題材に、EDA から提出までの流れを実践的に解説します（初版）。
			</p>
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
		</main>
	);
}
