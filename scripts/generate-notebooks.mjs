/**
 * MDX レッスン・コンペ解説から Google Colab / Jupyter 実行対応の `.ipynb` を生成するスクリプト。
 *
 * 特徴:
 * - MDX の見出し・解説・Callout（`[[用語]]` 記法をプレーンテキストへ変換し、`<Quiz>` / `<RunLinks>` を除去）と
 *   Python コードブロックを順序通りに Markdown / Code セルへ変換する。
 * - `/kaggle/input/...` を参照するレッスンや前提変数が省略された解説スニペットには、
 *   Colab およびローカル環境の双方でそのまま全セル実行（Run All）できるセットアップセルを自動補完する。
 * - すべての Code セルは `outputs: []`, `execution_count: null` で出力し、セル ID もスラッグから決定論的に生成する。
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

const TITANIC_SETUP_SOURCE = `# [Colab / ローカル環境用セットアップ]
# Kaggle Notebook 上では既存の /kaggle/input/titanic をそのまま使用し、
# Google Colab やローカル環境では互換スキーマの Titanic サンプルデータ（891行 / 418行）を自動配置します。
# ※ Kaggle 本番データで提出する場合は kaggle CLI (!kaggle competitions download -c titanic) をご利用ください。
import os
import numpy as np
import pandas as pd

def _ensure_titanic_data():
    target_dir = "/kaggle/input/titanic"
    if os.path.exists(os.path.join(target_dir, "train.csv")):
        return

    try:
        os.makedirs(target_dir, exist_ok=True)
        data_dir = target_dir
    except OSError:
        data_dir = os.path.abspath("./.kaggle_input/titanic")
        os.makedirs(data_dir, exist_ok=True)
        _orig_read_csv = pd.read_csv

        def _compat_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and filepath_or_buffer.startswith("/kaggle/input/"):
                rel = filepath_or_buffer[len("/kaggle/input/"):]
                local_path = os.path.abspath(os.path.join("./.kaggle_input", rel))
                if os.path.exists(local_path):
                    filepath_or_buffer = local_path
            return _orig_read_csv(filepath_or_buffer, *args, **kwargs)

        pd.read_csv = _compat_read_csv

    rng = np.random.default_rng(42)
    surnames = ["Braund", "Cumings", "Heikkinen", "Futrelle", "Allen", "Moran", "McCarthy", "Palsson", "Johnson", "Nasser"]
    given_m = ["Owen", "William", "James", "Henry", "Leonard", "Timothy", "charles", "George"]
    given_f = ["Florence", "Laina", "Lily", "elisabeth", "Adele", " Marguerite", "Anna", "Mary"]

    def _make_split(n, start_id, with_target):
        pclass = rng.choice([1, 2, 3], size=n, p=[0.24, 0.21, 0.55])
        sex = rng.choice(["male", "female"], size=n, p=[0.65, 0.35])
        age = np.clip(rng.normal(29.7, 14.5, size=n), 0.42, 80.0).round(1)
        sibsp = rng.choice([0, 1, 2, 3, 4], size=n, p=[0.68, 0.23, 0.05, 0.02, 0.02])
        parch = rng.choice([0, 1, 2, 3], size=n, p=[0.76, 0.13, 0.09, 0.02])
        base_fare = np.where(pclass == 1, 60.0, np.where(pclass == 2, 20.0, 11.0))
        fare = (base_fare * rng.lognormal(0.0, 0.55, size=n)).round(2)
        embarked = rng.choice(["S", "C", "Q"], size=n, p=[0.72, 0.19, 0.09]).astype(object)

        names = []
        cabins = []
        tickets = []
        for i in range(n):
            sn = surnames[i % len(surnames)]
            if sex[i] == "male":
                title = "Master" if age[i] < 13 else "Mr"
                gn = given_m[i % len(given_m)].strip().capitalize()
            else:
                title = "Miss" if age[i] < 24 else "Mrs"
                gn = given_f[i % len(given_f)].strip().capitalize()
            names.append(f"{sn}, {title}. {gn}")
            cabins.append(f"{'ABC'[pclass[i] - 1]}{10 + (i % 90)}" if rng.random() > 0.77 else np.nan)
            tickets.append(f"PC {17500 + (i % 350)}" if pclass[i] == 1 else str(230000 + i))

        age_obj = age.astype(float)
        age_obj[rng.random(n) < 0.20] = np.nan
        embarked[rng.random(n) < 0.005] = np.nan
        if not with_target:
            fare[0] = np.nan

        data = {
            "PassengerId": np.arange(start_id, start_id + n),
            "Pclass": pclass,
            "Name": names,
            "Sex": sex,
            "Age": age_obj,
            "SibSp": sibsp,
            "Parch": parch,
            "Ticket": tickets,
            "Fare": fare,
            "Cabin": pd.Series(cabins, dtype=object),
            "Embarked": pd.Series(embarked, dtype=object),
        }
        if with_target:
            family_size = sibsp + parch + 1
            logit = (
                -1.65
                + np.where(sex == "female", 2.45, 0.0)
                + np.where(pclass == 1, 1.35, np.where(pclass == 2, 0.35, -0.55))
                + np.where(np.nan_to_num(age_obj, nan=29.0) < 12, 1.2, 0.0)
                + np.where((family_size >= 2) & (family_size <= 4), 0.75, -0.35)
            )
            prob = 1.0 / (1.0 + np.exp(-logit))
            survived = (rng.random(n) < prob).astype(int)
            ordered = {"PassengerId": data["PassengerId"], "Survived": survived}
            for k, v in data.items():
                if k != "PassengerId":
                    ordered[k] = v
            return pd.DataFrame(ordered)
        return pd.DataFrame(data)

    _make_split(891, 1, True).to_csv(os.path.join(data_dir, "train.csv"), index=False)
    _make_split(418, 892, False).to_csv(os.path.join(data_dir, "test.csv"), index=False)
    print(f"Titanic dataset ready at: {data_dir}")

_ensure_titanic_data()`;

const HOUSE_PRICES_SETUP_SOURCE = `# [Colab / ローカル環境用セットアップ]
# Kaggle Notebook 上では既存の /kaggle/input/house-prices-advanced-regression-techniques を使用し、
# Google Colab やローカル環境では互換スキーマの住宅価格サンプルデータを自動配置します。
import os
import numpy as np
import pandas as pd

def _ensure_house_prices_data():
    target_dir = "/kaggle/input/house-prices-advanced-regression-techniques"
    if os.path.exists(os.path.join(target_dir, "train.csv")):
        return

    try:
        os.makedirs(target_dir, exist_ok=True)
        data_dir = target_dir
    except OSError:
        data_dir = os.path.abspath("./.kaggle_input/house-prices-advanced-regression-techniques")
        os.makedirs(data_dir, exist_ok=True)
        _orig_read_csv = pd.read_csv

        def _compat_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and filepath_or_buffer.startswith("/kaggle/input/"):
                rel = filepath_or_buffer[len("/kaggle/input/"):]
                local_path = os.path.abspath(os.path.join("./.kaggle_input", rel))
                if os.path.exists(local_path):
                    filepath_or_buffer = local_path
            return _orig_read_csv(filepath_or_buffer, *args, **kwargs)

        pd.read_csv = _compat_read_csv

    rng = np.random.default_rng(42)

    def _make_split(n, start_id, with_target):
        overall_qual = rng.integers(3, 10, size=n)
        first_flr = rng.normal(1160, 320, size=n).clip(450, 3200).round().astype(int)
        second_flr = np.where(rng.random(n) > 0.45, rng.normal(650, 260, size=n).clip(0, 1800), 0).round().astype(int)
        bsmt_sf = rng.normal(1050, 350, size=n).clip(0, 3000).round()
        gr_liv_area = first_flr + second_flr
        garage_cars = rng.choice([0, 1, 2, 3], size=n, p=[0.06, 0.27, 0.55, 0.12])
        year_built = rng.integers(1950, 2010, size=n)
        year_remod = np.maximum(year_built, rng.integers(1960, 2011, size=n))
        yr_sold = rng.integers(2006, 2011, size=n)
        lot_frontage = rng.normal(70, 20, size=n).clip(21, 180).round(1)
        lot_frontage[rng.random(n) < 0.17] = np.nan
        bsmt_With_nan = bsmt_sf.copy()
        if not with_target:
            bsmt_With_nan[0] = np.nan

        neighborhood = rng.choice(["NAmes", "CollgCr", "OldTown", "Edwards", "Somerst", "NridgHt"], size=n)
        ms_zoning = rng.choice(["RL", "RM", "FV", "C (all)"], size=n, p=[0.78, 0.15, 0.05, 0.02]).astype(object)
        if not with_target:
            ms_zoning[0] = "RareZone"  # test のみに現れる未知カテゴリ（handle_unknown="ignore" 検証用）
        kitchen_qual = np.where(overall_qual >= 8, "Ex", np.where(overall_qual >= 6, "Gd", "TA")).astype(object)
        garage_type = np.where(garage_cars == 0, None, rng.choice(["Attchd", "Detchd", "BuiltIn"], size=n).astype(object))

        df = pd.DataFrame({
            "Id": np.arange(start_id, start_id + n),
            "MSSubClass": rng.choice([20, 60, 50, 120], size=n),
            "MSZoning": pd.Series(ms_zoning, dtype=object),
            "LotFrontage": lot_frontage,
            "LotArea": rng.lognormal(9.1, 0.4, size=n).round().astype(int),
            "Neighborhood": neighborhood,
            "OverallQual": overall_qual,
            "OverallCond": rng.integers(4, 9, size=n),
            "YearBuilt": year_built,
            "YearRemodAdd": year_remod,
            "TotalBsmtSF": bsmt_With_nan,
            "1stFlrSF": first_flr,
            "2ndFlrSF": second_flr,
            "GrLivArea": gr_liv_area,
            "FullBath": rng.choice([1, 2, 3], size=n, p=[0.45, 0.50, 0.05]),
            "KitchenQual": pd.Series(kitchen_qual, dtype=object),
            "GarageType": pd.Series(garage_type, dtype=object),
            "GarageCars": garage_cars,
            "YrSold": yr_sold,
        })
        if with_target:
            log_price = (
                10.8
                + 0.14 * overall_qual
                + 0.00028 * gr_liv_area
                + 0.00018 * np.nan_to_num(bsmt_With_nan, nan=0.0)
                + 0.08 * garage_cars
                + 0.003 * (year_built - 1970)
                + np.where(neighborhood == "NridgHt", 0.18, 0.0)
                + rng.normal(0.0, 0.11, size=n)
            )
            df["SalePrice"] = np.expm1(log_price).round().astype(int)
        return df

    _make_split(1460, 1, True).to_csv(os.path.join(data_dir, "train.csv"), index=False)
    _make_split(1459, 1461, False).to_csv(os.path.join(data_dir, "test.csv"), index=False)
    print(f"House Prices dataset ready at: {data_dir}")

_ensure_house_prices_data()`;

/**
 * Part 1 (#72) で生成・整備する 20 件の Notebook 定義。
 * - setupCells: 本文セルの前に挿入するセットアップコードセル配列
 * - injectBeforeBlock: 特定のコードブロック（0始まり）の直前に挿入する補助コードセル
 * - postCells: 末尾に追加する動作確認用コードセル配列
 */
