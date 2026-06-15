// KaTeX のスタイルを /learn 配下のページに適用する（数式のビルド時 HTML 化に対応）。
import "katex/dist/katex.min.css";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
	return children;
}
