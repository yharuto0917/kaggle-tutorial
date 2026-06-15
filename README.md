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

## 開発ガイドライン

開発フロー・ブランチ戦略・コミット/PR 規約は [`AGENTS.md`](./AGENTS.md) を参照してください。
実装ロードマップは GitHub Issues（マイルストーン Phase 0〜4）と Epic Issue に整理されています。
