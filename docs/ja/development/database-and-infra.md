# データベースと基盤

- 简体中文: [数据库与基础设施](../../zh-CN/development/database-and-infra.md)
- 最終更新: 2026-03-07

## 目的

データモデル、migration 方法、セッション基盤、ストレージ構成、旧 DB 文書の統合先をまとめます。

## 適用範囲

- データモデル理解
- migration 実行
- 環境初期化

## 参照根拠

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `prisma/seed.ts`
- `lib/session/userSession.ts`
- `prisma/supabase_sql_setup.sql`

## 関連文書

- [ローカル開発とコマンド](./setup-and-commands.md)
- [デプロイと環境変数](../operations/deployment-and-env.md)
- [文書移行マップ](../reference/doc-migration-map.md)

## 現在の Prisma モデル

- `User`
- `Page`
- `UserPasswordResetToken`
- `MediaAsset`
- `NewsArticle`
- `BlogPost`
- `BlogLike`
- `BlogComment`
- `Product`
- `Order`
- `OrderItem`

## migration 状態

- リポジトリ内には `6` 件の Prisma migration がある
- 標準入口は `pnpm db:migrate`
- `prisma/seed.ts` がテストユーザーと初期ページ設定を作る

## 基盤上の制約

- セッションは `SESSION_PASSWORD` に依存
- DB は PostgreSQL 前提
- 本番 migration では `DIRECT_URL` の用意が望ましい
- アップロードは R2 かローカル filesystem に依存

## Supabase / RLS 補足

- 旧文書には Supabase と RLS の手動設定案が含まれていた
- 現在のコードは Prisma-first で運用されており、Supabase Auth 依存ではない
- 手動 SQL が必要な場合は `prisma/supabase_sql_setup.sql` を参照
- 旧 RLS 文書は参考止まりで、現行ワークフローを上書きしないこと

## 統合元

- `DATABASE_SETUP.md`
- `DATABASE_CONNECTION.md`
- `DATABASE_CLEANUP_ANALYSIS.md`
- `DATABASE_CLEANUP_STEPS.md`
- `RLS_SETUP_GUIDE.md`
- `RUN_MIGRATION.md`
- `BLOG_PRODUCT_ORDER_SETUP.md`
- `NEW_TABLES_INFO.md`
