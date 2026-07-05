import Link from "next/link";
import { buildNav } from "@/lib/nav";
import { source } from "@/lib/source";

const features = [
	{
		title: "体系的なカリキュラム",
		description: "Kaggle 入門からグランドマスター級テクニックまで、コース→章→レッスンで段階的に。",
	},
	{
		title: "手を動かして学ぶ",
		description: "コード例は Google Colab / Kaggle でそのまま開いて実行。読むだけで終わらせない。",
	},
	{
		title: "理解度チェック",
		description: "レッスンごとのクイズと進捗管理で、定着を確認しながら前に進める。",
	},
	{
		title: "実践コンペ解説",
		description: "Titanic・House Prices などのウォークスルーで、提出までの流れを体得。",
	},
];

export default function Home() {
	// トラック一覧・順序・説明文は content/learn 配下の meta.json を単一の情報源とする
	// （buildNav が各トラックの title/description を読む）。ハードコードすると
	// トラックの改名・追加のたびにここだけ古いままになる。
	const curriculum = buildNav(source.pageTree)
		.filter((g) => g.title !== null)
		.map((g, i) => ({
			level: `L${i}`,
			title: g.title as string,
			description: g.description ?? "",
		}));

	return (
		<main>
			{/* ヒーロー */}
			<section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
				<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Kaggle Tutorial</h1>
				<p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
					Kaggle を実際に触りながら機械学習を実践的に学ぶ、日本語の総合学習サイト。
					入門からグランドマスター級テクニックまでを体系的に。
				</p>
				<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
					<Link
						href="/learn"
						className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
					>
						学習を始める →
					</Link>
					<Link
						href="#curriculum"
						className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition-colors hover:bg-black/[.03] dark:border-white/20 dark:hover:bg-white/[.05]"
					>
						カリキュラムを見る
					</Link>
				</div>
			</section>

			{/* 特徴 */}
			<section className="mx-auto max-w-5xl px-6 py-12">
				<div className="grid gap-6 sm:grid-cols-2">
					{features.map((feature) => (
						<div
							key={feature.title}
							className="rounded-xl border border-black/10 p-6 dark:border-white/10"
						>
							<h2 className="text-lg font-semibold">{feature.title}</h2>
							<p className="mt-2 text-sm text-foreground/70">{feature.description}</p>
						</div>
					))}
				</div>
			</section>

			{/* カリキュラム概観 */}
			<section id="curriculum" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16">
				<h2 className="text-2xl font-bold tracking-tight">カリキュラム</h2>
				<p className="mt-2 text-foreground/70">
					L0 から L8 までの 9
					段階で、テーブルデータからディープラーニングまで網羅します（順次公開）。
				</p>
				<ol className="mt-8 space-y-3">
					{curriculum.map((item) => (
						<li
							key={item.level}
							className="flex gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
						>
							<span className="shrink-0 font-mono text-sm font-semibold text-foreground/50">
								{item.level}
							</span>
							<div>
								<h3 className="font-medium">{item.title}</h3>
								<p className="text-sm text-foreground/60">{item.description}</p>
							</div>
						</li>
					))}
				</ol>
				<div className="mt-10">
					<Link
						href="/learn"
						className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
					>
						公開中のレッスンを見る →
					</Link>
				</div>
			</section>
		</main>
	);
}
