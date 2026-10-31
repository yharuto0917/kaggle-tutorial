/**
 * Google Colab 起動リンクおよび `.ipynb` ダウンロードリンクの解決ユーティリティ。
 *
 * - Google Colab は Public GitHub 上の `.ipynb` を
 *   `https://colab.research.google.com/github/<owner>/<repo>/blob/<branch>/<path>.ipynb`
 *   形式で直接開けるため、整備済み Notebook スラッグ（Registry）に基づいて URL を生成する。
 * - 同一ファイルを `public/notebooks/<slug>.ipynb` として静的配信することで、
 *   同一オリジンからの 1 クリックダウンロード（`<a download>`）にも対応する。
 */

export const DEFAULT_COLAB_GITHUB_REPO = "yharuto0917/kaggle-tutorial";
export const DEFAULT_COLAB_GITHUB_BRANCH = "main";

const PLACEHOLDER_COLAB_URLS: ReadonlySet<string> = new Set([
	"https://colab.research.google.com",
	"https://colab.research.google.com/",
]);

/**
 * `public/notebooks/<slug>.ipynb` に実体が整備済みの Notebook スラッグ一覧。
 * 未登録のスラッグではダミー遷移を防ぐため Colab リンクを生成しない。
 */
export const REGISTERED_NOTEBOOK_SLUGS = [
	// Competitions (5件)
	"competitions/house-prices",
	"competitions/image-classification",
	"competitions/nlp-text-classification",
	"competitions/playground-series",
	"competitions/titanic",
	// L1: Python & データ分析基礎 (7件)
	"learn/python-data-analysis/01-python-basics",
	"learn/python-data-analysis/02-numpy",
	"learn/python-data-analysis/03-pandas-basics",
	"learn/python-data-analysis/04-pandas-aggregation",
	"learn/python-data-analysis/05-visualization",
	"learn/python-data-analysis/06-eda",
	"learn/python-data-analysis/07-missing-and-outliers",
	// L2: 機械学習の基礎 (7件)
	"learn/ml-basics/02-problem-framing",
	"learn/ml-basics/03-train-test-split",
	"learn/ml-basics/04-cross-validation",
	"learn/ml-basics/05-metrics-regression",
	"learn/ml-basics/06-metrics-classification",
	"learn/ml-basics/07-scikit-learn-api",
	"learn/ml-basics/08-first-models",
	// L3: 実践入門コンペ (4件)
	"learn/intro-competitions/03-titanic-baseline",
	"learn/intro-competitions/04-titanic-cv",
	"learn/intro-competitions/06-house-prices-baseline",
	"learn/intro-competitions/07-house-prices-ensemble",
	// L5: 勾配ブースティング (3件)
	"learn/gradient-boosting/04-xgboost",
	"learn/gradient-boosting/05-lightgbm",
	"learn/gradient-boosting/06-catboost",
	// L6: アンサンブル・コンペ実践フロー (2件)
	"learn/ensemble-workflow/02-averaging-blending",
	"learn/ensemble-workflow/03-stacking",
	// L7: ディープラーニングと多様なデータ (7件)
	"learn/deep-learning/02-pytorch-intro",
	"learn/deep-learning/03-tabular-dl",
	"learn/deep-learning/04-cnn-basics",
	"learn/deep-learning/05-transfer-learning",
	"learn/deep-learning/06-nlp-classic",
	"learn/deep-learning/07-transformers",
	"learn/deep-learning/08-time-series",
	// L8: 上級テクニック・運用 (5件)
	"learn/advanced/01-target-encoding",
	"learn/advanced/02-adversarial-validation",
	"learn/advanced/03-pseudo-labeling",
	"learn/advanced/04-post-processing",
	"learn/advanced/06-big-data-memory",
] as const;

export const REGISTERED_NOTEBOOKS: ReadonlySet<string> = new Set<string>(REGISTERED_NOTEBOOK_SLUGS);

export interface ColabRepoConfig {
	readonly repo?: string;
	readonly branch?: string;
}

export interface ResolveNotebookOptions {
	/** MDX で明示指定された Colab URL（旧トップページ URL はプレースホルダとして無視する） */
	readonly explicitColabUrl?: string;
	/** 明示指定された Notebook スラッグ（例: "competitions/titanic"） */
	readonly notebook?: string;
	/** 現在のページパス（例: "/learn/python-data-analysis/01-python-basics"） */
	readonly pageUrl?: string | null;
	/** リポジトリ・ブランチ設定（省略時は環境変数または既定値を使用） */
	readonly config?: ColabRepoConfig;
}

export interface ResolvedNotebookLinks {
	readonly colabUrl: string | null;
	readonly downloadUrl: string | null;
	readonly downloadFilename: string | null;
}

/**
 * ページパスや Notebook 指定文字列を正規化スラッグ（先頭 `/`・末尾 `.ipynb` なし）へ変換する。
 */
