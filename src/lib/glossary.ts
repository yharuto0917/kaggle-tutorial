export type GlossaryEntry = {
	/** URL アンカー用の ASCII スラッグ */
	slug: string;
	/** 表示する用語 */
	term: string;
	/** [[term]] で参照できる別名 */
	aliases?: string[];
	/** 用語の定義 */
	definition: string;
};

/**
 * 機械学習・Kaggle の主要用語集（初版）。
 * 本文中の `[[用語]]` は remark-glossary-links により `/glossary#<slug>` へリンクされる。
 */
export const glossary: GlossaryEntry[] = [
	{
		slug: "eda",
		term: "EDA（探索的データ分析）",
		aliases: ["EDA", "探索的データ分析"],
		definition: "データの分布・欠損・相関などを可視化や集計で把握し、方針を立てる工程。",
	},
	{
		slug: "feature-engineering",
		term: "特徴量エンジニアリング",
		definition: "モデルが学習しやすいように、既存データから新しい特徴量を加工・生成すること。",
	},
	{
		slug: "overfitting",
		term: "過学習",
		aliases: ["オーバーフィッティング"],
		definition: "訓練データに適合しすぎて、未知データでの性能が低下する状態。",
	},
	{
		slug: "cross-validation",
		term: "交差検証",
		aliases: ["クロスバリデーション", "CV"],
		definition: "データを複数に分割し、学習と検証を繰り返してモデル性能を安定的に評価する手法。",
	},
	{
		slug: "leaderboard",
		term: "リーダーボード（LB）",
		aliases: ["LB", "リーダーボード"],
		definition: "コンペの順位表。テストの一部で算出される Public と、最終評価の Private がある。",
	},
	{
		slug: "shake-up",
		term: "シェイクアップ",
		definition:
			"Public LB と Private LB で順位が大きく入れ替わる現象。過学習や検証設計の甘さが一因。",
	},
	{
		slug: "oof",
		term: "OOF（Out-of-Fold）",
		aliases: ["OOF", "Out-of-Fold"],
		definition: "交差検証で、各 fold の検証側に対して得た予測。スタッキングやスコア評価に使う。",
	},
	{
		slug: "stacking",
		term: "スタッキング",
		definition: "複数モデルの予測（OOF）を入力としてメタモデルで統合するアンサンブル手法。",
	},
	{
		slug: "blending",
		term: "ブレンディング",
		definition: "複数モデルの予測を加重平均やランク平均などで単純に統合する手法。",
	},
	{
		slug: "leakage",
		term: "データリーク",
		aliases: ["リーク", "leakage"],
		definition: "本来使えない情報が特徴量や検証に混入し、性能が過大評価される問題。",
	},
	{
		slug: "target-encoding",
		term: "ターゲットエンコーディング",
		definition:
			"カテゴリ変数を目的変数の統計量（平均など）で数値化する手法。CV 内で正しく適用する。",
	},
	{
		slug: "adversarial-validation",
		term: "敵対的検証（Adversarial Validation）",
		aliases: ["Adversarial Validation"],
		definition: "train/test を判別する分類器を作り、両者の分布差を検出・対策する手法。",
	},
	{
		slug: "early-stopping",
		term: "早期終了（Early Stopping）",
		aliases: ["Early Stopping"],
		definition: "検証スコアが改善しなくなった時点で学習を打ち切り、過学習を防ぐ手法。",
	},
	{
		slug: "auc",
		term: "AUC",
		definition: "ROC 曲線下の面積。二値分類の順位付け性能を表す評価指標（1 に近いほど良い）。",
	},
	{
		slug: "gbdt",
		term: "勾配ブースティング（GBDT）",
		aliases: ["GBDT", "勾配ブースティング"],
		definition: "決定木を逐次的に足し込むアンサンブル手法。XGBoost / LightGBM / CatBoost が代表。",
	},
];
