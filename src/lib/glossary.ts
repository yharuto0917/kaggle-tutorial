export type GlossaryRelatedLesson = {
	/** 表示するレッスン名 */
	title: string;
	/** レッスンへのリンク（/learn/...） */
	href: string;
};

export type GlossaryEntry = {
	/** URL アンカー用の ASCII スラッグ */
	slug: string;
	/** 表示する用語 */
	term: string;
	/** [[term]] で参照できる別名 */
	aliases?: string[];
	/** 用語の定義 */
	definition: string;
	/** 関連レッスン（存在するもののみ。用語集 → 本文への逆リンク） */
	related?: GlossaryRelatedLesson[];
};

// 既存レッスンの参照ヘルパー（タイポ防止のため href を一元管理）。
const L0 = "/learn/kaggle-onboarding";
const L1 = "/learn/python-data-analysis";

/**
 * 機械学習・Kaggle の主要用語集。
 * 本文中の `[[用語]]` は remark-glossary-links により `/glossary#<slug>` へリンクされる。
 * 関連レッスンは現存する L0 / L1 のみを張り、以降のトラック公開時に随時追記する。
 */
export const glossary: GlossaryEntry[] = [
	// --- データ分析・EDA ---
	{
		slug: "eda",
		term: "EDA（探索的データ分析）",
		aliases: ["EDA", "探索的データ分析"],
		definition: "データの分布・欠損・相関などを可視化や集計で把握し、方針を立てる工程。",
		related: [{ title: "L1: EDA の進め方", href: `${L1}/06-eda` }],
	},
	{
		slug: "target-variable",
		term: "目的変数",
		aliases: ["ターゲット", "教師ラベル"],
		definition: "モデルが予測する対象の変数。回帰なら連続値、分類ならクラスラベルになる。",
		related: [{ title: "L1: EDA の進め方", href: `${L1}/06-eda` }],
	},
	{
		slug: "feature",
		term: "特徴量",
		aliases: ["説明変数", "feature"],
		definition: "モデルへの入力となる個々の変数。予測の手がかりとなる情報。",
		related: [{ title: "L1: pandas 基礎 I", href: `${L1}/03-pandas-basics` }],
	},
	{
		slug: "feature-engineering",
		term: "特徴量エンジニアリング",
		aliases: ["feature engineering"],
		definition: "モデルが学習しやすいように、既存データから新しい特徴量を加工・生成すること。",
		related: [{ title: "L1: EDA の進め方", href: `${L1}/06-eda` }],
	},
	{
		slug: "missing-value",
		term: "欠損値",
		aliases: ["欠損", "missing value", "NaN"],
		definition: "値が記録されていないセル。削除・代入（補完）・欠損フラグ化などで対処する。",
		related: [{ title: "L1: 欠損値・外れ値", href: `${L1}/07-missing-and-outliers` }],
	},
	{
		slug: "outlier",
		term: "外れ値",
		aliases: ["異常値", "outlier"],
		definition: "他から大きく外れた値。IQR 法や z-score で検出し、除去・クリップ・変換で扱う。",
		related: [{ title: "L1: 欠損値・外れ値", href: `${L1}/07-missing-and-outliers` }],
	},
	{
		slug: "categorical-variable",
		term: "カテゴリ変数",
		aliases: ["カテゴリカル変数", "質的変数", "categorical"],
		definition: "性別や都市名のように離散的な水準を取る変数。多くのモデルは数値化が必要。",
	},

	// --- 前処理・エンコーディング ---
	{
		slug: "one-hot-encoding",
		term: "ワンホットエンコーディング",
		aliases: ["one-hot encoding", "One-Hot", "ダミー変数"],
		definition: "カテゴリの各水準を 0/1 の列に展開する数値化手法。水準が多いと列が増える。",
	},
	{
		slug: "label-encoding",
		term: "ラベルエンコーディング",
		aliases: ["label encoding"],
		definition: "カテゴリの各水準に整数を割り当てる数値化手法。木系モデルと相性が良い。",
	},
	{
		slug: "target-encoding",
		term: "ターゲットエンコーディング",
		aliases: ["target encoding"],
		definition:
			"カテゴリ変数を目的変数の統計量（平均など）で数値化する手法。CV 内で正しく適用する。",
	},
	{
		slug: "standardization",
		term: "標準化",
		aliases: ["スタンダードスケーリング", "standardization", "z-score 標準化"],
		definition: "各特徴を平均 0・標準偏差 1 に変換する前処理。スケール差のある特徴をそろえる。",
		related: [{ title: "L1: NumPy 基礎", href: `${L1}/02-numpy` }],
	},
	{
		slug: "normalization",
		term: "正規化（Min-Max）",
		aliases: ["min-max スケーリング", "normalization", "正規化"],
		definition: "各特徴を一定範囲（多くは 0〜1）へ線形変換する前処理。外れ値の影響を受けやすい。",
		related: [{ title: "L1: NumPy 基礎", href: `${L1}/02-numpy` }],
	},
	{
		slug: "binning",
		term: "ビニング（離散化）",
		aliases: ["離散化", "binning"],
		definition: "連続値を区間に区切ってカテゴリ化する変換。非線形な関係や外れ値の緩和に使う。",
	},
	{
		slug: "log-transform",
		term: "対数変換",
		aliases: ["log変換", "log transform"],
		definition: "右に裾を引く分布に対数を取り、分布を圧縮して扱いやすくする変換。",
	},
	{
		slug: "dimensionality-reduction",
		term: "次元削減",
		aliases: ["dimensionality reduction"],
		definition: "特徴量の数を減らして本質的な構造を残す処理。可視化や過学習抑制に役立つ。",
	},
	{
		slug: "pca",
		term: "主成分分析（PCA）",
		aliases: ["PCA", "主成分分析"],
		definition: "分散が最大になる方向へ射影して次元削減する代表的な手法。",
	},

	// --- 学習の基礎 ---
	{
		slug: "machine-learning",
		term: "機械学習",
		aliases: ["ML", "machine learning"],
		definition: "データからパターンを学び、未知のデータに対して予測・判断を行う技術。",
		related: [{ title: "L0: Kaggle とは", href: `${L0}/01-what-is-kaggle` }],
	},
	{
		slug: "supervised-learning",
		term: "教師あり学習",
		aliases: ["supervised learning"],
		definition: "入力と正解（目的変数）の組から、入力→出力の対応を学習する枠組み。",
	},
	{
		slug: "unsupervised-learning",
		term: "教師なし学習",
		aliases: ["unsupervised learning"],
		definition: "正解ラベルを使わず、データ自体の構造（クラスタや分布）を見つける枠組み。",
	},
	{
		slug: "reinforcement-learning",
		term: "強化学習",
		aliases: ["reinforcement learning", "RL"],
		definition: "試行錯誤を通じて報酬が最大になる行動方針を学ぶ枠組み。ゲームや制御で使われる。",
	},
	{
		slug: "classification",
		term: "分類",
		aliases: ["classification", "分類問題"],
		definition: "目的変数が離散的なクラスである予測タスク（例：生存/非生存）。",
	},
	{
		slug: "regression",
		term: "回帰",
		aliases: ["regression", "回帰問題"],
		definition: "目的変数が連続値である予測タスク（例：価格の予測）。",
	},
	{
		slug: "generalization",
		term: "汎化",
		aliases: ["汎化性能", "generalization"],
		definition: "訓練に使っていない未知データでも高い性能を出せること。機械学習の最終目標。",
	},
	{
		slug: "overfitting",
		term: "過学習",
		aliases: ["オーバーフィッティング", "overfitting"],
		definition: "訓練データに適合しすぎて、未知データでの性能が低下する状態。",
		related: [{ title: "L0: コンペの構造と提出", href: `${L0}/05-competition-structure` }],
	},
	{
		slug: "underfitting",
		term: "未学習（過少適合）",
		aliases: ["未学習", "過少適合", "underfitting"],
		definition: "モデルが単純すぎて、訓練データの傾向すら捉えきれていない状態。",
	},
	{
		slug: "bias-variance",
		term: "バイアス・バリアンス",
		aliases: ["バイアスバリアンス", "bias-variance"],
		definition: "誤差を、単純さによる偏り（バイアス）と過敏さ（バリアンス）に分解する考え方。",
	},
	{
		slug: "hyperparameter",
		term: "ハイパーパラメータ",
		aliases: ["ハイパラ", "hyperparameter"],
		definition: "学習前に人が設定する設定値（木の深さや学習率など）。チューニングの対象。",
	},
	{
		slug: "regularization",
		term: "正則化",
		aliases: ["regularization", "L1正則化", "L2正則化"],
		definition: "モデルの複雑さに罰則を加え、過学習を抑える手法（L1/L2 など）。",
	},
	{
		slug: "loss-function",
		term: "損失関数",
		aliases: ["目的関数", "loss function", "コスト関数"],
		definition: "予測と正解のズレを数値化する関数。学習はこれを最小化する方向に進む。",
	},
	{
		slug: "gradient-descent",
		term: "勾配降下法",
		aliases: ["gradient descent", "最急降下法"],
		definition: "損失の勾配方向にパラメータを少しずつ更新して最小値を探す最適化手法。",
	},
	{
		slug: "learning-rate",
		term: "学習率",
		aliases: ["learning rate", "lr"],
		definition: "勾配降下で 1 回に進むステップの大きさ。大きすぎると発散、小さすぎると遅い。",
	},
	{
		slug: "epoch",
		term: "エポック",
		aliases: ["epoch"],
		definition: "訓練データ全体を 1 周学習する単位。複数エポック繰り返して学習を進める。",
	},
	{
		slug: "batch-size",
		term: "バッチサイズ",
		aliases: ["batch size", "ミニバッチ", "バッチ"],
		definition: "1 回のパラメータ更新に使うサンプル数。学習の安定性と速度に影響する。",
	},

	// --- モデル ---
	{
		slug: "linear-regression",
		term: "線形回帰",
		aliases: ["linear regression"],
		definition: "特徴量の線形結合で連続値を予測する基本モデル。解釈しやすくベースラインに好適。",
	},
	{
		slug: "logistic-regression",
		term: "ロジスティック回帰",
		aliases: ["logistic regression"],
		definition: "線形結合をシグモイドで確率に変換する分類モデル。二値分類の定番ベースライン。",
	},
	{
		slug: "decision-tree",
		term: "決定木",
		aliases: ["decision tree"],
		definition: "条件分岐で予測する木構造のモデル。単体は弱いが、アンサンブルの基礎になる。",
	},
	{
		slug: "random-forest",
		term: "ランダムフォレスト",
		aliases: ["random forest", "RF"],
		definition: "多数の決定木をバギングで束ねたモデル。安定して扱いやすい定番手法。",
	},
	{
		slug: "gbdt",
		term: "勾配ブースティング（GBDT）",
		aliases: ["GBDT", "勾配ブースティング"],
		definition: "決定木を逐次的に足し込むアンサンブル手法。XGBoost / LightGBM / CatBoost が代表。",
	},
	{
		slug: "xgboost",
		term: "XGBoost",
		aliases: ["xgb"],
		definition: "GBDT の代表的ライブラリ。高精度・正則化が強力で、表形式コンペの定番。",
	},
	{
		slug: "lightgbm",
		term: "LightGBM",
		aliases: ["lgbm", "lgb"],
		definition: "葉ごとに成長する高速な GBDT 実装。大規模データでも速く、Kaggle で多用される。",
	},
	{
		slug: "catboost",
		term: "CatBoost",
		aliases: ["cat boost"],
		definition: "カテゴリ変数の扱いに強い GBDT 実装。前処理が少なく済むのが特長。",
	},
	{
		slug: "neural-network",
		term: "ニューラルネットワーク",
		aliases: ["NN", "neural network"],
		definition: "層状のユニットで非線形な関係を学習するモデル。深層化したものが深層学習。",
	},
	{
		slug: "deep-learning",
		term: "ディープラーニング",
		aliases: ["深層学習", "deep learning", "DL"],
		definition: "多層のニューラルネットで表現を自動獲得する手法。画像・自然言語などに強い。",
	},

	// --- アンサンブル ---
	{
		slug: "ensemble",
		term: "アンサンブル学習",
		aliases: ["アンサンブル", "ensemble"],
		definition: "複数モデルの予測を組み合わせ、単体より高い精度・安定性を得る手法の総称。",
	},
	{
		slug: "bagging",
		term: "バギング",
		aliases: ["bagging", "ブートストラップ集約"],
		definition: "データを復元抽出して並列に学習し、平均/多数決で統合する手法（例：RF）。",
	},
	{
		slug: "boosting",
		term: "ブースティング",
		aliases: ["boosting"],
		definition: "前のモデルの誤りを次のモデルが補うよう逐次学習する手法（例：GBDT）。",
	},
	{
		slug: "stacking",
		term: "スタッキング",
		aliases: ["stacking"],
		definition: "複数モデルの予測（OOF）を入力としてメタモデルで統合するアンサンブル手法。",
	},
	{
		slug: "blending",
		term: "ブレンディング",
		aliases: ["blending"],
		definition: "複数モデルの予測を加重平均やランク平均などで単純に統合する手法。",
	},
	{
		slug: "oof",
		term: "OOF（Out-of-Fold）",
		aliases: ["OOF", "Out-of-Fold"],
		definition: "交差検証で、各 fold の検証側に対して得た予測。スタッキングやスコア評価に使う。",
	},

	// --- 検証戦略 ---
	{
		slug: "cross-validation",
		term: "交差検証",
		aliases: ["クロスバリデーション", "CV"],
		definition: "データを複数に分割し、学習と検証を繰り返してモデル性能を安定的に評価する手法。",
		related: [
			{ title: "L1: EDA の進め方", href: `${L1}/06-eda` },
			{ title: "L1: 欠損値・外れ値", href: `${L1}/07-missing-and-outliers` },
		],
	},
	{
		slug: "holdout",
		term: "ホールドアウト検証",
		aliases: ["holdout", "ホールドアウト"],
		definition: "データを訓練用と検証用に一度だけ分けて評価する最も単純な検証方法。",
	},
	{
		slug: "kfold",
		term: "K 分割交差検証",
		aliases: ["K-Fold", "KFold", "k分割"],
		definition: "データを K 個に分け、各回 1 つを検証・残りを訓練として K 回評価する手法。",
	},
	{
		slug: "stratified-kfold",
		term: "層化 K 分割交差検証",
		aliases: ["Stratified K-Fold", "StratifiedKFold", "層化抽出"],
		definition: "各 fold のクラス比率を全体と同じに保つ K-Fold。不均衡な分類で重要。",
	},
	{
		slug: "group-kfold",
		term: "グループ K 分割交差検証",
		aliases: ["Group K-Fold", "GroupKFold"],
		definition: "同一グループ（同一ユーザー等）が訓練と検証に跨らないよう分割する K-Fold。",
	},
	{
		slug: "time-series-split",
		term: "時系列分割",
		aliases: ["TimeSeriesSplit", "時系列CV"],
		definition: "過去で学習し未来で検証する、時間順を守った分割。時系列データのリーク防止に必須。",
	},
	{
		slug: "adversarial-validation",
		term: "敵対的検証（Adversarial Validation）",
		aliases: ["Adversarial Validation"],
		definition: "train/test を判別する分類器を作り、両者の分布差を検出・対策する手法。",
	},
	{
		slug: "leakage",
		term: "データリーク",
		aliases: ["リーク", "leakage"],
		definition: "本来使えない情報が特徴量や検証に混入し、性能が過大評価される問題。",
		related: [
			{ title: "L1: EDA の進め方", href: `${L1}/06-eda` },
			{ title: "L1: 欠損値・外れ値", href: `${L1}/07-missing-and-outliers` },
		],
	},
	{
		slug: "early-stopping",
		term: "早期終了（Early Stopping）",
		aliases: ["Early Stopping"],
		definition: "検証スコアが改善しなくなった時点で学習を打ち切り、過学習を防ぐ手法。",
	},

	// --- 評価指標 ---
	{
		slug: "mse",
		term: "平均二乗誤差（MSE）",
		aliases: ["MSE", "平均二乗誤差"],
		definition: "誤差を二乗して平均した回帰指標。大きな誤差を強く罰する。",
	},
	{
		slug: "rmse",
		term: "RMSE（二乗平均平方根誤差）",
		aliases: ["RMSE"],
		definition: "MSE の平方根。目的変数と同じ単位で誤差を表せる回帰指標。",
	},
	{
		slug: "mae",
		term: "MAE（平均絶対誤差）",
		aliases: ["MAE", "平均絶対誤差"],
		definition: "誤差の絶対値を平均した回帰指標。外れ値の影響を受けにくい。",
	},
	{
		slug: "rmsle",
		term: "RMSLE（対数二乗平均平方根誤差）",
		aliases: ["RMSLE"],
		definition: "対数を取った値で計算する RMSE。比率の誤差を重視し、大きな値の影響を抑える。",
	},
	{
		slug: "r2",
		term: "決定係数（R²）",
		aliases: ["R2", "決定係数", "R-squared"],
		definition: "予測が目的変数の分散をどれだけ説明できたかを表す回帰指標（1 に近いほど良い）。",
	},
	{
		slug: "accuracy",
		term: "正解率（Accuracy）",
		aliases: ["Accuracy", "正解率"],
		definition: "全予測のうち正解した割合。不均衡データでは性能を見誤りやすい点に注意。",
	},
	{
		slug: "precision",
		term: "適合率（Precision）",
		aliases: ["Precision", "適合率"],
		definition: "陽性と予測したうち実際に陽性だった割合。誤検知の少なさを表す。",
	},
	{
		slug: "recall",
		term: "再現率（Recall）",
		aliases: ["Recall", "再現率"],
		definition: "実際の陽性のうち正しく陽性と当てた割合。見逃しの少なさを表す。",
	},
	{
		slug: "f1-score",
		term: "F1 スコア",
		aliases: ["F1", "F1スコア", "F値"],
		definition: "適合率と再現率の調和平均。両者のバランスを 1 つの値で評価する指標。",
	},
	{
		slug: "logloss",
		term: "対数損失（LogLoss）",
		aliases: ["LogLoss", "対数損失", "クロスエントロピー"],
		definition: "予測確率の良さを測る指標。自信を持って外すほど大きく罰せられる。",
	},
	{
		slug: "roc-curve",
		term: "ROC 曲線",
		aliases: ["ROC", "ROC曲線"],
		definition: "閾値を変えたときの真陽性率と偽陽性率の関係を描いた曲線。AUC の基礎。",
	},
	{
		slug: "auc",
		term: "AUC",
		aliases: ["ROC-AUC"],
		definition: "ROC 曲線下の面積。二値分類の順位付け性能を表す評価指標（1 に近いほど良い）。",
	},
	{
		slug: "confusion-matrix",
		term: "混同行列",
		aliases: ["confusion matrix"],
		definition: "予測と正解の組み合わせ（TP/FP/FN/TN）を集計した表。分類指標の出発点。",
	},

	// --- コンペ運用 ---
	{
		slug: "leaderboard",
		term: "リーダーボード（LB）",
		aliases: ["LB", "リーダーボード"],
		definition: "コンペの順位表。テストの一部で算出される Public と、最終評価の Private がある。",
		related: [{ title: "L0: コンペの構造と提出", href: `${L0}/05-competition-structure` }],
	},
	{
		slug: "shake-up",
		term: "シェイクアップ",
		aliases: ["shake up", "シェイクダウン"],
		definition:
			"Public LB と Private LB で順位が大きく入れ替わる現象。過学習や検証設計の甘さが一因。",
		related: [{ title: "L0: コンペの構造と提出", href: `${L0}/05-competition-structure` }],
	},
	{
		slug: "submission",
		term: "サブミッション（提出）",
		aliases: ["submission", "提出", "submission.csv"],
		definition: "予測結果をコンペ指定の形式（多くは CSV）で提出すること、またはそのファイル。",
		related: [{ title: "L0: コンペの構造と提出", href: `${L0}/05-competition-structure` }],
	},
	{
		slug: "baseline",
		term: "ベースライン",
		aliases: ["baseline", "ベースラインモデル"],
		definition: "最初に作る最小限のモデル。以降の改善を測る基準（出発点）になる。",
	},
	{
		slug: "class-imbalance",
		term: "クラス不均衡",
		aliases: ["不均衡データ", "class imbalance", "クラスインバランス"],
		definition: "クラスの件数が大きく偏った状態。指標選びやサンプリングで対処する。",
		related: [{ title: "L1: EDA の進め方", href: `${L1}/06-eda` }],
	},
	{
		slug: "random-seed",
		term: "乱数シード",
		aliases: ["シード", "random seed", "seed"],
		definition: "乱数を再現可能にする初期値。固定すると実験の比較や再現がしやすくなる。",
		related: [{ title: "L0: ローカル vs クラウド", href: `${L0}/08-local-vs-cloud` }],
	},
	{
		slug: "pseudo-labeling",
		term: "疑似ラベリング",
		aliases: ["pseudo labeling", "擬似ラベル"],
		definition: "テストデータへの予測を仮の正解として訓練に加える半教師あり的なテクニック。",
	},
	{
		slug: "data-augmentation",
		term: "データ拡張",
		aliases: ["data augmentation", "オーグメンテーション", "TTA"],
		definition: "回転・反転・ノイズ付与などで学習データを水増しし、汎化を高める手法。",
	},
];