export function normalizeNotebookSlug(raw: string): string {
	return raw
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/+$/, "")
		.replace(/\.ipynb$/i, "");
}

/**
 * 旧プレースホルダ URL（Colab トップページのみを指す URL）や空文字列かを判定する。
 */
export function isPlaceholderColabUrl(url: string): boolean {
	const trimmed = url.trim();
	return trimmed.length === 0 || PLACEHOLDER_COLAB_URLS.has(trimmed);
}

/**
 * 明示指定された Colab URL が `https://colab.research.google.com/<non-empty-path>` 形式の有効な URL かを検証する。
 */
export function isValidExplicitColabUrl(url: string): boolean {
	const trimmed = url.trim();
	if (isPlaceholderColabUrl(trimmed)) return false;
	try {
		const parsed = new URL(trimmed);
		return (
			parsed.protocol === "https:" &&
			parsed.hostname === "colab.research.google.com" &&
			parsed.pathname.replace(/\/+$/, "").length > 0
		);
	} catch {
		return false;
	}
}

/**
 * Kaggle リンクが `https://kaggle.com/...` または `https://*.kaggle.com/...` 形式であるかを検証し、
 * 有効な場合はトリム済み URL を、無効な場合は `null` を返す。
 */
export function sanitizeKaggleUrl(url: string | undefined): string | null {
	const trimmed = url?.trim();
	if (!trimmed) return null;
	try {
		const parsed = new URL(trimmed);
		const isAllowedHost =
			parsed.hostname === "kaggle.com" || parsed.hostname.endsWith(".kaggle.com");
		return parsed.protocol === "https:" && isAllowedHost ? trimmed : null;
	} catch {
		return null;
	}
}

/**
 * スラッシュ区切りのパス（`owner/repo` や Notebook スラッグ）を、
 * 区切り文字 `/` を保ったまま各セグメント単位で URL エンコードする。
 */
function encodeSlashSeparatedPath(value: string): string {
	return value
		.trim()
		.replace(/^\/+|\/+$/g, "")
		.split("/")
		.filter((segment) => segment.length > 0)
		.map((segment) => encodeURIComponent(segment))
		.join("/");
}

/**
 * 正規化済みスラッグから Google Colab の GitHub 起動 URL を組み立てる。
 *
 * Colab の `/github/<owner>/<repo>/blob/<branch>/<path>` ルータは `blob/` 直後の
 * 単一セグメントをブランチ名として解釈するため、`/` を含むブランチ名は
 * `encodeURIComponent` で `%2F` を含めてエンコードする。
 */
export function buildColabGithubUrl(slug: string, config?: ColabRepoConfig): string {
	const normalizedSlug = normalizeNotebookSlug(slug);
	const rawRepo =
		config?.repo?.trim() ||
		process.env.NEXT_PUBLIC_COLAB_GITHUB_REPO?.trim() ||
		DEFAULT_COLAB_GITHUB_REPO;
	const candidateBranch = (
		config?.branch?.trim() ||
		process.env.NEXT_PUBLIC_COLAB_GITHUB_BRANCH?.trim() ||
		""
	).replace(/^\/+|\/+$/g, "");
	const rawBranch = candidateBranch || DEFAULT_COLAB_GITHUB_BRANCH;

	const encodedRepo = encodeSlashSeparatedPath(rawRepo);
	const encodedBranch = encodeURIComponent(rawBranch);
	const encodedSlug = encodeSlashSeparatedPath(normalizedSlug);

	return `https://colab.research.google.com/github/${encodedRepo}/blob/${encodedBranch}/public/notebooks/${encodedSlug}.ipynb`;
}

/**
 * `RunLinks` に渡された props と現在のページパスから、Colab 起動 URL と `.ipynb` ダウンロード情報を解決する。
 */
export function resolveNotebookLinks(options: ResolveNotebookOptions): ResolvedNotebookLinks {
	const rawCandidate = options.notebook ?? options.pageUrl ?? null;
	const normalizedCandidate = rawCandidate ? normalizeNotebookSlug(rawCandidate) : "";
	const registeredSlug =
		normalizedCandidate.length > 0 && REGISTERED_NOTEBOOKS.has(normalizedCandidate)
			? normalizedCandidate
			: null;

	const explicitColab =
		typeof options.explicitColabUrl === "string" &&
		isValidExplicitColabUrl(options.explicitColabUrl)
			? options.explicitColabUrl.trim()
			: null;

	const colabUrl =
		explicitColab ?? (registeredSlug ? buildColabGithubUrl(registeredSlug, options.config) : null);

	const downloadUrl = registeredSlug ? `/notebooks/${registeredSlug}.ipynb` : null;
	const basename = registeredSlug ? (registeredSlug.split("/").at(-1) ?? "notebook") : null;
	const downloadFilename = basename ? `${basename}.ipynb` : null;

	return {
		colabUrl,
		downloadUrl,
		downloadFilename,
	};
}
