# Kaggle Tutorial

Kaggle を実際に触りながら機械学習を実践的に学ぶ、日本語の総合学習サイト。
Kaggle 入門からグランドマスター級テクニックまでを「コース → 章 → レッスン」で体系化し、
理解度チェック・進捗管理・用語集・コンペウォークスルーを通じて
「読む → 手を動かす → 提出する」の学習ループを最短化します。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) + React 19
- **スタイリング**: Tailwind CSS v4
- **ランタイム**: Cloudflare Workers (OpenNext)
- **API**: Hono
- **DB**: Cloudflare D1 + Drizzle ORM
- **コンテンツ**: MDX (Fumadocs)
- **言語**: TypeScript / パッケージ管理: pnpm

## はじめに

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認します。

## 主要コマンド

| コマンド            | 内容                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | ローカル開発サーバー起動                                           |
| `pnpm check`        | 品質チェック一括（lint / format:check / typecheck / test / build） |
| `pnpm format`       | Prettier で整形                                                    |
| `pnpm preview:full` | OpenNext ビルド + Wrangler でローカル動作確認                      |
| `pnpm deploy`       | Cloudflare へデプロイ                                              |
| `pnpm typegen`      | Cloudflare Bindings の型定義生成                                   |

## 認証（Better Auth）のセットアップ

ログイン（メール/パスワード・Google OAuth）には以下のシークレットが必要です。
**シークレットはリポジトリにコミットしないでください。**

| 変数                   | 用途                                           |
| ---------------------- | ---------------------------------------------- |
| `BETTER_AUTH_SECRET`   | セッション署名鍵（必須・ランダムな長い文字列） |
| `BETTER_AUTH_URL`      | 認証のベース URL（例 `http://localhost:3000`） |
| `GOOGLE_CLIENT_ID`     | Google OAuth クライアント ID                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット          |

### ローカル

プロジェクト直下に `.dev.vars`（gitignore 済み）を作成して値を設定します。

```ini
BETTER_AUTH_SECRET=ローカル用のランダム文字列
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> メール/パスワードのみで試す場合は `BETTER_AUTH_SECRET` と `BETTER_AUTH_URL` だけでも動作します。

### 本番（Cloudflare）

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

### Google OAuth クライアント

Google Cloud Console で OAuth クライアント（種別: ウェブ）を作成し、
**承認済みリダイレクト URI** に `{BETTER_AUTH_URL}/api/auth/callback/google`
（例: `http://localhost:3000/api/auth/callback/google`）を登録します。

### D1 マイグレーション

スキーマ（`user` / `session` / `account` / `verification` / `lesson_progress` / `quiz_results`）は
drizzle で生成し wrangler で適用します（`drizzle-kit push` は使いません）。

```bash
pnpm db:generate        # スキーマ変更時のみ
pnpm db:migrate:local   # ローカル D1 へ適用
pnpm db:migrate:remote  # 本番 D1 へ適用（事前に wrangler d1 create と database_id 設定が必要）
```

## 開発ガイドライン

開発フロー・ブランチ戦略・コミット/PR 規約は [`AGENTS.md`](./AGENTS.md) を参照してください。
実装ロードマップは GitHub Issues（マイルストーン Phase 0〜4）と Epic Issue に整理されています。
