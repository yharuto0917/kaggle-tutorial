"use client";

import { useState } from "react";
import { useQuizResult } from "@/hooks/use-quiz-result";
import { gradeQuiz, isMultipleChoice, normalizeAnswer, type QuizProps } from "@/lib/quiz";

type Draft = { selected: number[]; submitted: boolean };

/**
 * レッスン本文に埋め込む理解度チェック。
 * 単一選択（radio）/ 複数選択（checkbox）に対応し、回答すると即時採点し、
 * 正誤と解説を表示する。結果は localStorage に保存し、リロード後も復元する。
 */
export function Quiz({ id, question, options, answer, explanation }: QuizProps) {
	const multiple = isMultipleChoice(answer);
	const correct = normalizeAnswer(answer);
	const { result, save } = useQuizResult(id);

	// draft が null の間は保存済みの結果に従い、ユーザーが操作したら draft が優先される。
	// こうすることで「保存済み結果の復元」を effect なしで表現できる。
	const [draft, setDraft] = useState<Draft | null>(null);
	const selected = draft ? draft.selected : (result?.selected ?? []);
	const submitted = draft ? draft.submitted : result !== null;

	const toggle = (index: number) => {
		if (submitted) return;
		const next = multiple
			? selected.includes(index)
				? selected.filter((i) => i !== index)
				: [...selected, index]
			: [index];
		setDraft({ selected: next, submitted: false });
	};

	const handleSubmit = () => {
		if (selected.length === 0 || submitted) return;
		const isCorrect = gradeQuiz(answer, selected);
		setDraft({ selected, submitted: true });
		save({ correct: isCorrect, selected, answeredAt: Date.now() });
	};

	const handleRetry = () => {
		setDraft({ selected: [], submitted: false });
	};

	const isCorrect = submitted && gradeQuiz(answer, selected);

	return (
		<div className="not-prose my-6 rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/15 dark:bg-white/[.03]">
			<fieldset>
				<legend className="mb-3 flex items-baseline gap-2 font-semibold">
					<span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
						Quiz
					</span>
					<span>{question}</span>
				</legend>

				<div className="space-y-2">
					{options.map((option, index) => {
						const checked = selected.includes(index);
						const isAnswer = correct.includes(index);

						let stateClass =
							"border-black/10 hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.05]";
						if (submitted) {
							if (isAnswer) stateClass = "border-emerald-500/60 bg-emerald-500/10";
							else if (checked) stateClass = "border-rose-500/60 bg-rose-500/10";
							else stateClass = "border-black/10 dark:border-white/15";
						} else if (checked) {
							stateClass = "border-blue-500/60 bg-blue-500/10";
						}

						return (
							<label
								key={index}
								className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${stateClass} ${
									submitted ? "cursor-default" : ""
								}`}
							>
								<input
									type={multiple ? "checkbox" : "radio"}
									name={id}
									checked={checked}
									disabled={submitted}
									onChange={() => toggle(index)}
									className="shrink-0"
								/>
								<span className="flex-1">{option}</span>
								{submitted && isAnswer ? (
									<span className="text-emerald-600 dark:text-emerald-400" aria-label="正解">
										✓
									</span>
								) : null}
								{submitted && checked && !isAnswer ? (
									<span className="text-rose-600 dark:text-rose-400" aria-label="あなたの誤答">
										✗
									</span>
								) : null}
							</label>
						);
					})}
				</div>
			</fieldset>

			<div className="mt-4 flex items-center gap-3">
				{!submitted ? (
					<button
						type="button"
						onClick={handleSubmit}
						disabled={selected.length === 0}
						className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						回答する
					</button>
				) : (
					<button
						type="button"
						onClick={handleRetry}
						className="rounded-md border border-black/15 px-4 py-1.5 text-sm font-medium transition hover:bg-black/[.03] dark:border-white/20 dark:hover:bg-white/[.05]"
					>
						もう一度
					</button>
				)}
				{multiple && !submitted ? (
					<span className="text-xs text-foreground/50">複数選択</span>
				) : null}
			</div>

			{submitted ? (
				<div className="mt-4 text-sm">
					<p
						className={`font-semibold ${
							isCorrect
								? "text-emerald-600 dark:text-emerald-400"
								: "text-rose-600 dark:text-rose-400"
						}`}
					>
						{isCorrect ? "正解！" : "不正解"}
					</p>
					{explanation ? (
						<div className="mt-2 rounded-md border-l-4 border-blue-500/50 bg-blue-500/10 px-3 py-2">
							<p className="m-0 mb-1 text-xs font-semibold">解説</p>
							<p className="m-0">{explanation}</p>
						</div>
					) : null}
				</div>
			) : null}
		</div>
	);
}
