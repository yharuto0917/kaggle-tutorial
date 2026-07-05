import { percent } from "@/lib/dashboard";

/** 完了数 / 全体数を表す進捗バー（プレゼンテーションのみ）。 */
export function ProgressBar({
	value,
	total,
	label,
}: {
	value: number;
	total: number;
	label?: string;
}) {
	const pct = percent(value, total);

	return (
		<div>
			<div className="mb-1 flex items-center justify-between text-xs text-foreground/60">
				<span>{label ?? "進捗"}</span>
				<span>
					{value} / {total}
				</span>
			</div>
			<div
				className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
				role="progressbar"
				aria-valuenow={value}
				aria-valuemin={0}
				aria-valuemax={total}
				aria-label={label ?? "進捗"}
			>
				<div
					className="h-full rounded-full bg-emerald-500 transition-[width]"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
