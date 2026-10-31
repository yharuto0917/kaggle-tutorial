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
 * `<RunLinks>` が配置された全 40 件（#72 + #73）の Notebook 定義。
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
		slug: "competitions/playground-series",
		mdxPath: "content/competitions/playground-series.mdx",
		setupCells: [
			`# [Colab / ローカル環境用セットアップ]
# Playground Series 形式（id, 数値特徴量, 二値 target）の合成データを準備し、
# "/kaggle/input/<competition>/..." のプレースホルダパスから透過的に読み込めるようにします。
import os
import numpy as np
import pandas as pd

def _ensure_playground_data():
    data_dir = os.path.abspath("./.kaggle_input/playground-series")
    os.makedirs(data_dir, exist_ok=True)
    orig_read_csv = pd.read_csv
    if not getattr(orig_read_csv, "_is_playground_wrapped", False):
        def _patched_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and filepath_or_buffer.startswith("/kaggle/input/<competition>/"):
                rel = filepath_or_buffer[len("/kaggle/input/<competition>/"):]
                filepath_or_buffer = os.path.join(data_dir, rel)
            return orig_read_csv(filepath_or_buffer, *args, **kwargs)
        _patched_read_csv._is_playground_wrapped = True
        pd.read_csv = _patched_read_csv

    rng = np.random.default_rng(42)
    def _make_split(n, start_id, with_target):
        feats = {f"feat_{i}": rng.normal(0.0, 1.0, size=n).round(4) for i in range(8)}
        df = pd.DataFrame({"id": np.arange(start_id, start_id + n), **feats})
        if with_target:
            logit = (
                -0.8
                + 1.1 * df["feat_0"]
                - 0.8 * df["feat_1"]
                + 0.6 * df["feat_2"] * df["feat_3"]
                + 0.5 * (df["feat_4"] > 0).astype(float)
            )
            prob = 1.0 / (1.0 + np.exp(-logit))
            df["target"] = (rng.random(n) < prob).astype(int)
        return df

    _make_split(1000, 0, True).to_csv(os.path.join(data_dir, "train.csv"), index=False)
    _make_split(400, 1000, False).to_csv(os.path.join(data_dir, "test.csv"), index=False)
    print(f"Playground Series sample dataset ready at: {data_dir}")

_ensure_playground_data()`,
		],
		injectBeforeBlock: {
			2: `# 同一の StratifiedKFold 分割を使って XGBoost と線形モデルの OOF 予測を作成します（fold 外への漏洩なし）
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

oof_lgbm = oof
oof_xgb = np.zeros(len(X))
oof_linear = np.zeros(len(X))
for tr, va in skf.split(X, y):
    m_xgb = XGBClassifier(
        n_estimators=150, max_depth=3, learning_rate=0.05, eval_metric="logloss", random_state=42
    )
    m_xgb.fit(X.iloc[tr], y.iloc[tr])
    oof_xgb[va] = m_xgb.predict_proba(X.iloc[va])[:, 1]

    m_lin = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
    m_lin.fit(X.iloc[tr], y.iloc[tr])
    oof_linear[va] = m_lin.predict_proba(X.iloc[va])[:, 1]`,
		},
		postCells: ['print("Blended CV AUC:", round(roc_auc_score(y, blend), 4))'],
	},
	{
		slug: "competitions/image-classification",
		mdxPath: "content/competitions/image-classification.mdx",
		setupCells: [
			`# [Colab / ローカル環境用セットアップ]
# timm パッケージの確認・自動インストールと、画像コンペ形式のメタデータ CSV を準備します。
import os
import subprocess
import sys

try:
    import timm  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "timm"], check=True)

import numpy as np
import pandas as pd
import torch

def _ensure_image_comp_data():
    data_dir = os.path.abspath("./.kaggle_input/image-classification")
    os.makedirs(data_dir, exist_ok=True)
    orig_read_csv = pd.read_csv
    if not getattr(orig_read_csv, "_is_img_comp_wrapped", False):
        def _patched_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and filepath_or_buffer.startswith("/kaggle/input/<competition>/"):
                rel = filepath_or_buffer[len("/kaggle/input/<competition>/"):]
                filepath_or_buffer = os.path.join(data_dir, rel)
            return orig_read_csv(filepath_or_buffer, *args, **kwargs)
        _patched_read_csv._is_img_comp_wrapped = True
        pd.read_csv = _patched_read_csv

    rng = np.random.default_rng(42)
    labels = rng.choice([0, 1, 2, 3, 4], size=120, p=[0.35, 0.25, 0.20, 0.12, 0.08])
    pd.DataFrame({
        "image_id": [f"img_{i:04d}.jpg" for i in range(len(labels))],
        "label": labels,
    }).to_csv(os.path.join(data_dir, "train.csv"), index=False)
    print(f"Image competition metadata ready at: {data_dir}")

_ensure_image_comp_data()`,
		],
		injectBeforeBlock: {
			1: '# クラス数を訓練メタデータから取得します\nn_classes = int(df["label"].nunique())',
			3: `# 5-fold 学習済みモデルの推論ラッパーとダミー画像バッチ (4枚, RGB, 224x224) を用意してアンサンブル推論を確認します
model.eval()

class _FoldPredictor:
    def __init__(self, net):
        self.net = net
    def predict(self, batch_tensor):
        with torch.no_grad():
            return torch.softmax(self.net(batch_tensor), dim=-1).cpu().numpy()

fold_models = [_FoldPredictor(model) for _ in range(5)]
test = torch.randn(4, 3, 224, 224)`,
		},
		postCells: [
			'print("Fold-averaged test_pred shape:", test_pred.shape)\nprint(test_pred.round(3))',
		],
	},
	{
		slug: "competitions/nlp-text-classification",
		mdxPath: "content/competitions/nlp-text-classification.mdx",
		setupCells: [
			`# [Colab / ローカル環境用セットアップ]
# transformers の確認と、訓練・テスト分離済みのテキスト分類サンプルデータを準備します。
import os
import subprocess
import sys

try:
    import transformers  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "transformers"], check=True)

import pandas as pd

def _ensure_nlp_comp_data():
    data_dir = os.path.abspath("./.kaggle_input/nlp-text-classification")
    os.makedirs(data_dir, exist_ok=True)
    orig_read_csv = pd.read_csv
    if not getattr(orig_read_csv, "_is_nlp_comp_wrapped", False):
        def _patched_read_csv(filepath_or_buffer, *args, **kwargs):
            if isinstance(filepath_or_buffer, str) and filepath_or_buffer.startswith("/kaggle/input/<competition>/"):
                rel = filepath_or_buffer[len("/kaggle/input/<competition>/"):]
                filepath_or_buffer = os.path.join(data_dir, rel)
            return orig_read_csv(filepath_or_buffer, *args, **kwargs)
        _patched_read_csv._is_nlp_comp_wrapped = True
        pd.read_csv = _patched_read_csv

    pos_samples = [
        "Stratified cross validation kept our local score aligned with the leaderboard.",
        "Combining TF-IDF features with gradient boosting built a strong baseline.",
        "Careful feature engineering improved generalization on unseen test records.",
        "Ensembling diverse architectures reduced variance and stabilized predictions.",
    ] * 8
    neg_samples = [
        "Fitting the vectorizer before splitting leaked validation vocabulary.",
        "Overfitting to the public leaderboard caused a severe private shakeup.",
        "Missing value imputation across the full table distorted fold evaluation.",
        "Ignoring class imbalance degraded macro F1 on minority categories.",
    ] * 8

    train_df = pd.DataFrame({
        "text": pos_samples + neg_samples,
        "label": [1] * len(pos_samples) + [0] * len(neg_samples),
    })
    test_df = pd.DataFrame({
        "text": [
            "Out-of-fold validation prevented leakage and improved model blending.",
            "Target leakage inflated validation metrics and ruined test performance.",
            "Transfer learning with pretrained transformers boosted text accuracy.",
            "Unchecked distribution shift between train and test broke predictions.",
        ]
    })
    train_df.to_csv(os.path.join(data_dir, "train.csv"), index=False)
    test_df.to_csv(os.path.join(data_dir, "test.csv"), index=False)
    print(f"NLP competition dataset ready at: {data_dir}")

_ensure_nlp_comp_data()`,
		],
		injectBeforeBlock: {
			1: `# テストデータを読み込み、訓練データのみで fit した TF-IDF + 線形モデルでテスト予測確率を算出します
test_df = pd.read_csv("/kaggle/input/<competition>/test.csv")
pred_tfidf = model.predict_proba(tfidf.transform(test_df["text"]))[:, 1]

# 続く BERT トークナイズ用にクラス数とテスト文章リストを設定します
n_classes = int(df["label"].nunique())
texts = test_df["text"].tolist()`,
			2: `# BERT モデルでテスト文章の陽性クラス確率を推論します
import torch

model.eval()
with torch.no_grad():
    pred_bert = torch.softmax(model(**enc).logits, dim=-1)[:, 1].cpu().numpy()`,
		},
		postCells: [
			'pd.DataFrame({"text": texts, "pred_tfidf": pred_tfidf.round(3), "pred_bert": pred_bert.round(3), "blend": pred.round(3)})',
		],
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
			'# 数値特徴量 X と目的変数 y を準備します（欠損補完はリーク防止のため CV 内の Pipeline で行います）\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"]\nX = df[features]\ny = df["Survived"]',
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
			'# 先に訓練・検証データへ分割し、最初の単体モデル例向けに訓練側のみで中央値を fit して補完します\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.model_selection import train_test_split\n\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"]\nX = df[features]\ny = df["Survived"]\nX_train_raw, X_valid_raw, y_train, y_valid = train_test_split(\n    X, y, test_size=0.2, stratify=y, random_state=42\n)\nimputer = SimpleImputer(strategy="median")\nX_train = pd.DataFrame(imputer.fit_transform(X_train_raw), columns=features, index=X_train_raw.index)\nX_valid = pd.DataFrame(imputer.transform(X_valid_raw), columns=features, index=X_valid_raw.index)',
		],
		injectBeforeBlock: {
			1: "# Pipeline 内の SimpleImputer が実際に欠損補完を担うよう、補完前の分割データを使います\nX_train, X_valid = X_train_raw, X_valid_raw",
		},
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
			'# ベースライン特徴量 X, y を準備します（分割前の全体中央値補完によるリークを避け、数値欠損は RandomForest にそのまま渡します）\ntrain = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]\nX = pd.get_dummies(train[features])\ny = train["Survived"]',
		],
		postCells: [
			'# 追加した特徴量を含めて CV スコアの変化を確認します\ntrain_fe = add_features(train)\nfe_cols = features + ["FamilySize", "IsAlone", "Title"]\nX_fe = pd.get_dummies(train_fe[fe_cols])\nscores_fe = cross_val_score(model, X_fe, y, cv=cv, scoring="accuracy")\nprint(f"Improved CV accuracy: {scores_fe.mean():.4f} +/- {scores_fe.std():.4f}")',
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
	// L5: 勾配ブースティング (3件)
	{
		slug: "learn/gradient-boosting/04-xgboost",
		mdxPath: "content/learn/gradient-boosting/04-xgboost.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# Titanic の数値特徴量 X と目的変数 y を準備します（欠損値は XGBoost が分岐学習で直接扱います）\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"]\nX = df[features].copy()\ny = df["Survived"]',
		],
		postCells: [
			'from sklearn.metrics import roc_auc_score\nval_auc = roc_auc_score(y_va, model.predict_proba(X_va)[:, 1])\nprint(f"Validation AUC: {val_auc:.4f}")',
		],
	},
	{
		slug: "learn/gradient-boosting/05-lightgbm",
		mdxPath: "content/learn/gradient-boosting/05-lightgbm.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'# Titanic データを読み込み、訓練・検証へ層化分割します（統計量を使わない category 型変換のみ実施）\nfrom sklearn.model_selection import train_test_split\n\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\ncat_cols = ["Sex", "Embarked"]\nfeatures = ["Pclass", "Age", "SibSp", "Parch", "Fare"] + cat_cols\nX = df[features].copy()\nfor c in cat_cols:\n    X[c] = X[c].astype("category")\ny = df["Survived"]\nX_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)\nX_tr, X_va = X_tr.copy(), X_va.copy()',
		],
		postCells: [
			'from sklearn.metrics import roc_auc_score\nval_auc = roc_auc_score(y_va, model.predict_proba(X_va)[:, 1])\nprint(f"LightGBM Validation AUC: {val_auc:.4f}")',
		],
	},
	{
		slug: "learn/gradient-boosting/06-catboost",
		mdxPath: "content/learn/gradient-boosting/06-catboost.mdx",
		setupCells: [
			`# [Colab / ローカル環境用セットアップ] catboost が未インストールの場合は自動インストールします
import subprocess
import sys

try:
    import catboost  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "catboost"], check=True)`,
			TITANIC_SETUP_SOURCE,
			'# カテゴリ列の欠損を定数文字列 "Missing" に統一した上で訓練・検証へ層化分割します\nfrom sklearn.model_selection import train_test_split\n\ndf = pd.read_csv("/kaggle/input/titanic/train.csv")\nfeatures = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]\nX = df[features].copy()\nX["Sex"] = X["Sex"].astype(str)\nX["Embarked"] = X["Embarked"].fillna("Missing").astype(str)\ny = df["Survived"]\nX_tr, X_va, y_tr, y_va = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)',
		],
		postCells: [
			'from sklearn.metrics import roc_auc_score\nval_auc = roc_auc_score(y_va, model.predict_proba(X_va)[:, 1])\nprint(f"CatBoost Validation AUC: {val_auc:.4f} (best_iteration={model.get_best_iteration()})")',
		],
	},
	// L6: アンサンブル・コンペ実践フロー (2件)
	{
		slug: "learn/ensemble-workflow/02-averaging-blending",
		mdxPath: "content/learn/ensemble-workflow/02-averaging-blending.mdx",
		setupCells: [
			`# 3 系統モデルの OOF 予測確率（重み探索用）とテスト予測確率を用意します
import numpy as np
from sklearn.metrics import roc_auc_score

rng = np.random.default_rng(42)
n_train, n_test = 600, 200
y = rng.integers(0, 2, size=n_train)

oof_lgbm = np.clip(0.25 + 0.50 * y + rng.normal(0, 0.22, size=n_train), 0.01, 0.99)
oof_xgb = np.clip(0.27 + 0.46 * y + rng.normal(0, 0.24, size=n_train), 0.01, 0.99)
oof_linear = np.clip(0.30 + 0.40 * y + rng.normal(0, 0.26, size=n_train), 0.01, 0.99)

pred_lgbm = rng.uniform(0.05, 0.95, size=n_test)
pred_xgb = rng.uniform(0.05, 0.95, size=n_test)
pred_linear = rng.uniform(0.05, 0.95, size=n_test)`,
		],
		postCells: [
			'print(f"Best OOF AUC: {best[0]:.4f}, optimal weights (lgbm, xgb, linear): {tuple(round(w, 2) for w in best[1])}")\nprint("Rank-averaged test prediction preview:", rank[:5])',
		],
	},
	{
		slug: "learn/ensemble-workflow/03-stacking",
		mdxPath: "content/learn/ensemble-workflow/03-stacking.mdx",
		setupCells: [
			`# スタッキング検証用の二値分類データ (NumPy 配列) とベースモデル生成関数を用意します
import numpy as np
from lightgbm import LGBMClassifier
from sklearn.datasets import make_classification
from xgboost import XGBClassifier

X_all, y_all = make_classification(
    n_samples=800, n_features=12, n_informative=8, n_redundant=2, random_state=42
)
X, y = X_all[:600], y_all[:600]
X_test, y_test_holdout = X_all[600:], y_all[600:]

def make_lgbm():
    return LGBMClassifier(n_estimators=100, learning_rate=0.05, random_state=42, verbose=-1)

def make_xgb():
    return XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.05, eval_metric="logloss", random_state=42)`,
		],
		postCells: [
			'from sklearn.metrics import roc_auc_score\nprint("Holdout AUC (LGBM):", round(roc_auc_score(y_test_holdout, test_lgbm), 4))\nprint("Holdout AUC (XGB):", round(roc_auc_score(y_test_holdout, test_xgb), 4))\nprint("Holdout AUC (Stacked):", round(roc_auc_score(y_test_holdout, final), 4))',
		],
	},
	// L7: ディープラーニングと多様なデータ (7件)
	{
		slug: "learn/deep-learning/02-pytorch-intro",
		mdxPath: "content/learn/deep-learning/02-pytorch-intro.mdx",
		setupCells: [],
		injectBeforeBlock: {
			1: `# 先のセルで autograd 例としてスカラー y が定義されたため、表形式学習用の特徴量 X と二値ラベル y を準備します
import numpy as np

rng = np.random.default_rng(42)
X = rng.normal(size=(256, 8)).astype(np.float32)
y = ((X[:, 0] - 0.7 * X[:, 1]) > 0).astype(np.float32)`,
		},
		postCells: ['print(f"Final mini-batch training loss: {loss.item():.4f}")'],
	},
	{
		slug: "learn/deep-learning/03-tabular-dl",
		mdxPath: "content/learn/deep-learning/03-tabular-dl.mdx",
		setupCells: ["import torch"],
		postCells: [
			'# サンプルバッチ（カテゴリ ID と数値特徴量）を入力して出力形状を確認します\nnet = TabularNet(n_categories=10, emb_dim=8, n_numeric=5)\ncat_batch = torch.tensor([0, 3, 7, 2], dtype=torch.long)\nnum_batch = torch.randn(4, 5)\nout = net(cat_batch, num_batch)\nprint("TabularNet output shape:", out.shape)',
		],
	},
	{
		slug: "learn/deep-learning/04-cnn-basics",
		mdxPath: "content/learn/deep-learning/04-cnn-basics.mdx",
		setupCells: ["import torch\nn_classes = 10"],
		postCells: [
			'# ダミー RGB 画像バッチ (4枚, 3ch, 32x32) の順伝播を確認します\ndummy_images = torch.randn(4, 3, 32, 32)\nlogits = cnn(dummy_images)\nprint("CNN logits shape:", logits.shape)',
		],
	},
	{
		slug: "learn/deep-learning/05-transfer-learning",
		mdxPath: "content/learn/deep-learning/05-transfer-learning.mdx",
		setupCells: [
			`# timm の確認・自動インストールとクラス数の設定を行います
import subprocess
import sys

try:
    import timm  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "timm"], check=True)

import torch
n_classes = 5`,
		],
		postCells: [
			'model.eval()\nwith torch.no_grad():\n    out = model(torch.randn(2, 3, 224, 224))\nprint("Pretrained ResNet18 output shape:", out.shape, "| optimizer:", optimizer.__class__.__name__)',
		],
	},
	{
		slug: "learn/deep-learning/06-nlp-classic",
		mdxPath: "content/learn/deep-learning/06-nlp-classic.mdx",
		setupCells: [
			`# 訓練文書と未見のテスト文書を分離して用意します（TF-IDF は訓練文書のみで fit）
train_text = [
    "Cross validation prevented overfitting and improved generalization.",
    "Feature engineering with domain insights boosted validation AUC.",
    "Blending diverse models produced a stable leaderboard result.",
    "Clean pipeline design eliminated target leakage across folds.",
    "Data leakage from global scaling ruined private leaderboard score.",
    "Unvalidated threshold tuning overfit badly to public test split.",
    "Corrupted labels and unaligned columns caused silent prediction errors.",
    "Ignoring group structure leaked user history into validation folds.",
]
y = [1, 1, 1, 1, 0, 0, 0, 0]

test_text = [
    "Out-of-fold validation gave reliable ensemble weights.",
    "Global imputation before splitting leaked validation statistics.",
]`,
		],
		postCells: [
			'test_probs = model.predict_proba(X_test)[:, 1]\nfor txt, p in zip(test_text, test_probs):\n    print(f"prob={p:.3f} | {txt}")',
		],
	},
	{
		slug: "learn/deep-learning/07-transformers",
		mdxPath: "content/learn/deep-learning/07-transformers.mdx",
		setupCells: [
			`# transformers の確認・自動インストールとサンプル英文リストを用意します
import subprocess
import sys

try:
    import transformers  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "transformers"], check=True)

import torch

texts = [
    "Pretrained transformers capture context effectively for text competitions.",
    "Fine-tuning with a small learning rate stabilizes downstream performance.",
]`,
		],
		postCells: [
			'model.eval()\nwith torch.no_grad():\n    probs = torch.softmax(model(**enc).logits, dim=-1)\nprint("input_ids shape:", enc["input_ids"].shape)\nprint("predicted probabilities:\\n", probs.cpu().numpy().round(4))',
		],
	},
	{
		slug: "learn/deep-learning/08-time-series",
		mdxPath: "content/learn/deep-learning/08-time-series.mdx",
		setupCells: [
			`# 複数系列（store_A / store_B）の日次売上サンプルデータを生成します
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
dates = pd.date_range("2025-01-01", periods=14, freq="D")
df = pd.DataFrame({
    "id": np.repeat(["store_A", "store_B"], len(dates)),
    "date": np.tile(dates, 2),
    "y": (100 + np.tile(np.arange(len(dates)) * 2.0, 2) + rng.normal(0, 4.0, size=len(dates) * 2)).round(2),
})`,
		],
		postCells: ['df[["id", "date", "y", "lag_1", "roll_mean_7"]].dropna().head(8)'],
	},
	// L8: 上級テクニック・運用 (5件)
	{
		slug: "learn/advanced/01-target-encoding",
		mdxPath: "content/learn/advanced/01-target-encoding.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			'train = pd.read_csv("/kaggle/input/titanic/train.csv")\ntest = pd.read_csv("/kaggle/input/titanic/test.csv")',
		],
		postCells: [
			'# Titanic の Embarked 列に OOF Target Encoding を適用して結果を確認します\noof_te, test_te = target_encode_oof(train, test, col="Embarked", target="Survived")\nprint("OOF encoded Embarked (first 5):", oof_te[:5].round(4))\nprint("Test encoded Embarked (first 5):", test_te[:5].round(4))',
		],
	},
	{
		slug: "learn/advanced/02-adversarial-validation",
		mdxPath: "content/learn/advanced/02-adversarial-validation.mdx",
		setupCells: [
			TITANIC_SETUP_SOURCE,
			`# Titanic の train / test から LightGBM で直接扱える特徴量と target 名を準備します
raw_train = pd.read_csv("/kaggle/input/titanic/train.csv")
raw_test = pd.read_csv("/kaggle/input/titanic/test.csv")

features = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]
target = "Survived"
train = raw_train[features + [target]].copy()
test = raw_test[features].copy()
for col in ["Sex", "Embarked"]:
    train[col] = train[col].astype("category")
    test[col] = test[col].astype("category")`,
		],
	},
	{
		slug: "learn/advanced/03-pseudo-labeling",
		mdxPath: "content/learn/advanced/03-pseudo-labeling.mdx",
		setupCells: [
			`# 初期学習用の訓練データと未ラベルのテストデータを用意します（検証セットは別途分離して保持）
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

X_all, y_all = make_classification(n_samples=700, n_features=8, n_informative=5, random_state=42)
X_labeled, X_test, y_labeled, _ = train_test_split(X_all, y_all, test_size=250, random_state=42)
X_train, X_valid, y_train, y_valid = train_test_split(
    X_labeled, y_labeled, test_size=0.25, stratify=y_labeled, random_state=42
)

model = LogisticRegression(max_iter=1000).fit(X_train, y_train)
base_auc = roc_auc_score(y_valid, model.predict_proba(X_valid)[:, 1])
print(f"Baseline validation AUC (before pseudo-labeling): {base_auc:.4f}")`,
		],
		postCells: [
			'after_auc = roc_auc_score(y_valid, model.predict_proba(X_valid)[:, 1])\nprint(f"Selected high-confidence pseudo-labels: {len(pseudo_X)} / {len(X_test)}")\nprint(f"Validation AUC (evaluated strictly on clean X_valid): {after_auc:.4f}")',
		],
	},
	{
		slug: "learn/advanced/04-post-processing",
		mdxPath: "content/learn/advanced/04-post-processing.mdx",
		setupCells: [
			`# 陽性率 15% の不均衡な検証ラベル y_valid と OOF 予測確率を用意します
import numpy as np

rng = np.random.default_rng(42)
n_samples = 1000
y_valid = (rng.random(n_samples) < 0.15).astype(int)
oof = np.where(y_valid == 1, rng.beta(2.6, 3.8, size=n_samples), rng.beta(1.1, 10.5, size=n_samples))`,
		],
		postCells: [
			'default_f1 = f1_score(y_valid, (oof > 0.5).astype(int))\nprint(f"Default threshold (0.50) F1: {default_f1:.4f} -> Optimized threshold ({best_t:.2f}) F1: {best_f1:.4f}")',
		],
	},
	{
		slug: "learn/advanced/06-big-data-memory",
		mdxPath: "content/learn/advanced/06-big-data-memory.mdx",
		setupCells: [
			`# polars の確認・自動インストールと、チャンク処理・遅延評価用のサンプル CSV ("big.csv") を作成します
import subprocess
import sys

try:
    import polars  # noqa: F401
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "polars"], check=True)

import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n_rows = 50_000
sample_df = pd.DataFrame({
    "id": rng.choice(["A", "B", "C", "D"], size=n_rows),
    "y": rng.normal(100.0, 20.0, size=n_rows).round(2),
    "count": rng.integers(1, 500, size=n_rows),
})
sample_df.to_csv("big.csv", index=False)
print("Created sample big.csv:", sample_df.shape)`,
		],
		postCells: [
			'before_kb = sample_df.memory_usage(deep=True).sum() / 1024\nreduced_df = reduce_mem(sample_df.copy())\nafter_kb = reduced_df.memory_usage(deep=True).sum() / 1024\nprint(f"Memory usage: {before_kb:.1f} KB -> {after_kb:.1f} KB")\nprint("Chunk sum:\\n", agg)\nprint("Polars lazy mean:\\n", out)',
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