const NOTEBOOK_CONFIGS = [
	{
		slug: "competitions/titanic",
		mdxPath: "content/competitions/titanic.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
		postCells: ['print("submission shape:", submission.shape)\nsubmission.head()'],
	},
	{
		slug: "competitions/house-prices",
		mdxPath: "content/competitions/house-prices.mdx",
		setupCells: [HOUSE_PRICES_SETUP_SOURCE],
		postCells: ['print("submission shape:", submission.shape)\nsubmission.head()'],
	},
	{
		slug: "learn/python-data-analysis/01-python-basics",
		mdxPath: "content/learn/python-data-analysis/01-python-basics.mdx",
		setupCells: [],
	},
	{
		slug: "learn/python-data-analysis/02-numpy",
		mdxPath: "content/learn/python-data-analysis/02-numpy.mdx",
		setupCells: [],
		postCells: [
			'print("centered:\\n", centered)\nprint("column means after centering:", centered.mean(axis=0))',
		],
	},
	{
		slug: "learn/python-data-analysis/03-pandas-basics",
		mdxPath: "content/learn/python-data-analysis/03-pandas-basics.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
	},
	{
		slug: "learn/python-data-analysis/04-pandas-aggregation",
		mdxPath: "content/learn/python-data-analysis/04-pandas-aggregation.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
		postCells: ['df[["Name", "Title", "Sex", "Sex_code"]].head()'],
	},
	{
		slug: "learn/python-data-analysis/05-visualization",
		mdxPath: "content/learn/python-data-analysis/05-visualization.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
	},
	{
		slug: "learn/python-data-analysis/06-eda",
		mdxPath: "content/learn/python-data-analysis/06-eda.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
	},
	{
		slug: "learn/python-data-analysis/07-missing-and-outliers",
		mdxPath: "content/learn/python-data-analysis/07-missing-and-outliers.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
		postCells: [
			'print(f"IQR bounds: [{lower:.2f}, {upper:.2f}], detected outliers: {len(outliers)} rows")',
		],
	},
	{
		slug: "learn/ml-basics/02-problem-framing",
		mdxPath: "content/learn/ml-basics/02-problem-framing.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
		postCells: [
			'print("unique targets:", df["Survived"].unique(), "dtype:", df["Survived"].dtype)',
		],
	},
	{
		slug: "learn/ml-basics/03-train-test-split",
		mdxPath: "content/learn/ml-basics/03-train-test-split.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# Titanic データを読み込みます\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")',
		],
		postCells: [
			'print(f"train: {X_train.shape}, positive rate = {y_train.mean():.3f}")\nprint(f"valid: {X_valid.shape}, positive rate = {y_valid.mean():.3f}")',
		],
	},
	{
		slug: "learn/ml-basics/04-cross-validation",
		mdxPath: "content/learn/ml-basics/04-cross-validation.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# 数値特徴量を取り出し、欠損を中央値で補完して X, y を準備します\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"]\nX = df[features].fillna(df[features].median())\ny = df["Survived"]',
		],
	},
	{
		slug: "learn/ml-basics/05-metrics-regression",
		mdxPath: "content/learn/ml-basics/05-metrics-regression.mdx",
		setupCells: [
			"# サンプルの実測値と予測値を用意します\nimport numpy as np\ny_true = np.array([150000.0, 210000.0, 180000.0, 320000.0, 275000.0])\ny_pred = np.array([160000.0, 198000.0, 175000.0, 300000.0, 290000.0])",
		],
		postCells: ['print(f"RMSE: {rmse:.2f}, MAE: {mae:.2f}, R^2: {r2:.4f}")'],
	},
	{
		slug: "learn/ml-basics/06-metrics-classification",
		mdxPath: "content/learn/ml-basics/06-metrics-classification.mdx",
		setupCells: [
			"# サンプルの正解ラベルと予測確率・予測ラベルを用意します\nimport numpy as np\ny_true = np.array([0, 1, 1, 0, 1, 0, 1, 0])\ny_proba = np.array([0.12, 0.85, 0.72, 0.30, 0.65, 0.20, 0.91, 0.42])\ny_pred = (y_proba >= 0.5).astype(int)",
		],
		postCells: [
			'print(f"Accuracy: {acc:.4f}, F1: {f1:.4f}, ROC-AUC: {auc:.4f}, LogLoss: {ll:.4f}")',
		],
	},
	{
		slug: "learn/ml-basics/07-scikit-learn-api",
		mdxPath: "content/learn/ml-basics/07-scikit-learn-api.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# 訓練・検証データを用意します\nfrom sklearn.model_selection import train_test_split\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"]\nX = df[features].fillna(df[features].median())\ny = df["Survived"]\nX_train, X_valid, y_train, y_valid = train_test_split(\n    X, y, test_size=0.2, stratify=y, random_state=42\n)',
		],
	},
	{
		slug: "learn/ml-basics/08-first-models",
		mdxPath: "content/learn/ml-basics/08-first-models.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
		postCells: [
			'# 決定木でも同様に Pipeline を組んで CV スコアを比較します\ntree_pipe = Pipeline([("imputer", SimpleImputer(strategy="median")), ("model", tree)])\ntree_scores = cross_val_score(tree_pipe, X, y, cv=cv, scoring="accuracy")\nprint(f"DecisionTree CV accuracy: {tree_scores.mean():.4f} +/- {tree_scores.std():.4f}")',
		],
	},
	{
		slug: "learn/intro-competitions/03-titanic-baseline",
		mdxPath: "content/learn/intro-competitions/03-titanic-baseline.mdx",
		setupCells: [TITANIC_SETUP_SOURCE],
	},
	{
		slug: "learn/intro-competitions/04-titanic-cv",
		mdxPath: "content/learn/intro-competitions/04-titanic-cv.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# 前レッスン（L3-03）のベースライン特徴量 X, y を準備します\ntrain = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]\n\ndef preprocess(df):\n    df = df.copy()\n    df["Age"] = df["Age"].fillna(df["Age"].median())\n    df["Fare"] = df["Fare"].fillna(df["Fare"].median())\n    df["Embarked"] = df["Embarked"].fillna("S")\n    return df\n\nX = pd.get_dummies(preprocess(train)[features])\ny = train["Survived"]',
		],
		postCells: [
			'# 追加した特徴量を含めて CV スコアの変化を確認します\ntrain_fe = add_features(preprocess(train))\nfe_cols = features + ["FamilySize", "IsAlone", "Title"]\nX_fe = pd.get_dummies(train_fe[fe_cols])\nscores_fe = cross_val_score(model, X_fe, y, cv=cv, scoring="accuracy")\nprint(f"Improved CV accuracy: {scores_fe.mean():.4f} +/- {scores_fe.std():.4f}")',
		],
	},
	{
		slug: "learn/intro-competitions/06-house-prices-baseline",
		mdxPath: "content/learn/intro-competitions/06-house-prices-baseline.mdx",
		setupCells: [HOUSE_PRICES_SETUP_SOURCE],
		postCells: ["submission.head()"],
	},
	{
		slug: "learn/intro-competitions/07-house-prices-ensemble",
		mdxPath: "content/learn/intro-competitions/07-house-prices-ensemble.mdx",
		setupCells: [HOUSE_PRICES_SETUP_SOURCE],
		injectBeforeBlock: {
			1: `# 強化した特徴量と前処理 Pipeline を使って Ridge と GradientBoostingRegressor を学習します
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

train = add_features(pd.read_csv("/kaggle/input/house-prices-advanced-regression-techniques/train.csv"))
test = add_features(pd.read_csv("/kaggle/input/house-prices-advanced-regression-techniques/test.csv"))

y = np.log1p(train["SalePrice"])
X = train.drop(columns=["Id", "SalePrice"])
X_test = test.drop(columns=["Id"])

num_cols = X.select_dtypes("number").columns
cat_cols = X.select_dtypes("object").columns

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_cols),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("oh", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
])

ridge = Pipeline([("pre", pre), ("ridge", Ridge(alpha=10.0))]).fit(X, y)
gbr = Pipeline([("pre", pre), ("gbr", GradientBoostingRegressor(random_state=42))]).fit(X, y)`,
		},
		postCells: [
			'submission = pd.DataFrame({"Id": test["Id"], "SalePrice": pred})\nprint("Blended predictions preview:")\nsubmission.head()',
		],
	},
];

