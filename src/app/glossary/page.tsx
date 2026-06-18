import Link from "next/link";
import { glossary } from "@/lib/glossary";

export const metadata = {
	title: "用語集",
};

export default function GlossaryPage() {
	return (
		<main data-pagefind-body className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="text-3xl font-bold tracking-tight">用語集</h1>
			<p className="mt-2 text-foreground/70">
				機械学習・Kaggle の主要用語をまとめています。本文中の用語リンクからもここへ移動できます。
			</p>
			<dl className="mt-8 space-y-6">
				{glossary.map((entry) => (
					<div
						key={entry.slug}
						id={entry.slug}
						className="scroll-mt-20 border-l-2 border-black/10 pl-4 dark:border-white/15"
					>
						<dt className="font-semibold">
							{entry.term}
							{entry.aliases && entry.aliases.length > 0 ? (
								<span className="ml-2 text-sm font-normal text-foreground/50">
									{entry.aliases.join(" / ")}
								</span>
							) : null}
						</dt>
						<dd className="mt-1 text-sm text-foreground/70">{entry.definition}</dd>
						{entry.related && entry.related.length > 0 ? (
							<dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/60">
								<span>関連レッスン:</span>
								{entry.related.map((lesson) => (
									<Link
										key={lesson.href}
										href={lesson.href}
										className="text-blue-600 hover:underline dark:text-blue-400"
									>
										{lesson.title}
									</Link>
								))}
							</dd>
						) : null}
					</div>
				))}
			</dl>
		</main>
	);
}
