import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import { ProgressBar } from "@/components/progress/progress-bar";
import { getDb } from "@/db";
import {
	lessonProgress,
	type LessonProgressRow,
	quizResults,
	type QuizResultRow,
} from "@/db/schema";
import { computeStreak, quizAccuracy, trackProgress } from "@/lib/dashboard";
import { buildNav } from "@/lib/nav";
import { USER_COOKIE } from "@/lib/session";
import { source } from "@/lib/source";

export const dynamic = "force-dynamic";
export const metadata = { title: "ダッシュボード" };

// リクエスト時刻（連続学習日数の基準）。コンポーネント本体外で読み、purity ルールを満たす。
function nowMs(): number {
	return Date.now();
}

export default async function DashboardPage() {
	const uid = (await cookies()).get(USER_COOKIE)?.value ?? null;

	let progress: LessonProgressRow[] = [];
	let quizzes: QuizResultRow[] = [];
	if (uid) {
		const db = getDb();
		[progress, quizzes] = await Promise.all([
			db.select().from(lessonProgress).where(eq(lessonProgress.userId, uid)),
			db.select().from(quizResults).where(eq(quizResults.userId, uid)),
		]);
	}

	const completed = new Set(
		progress.filter((p) => p.status === "completed").map((p) => p.lessonId),
	);
	const tracks = buildNav(source.pageTree)
		.filter((g) => g.items.length > 0)
		.map((g) => ({ title: g.title ?? "その他", urls: g.items.map((i) => i.url) }));
	const tp = trackProgress(completed, tracks);
	const qa = quizAccuracy(quizzes);
	const streak = computeStreak(
		[...progress.map((p) => +p.updatedAt), ...quizzes.map((q) => +q.answeredAt)],
		nowMs(),
	);
	const overallPct = tp.total > 0 ? Math.round((tp.done / tp.total) * 100) : 0;

	const recent = [
		...progress.map((p) => ({
			at: +p.updatedAt,
			label: p.status === "completed" ? "✓ レッスン完了" : "レッスン閲覧",
			name: p.lessonId,
			href: p.lessonId as string | undefined,
		})),
		...quizzes.map((q) => ({
			at: +q.answeredAt,
			label: q.correct ? "クイズ正解" : "クイズ不正解",
			name: q.quizId,
			href: undefined as string | undefined,
		})),
	]
		.sort((a, b) => b.at - a.at)
		.slice(0, 8);

	return (
		<main className="mx-auto max-w-3xl px-6 py-16">
			<h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
			<p className="mt-2 text-foreground/70">
				このブラウザの学習状況です（進捗はサーバーに保存されます）。
			</p>

			<div className="mt-8 grid grid-cols-3 gap-4">
				<Stat label="全体進捗" value={`${overallPct}%`} sub={`${tp.done}/${tp.total} レッスン`} />
				<Stat label="クイズ正答率" value={`${qa.pct}%`} sub={`${qa.correct}/${qa.total} 問`} />
				<Stat label="連続学習" value={`${streak}`} sub="日" />
			</div>

			<section className="mt-10">
				<h2 className="mb-3 text-sm font-semibold">トラック別の進捗</h2>
				<div className="space-y-3">
					{tp.tracks.map((t) => (
						<ProgressBar key={t.title} value={t.done} total={t.total} label={t.title} />
					))}
				</div>
			</section>

			<section className="mt-10">
				<h2 className="mb-3 text-sm font-semibold">最近の活動</h2>
				{recent.length === 0 ? (
					<p className="text-sm text-foreground/60">
						まだ活動がありません。
						<Link href="/learn" className="text-blue-600 hover:underline dark:text-blue-400">
							学習を始める
						</Link>
					</p>
				) : (
					<ul className="space-y-2 text-sm">
						{recent.map((r) => (
							<li key={`${r.at}-${r.name}`} className="flex items-center justify-between gap-3">
								<span className="text-foreground/80">
									{r.label}：
									{r.href ? (
										<Link
											href={r.href}
											className="text-blue-600 hover:underline dark:text-blue-400"
										>
											{r.name}
										</Link>
									) : (
										<span className="text-foreground/60">{r.name}</span>
									)}
								</span>
								<time className="shrink-0 text-xs text-foreground/50">
									{new Date(r.at).toISOString().slice(0, 10)}
								</time>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
	return (
		<div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
			<p className="text-xs text-foreground/60">{label}</p>
			<p className="mt-1 text-2xl font-bold">{value}</p>
			<p className="text-xs text-foreground/50">{sub}</p>
		</div>
	);
}