function deterministicCellId(slug, index) {
	return createHash("sha256").update(`${slug}:${index}`).digest("hex").slice(0, 8);
}

function toNotebookSourceLines(text) {
	const normalized = text.replace(/\r\n/g, "\n").trim();
	if (!normalized) return [];
	const lines = normalized.split("\n");
	return lines.map((line, idx) => (idx < lines.length - 1 ? `${line}\n` : line));
}

function parseFrontmatter(mdx) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(mdx);
	if (!match) return { title: "Notebook", description: "", body: mdx };
	const fm = match[1];
	const title = /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? "Notebook";
	const description = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? "";
	return {
		title: title.replace(/^["']|["']$/g, ""),
		description: description.replace(/^["']|["']$/g, ""),
		body: mdx.slice(match[0].length),
	};
}

function cleanMdxProse(prose) {
	let cleaned = prose;
	// <Quiz ... /> と <RunLinks ... /> を除去
	cleaned = cleaned.replace(/<Quiz[\s\S]*?\/>/g, "");
	cleaned = cleaned.replace(/<RunLinks[\s\S]*?\/>/g, "");
	// <Callout type="xxx">...</Callout> を Markdown 引用ブロックへ変換
	const calloutLabels = { note: "Note", tip: "Tip", warning: "Warning" };
	cleaned = cleaned.replace(
		/<Callout(?:\s+type="([^"]+)")?\s*>([\s\S]*?)<\/Callout>/g,
		(_, type, inner) => {
			const label = calloutLabels[type] ?? "Note";
			const text = inner
				.trim()
				.split(/\r?\n/)
				.map((l) => l.trim())
				.filter(Boolean)
				.join(" ");
			return `> **${label}:** ${text}`;
		},
	);
	// [[用語|slug]] -> 用語, [[用語]] -> 用語
	cleaned = cleaned.replace(/\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g, "$1");
	// 内部リンク [text](/learn/...) はリンクテキストまたは絶対パス案内として読みやすく整形
	cleaned = cleaned.replace(/\[([^\]]+)\]\(\/(?:learn|competitions|glossary)[^)]*\)/g, "$1");
	// 空の「## 理解度チェック」セクション見出しが残った場合は除去
	cleaned = cleaned.replace(/^##\s+理解度チェック\s*$/gm, "");
	// 3連続以上の改行を2改行に圧縮
	cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
	return cleaned;
}

function buildCellsForMdx(config) {
	const fullMdxPath = path.join(ROOT_DIR, config.mdxPath);
	const rawMdx = readFileSync(fullMdxPath, "utf8");
	const { title, description, body } = parseFrontmatter(rawMdx);

	const rawCells = [];

	// 1. タイトルヘッダーセル
	const headerLines = [
		`# ${title}`,
		"",
		...(description ? [description, ""] : []),
		`> **Kaggle Tutorial** 対応ノートブック（\`/${config.slug}\`）です。上から順にセルを実行（\`Shift + Enter\` または「ランタイム → すべてのセルを実行」）して動作を確認できます。`,
	];
	rawCells.push({ cell_type: "markdown", text: headerLines.join("\n") });

	// 2. セットアップセル（必要なレッスンのみ）
	for (const setupCode of config.setupCells ?? []) {
		rawCells.push({ cell_type: "code", text: setupCode });
	}

	// 3. 本文を Python コードブロックとそれ以外（Markdown + 非Pythonフェンス）に分割
	const fenceRegex = /```python\r?\n([\s\S]*?)```/g;
	let lastIndex = 0;
	let pyBlockIndex = 0;
	let match;

	while ((match = fenceRegex.exec(body)) !== null) {
		const proseSegment = cleanMdxProse(body.slice(lastIndex, match.index));
		if (proseSegment) {
			rawCells.push({ cell_type: "markdown", text: proseSegment });
		}

		const injected = config.injectBeforeBlock?.[pyBlockIndex];
		if (injected) {
			rawCells.push({ cell_type: "code", text: injected });
		}

		rawCells.push({ cell_type: "code", text: match[1].trim() });
		pyBlockIndex += 1;
		lastIndex = match.index + match[0].length;
	}

	const trailingProse = cleanMdxProse(body.slice(lastIndex));
	// 末尾に補助コードセルがある場合はその前に、無ければそのまま末尾解説を追加
	if (config.postCells?.length) {
		for (const postCode of config.postCells) {
			rawCells.push({ cell_type: "code", text: postCode });
		}
	}
	if (trailingProse) {
		rawCells.push({ cell_type: "markdown", text: trailingProse });
	}

	return rawCells.map((cell, index) => {
		const id = deterministicCellId(config.slug, index);
		const source = toNotebookSourceLines(cell.text);
		if (cell.cell_type === "code") {
			return {
				cell_type: "code",
				execution_count: null,
				id,
				metadata: {},
				outputs: [],
				source,
			};
		}
		return {
			cell_type: "markdown",
			id,
			metadata: {},
			source,
		};
	});
}

function serializeNotebook(config) {
	const cells = buildCellsForMdx(config);
	const filename = `${config.slug.split("/").at(-1)}.ipynb`;
	const notebook = {
		cells,
		metadata: {
			colab: {
				name: filename,
				provenance: [],
			},
			kernelspec: {
				display_name: "Python 3",
				language: "python",
				name: "python3",
			},
			language_info: {
				name: "python",
			},
		},
		nbformat: 4,
		nbformat_minor: 5,
	};
	return { content: `${JSON.stringify(notebook, null, 2)}\n`, cellCount: cells.length };
}

function generateAll({ checkOnly = false } = {}) {
	const mismatches = [];
	for (const config of NOTEBOOK_CONFIGS) {
		const { content, cellCount } = serializeNotebook(config);
		const outPath = path.join(ROOT_DIR, "public", "notebooks", `${config.slug}.ipynb`);
		if (checkOnly) {
			if (!existsSync(outPath) || readFileSync(outPath, "utf8") !== content) {
				mismatches.push(`public/notebooks/${config.slug}.ipynb`);
			}
			continue;
		}
		mkdirSync(path.dirname(outPath), { recursive: true });
		writeFileSync(outPath, content, "utf8");
		console.log(`Generated: public/notebooks/${config.slug}.ipynb (${cellCount} cells)`);
	}
	if (checkOnly && mismatches.length > 0) {
		console.error(
			`Notebook drift detected (${mismatches.length} files). Run 'pnpm notebooks:generate':\n` +
				mismatches.map((f) => `  - ${f}`).join("\n"),
		);
		process.exit(1);
	}
}

generateAll({ checkOnly: process.argv.includes("--check") });
