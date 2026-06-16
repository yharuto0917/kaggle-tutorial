import type { ReactNode } from "react";

type CalloutType = "note" | "warning" | "tip";

const TYPE_STYLES: Record<CalloutType, string> = {
	note: "border-blue-500/50 bg-blue-500/10",
	warning: "border-amber-500/50 bg-amber-500/10",
	tip: "border-emerald-500/50 bg-emerald-500/10",
};

const TYPE_LABELS: Record<CalloutType, string> = {
	note: "メモ",
	warning: "注意",
	tip: "ヒント",
};

/** MDX 本文で使う補足ボックス（メモ / 注意 / ヒント）。 */
export function Callout({
	type = "note",
	title,
	children,
}: {
	type?: CalloutType;
	title?: string;
	children: ReactNode;
}) {
	return (
		<div className={`my-6 rounded-lg border-l-4 px-4 py-3 ${TYPE_STYLES[type]}`}>
			<p className="m-0 mb-1 text-sm font-semibold">{title ?? TYPE_LABELS[type]}</p>
			<div className="text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
		</div>
	);
}
