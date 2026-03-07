# 文書移行マップ

- 简体中文: [文档迁移映射表](../../zh-CN/reference/doc-migration-map.md)
- 最終更新: 2026-03-07

## 目的

旧 `document/` 配下の各 Markdown が、どの新文書へ再編されたかを追跡できるようにします。

## 適用範囲

- 文書移行監査
- 履歴参照
- ドキュメント整理の追跡

## 参照根拠

- 移行前の `document/*.md`
- 今回作成した `docs/`

## 関連文書

- [プロジェクト概要](../overview/project-overview.md)
- [デプロイと環境変数](../operations/deployment-and-env.md)
- [実装履歴](../history/product-implementation-history.md)

## ルール

- `docs/` が唯一の正式入口
- 旧文書は「現行仕様 / 参考資料 / 履歴資料」に再編
- 中国語版と日本語版は同じパス構成で維持

## マップ

| 旧文書 | 新文書 | 状態 | 書き直し | 日本語版 |
| --- | --- | --- | --- | --- |
| `document/API_TEST_EXAMPLES.md` | `docs/ja/reference/api-test-examples.md` | 維持して再整理 | 要 | 完了 |
| `document/BLOG_PRODUCT_ORDER_SETUP.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/BLOG_SHOP_IMPLEMENTATION.md` | `docs/ja/history/product-implementation-history.md` | 履歴へ統合 | 要 | 完了 |
| `document/CLOUDFLARE_R2_SETUP.md` | `docs/ja/operations/deployment-and-env.md` | 統合 | 要 | 完了 |
| `document/DATABASE_CLEANUP_ANALYSIS.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/DATABASE_CLEANUP_STEPS.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/DATABASE_CONNECTION.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/DATABASE_SETUP.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/DEPLOYMENT_CHECKLIST.md` | `docs/ja/operations/deployment-and-env.md` | 統合 | 要 | 完了 |
| `document/DEPLOYMENT_GUIDE.md` | `docs/ja/operations/deployment-and-env.md` | 統合 | 要 | 完了 |
| `document/DEPLOYMENT_PLAN.md` | `docs/ja/operations/deployment-and-delivery-history.md` | 履歴化 | 要 | 完了 |
| `document/DOMAIN_NAME_SUGGESTIONS.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/HOW_TO_CHECK_DOMAIN_AVAILABILITY.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/MEDIA_ASSET_MIGRATION.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/MIGRATION_SUMMARY.md` | `docs/ja/history/product-implementation-history.md` | 履歴化 | 要 | 完了 |
| `document/NEW_TABLES_INFO.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/P0_IMPLEMENTATION_SUMMARY.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/P1_IMPLEMENTATION_SUMMARY.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/PAGE_ROUTES.md` | `docs/ja/development/routes-and-api.md` | 統合 | 要 | 完了 |
| `document/PUBLIC_PAGES_IMPLEMENTATION.md` | `docs/ja/history/product-implementation-history.md` | 履歴化 | 要 | 完了 |
| `document/RESEND_DOMAIN_VERIFICATION.md` | `docs/ja/operations/deployment-and-delivery-history.md` | 統合 | 要 | 完了 |
| `document/RESEND_QUICK_START.md` | `docs/ja/operations/deployment-and-env.md` | 統合 | 要 | 完了 |
| `document/RLS_SETUP_GUIDE.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/ROADMAP.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/RUN_MIGRATION.md` | `docs/ja/development/database-and-infra.md` | 統合 | 要 | 完了 |
| `document/SMTP_SETUP_GUIDE.md` | `docs/ja/operations/deployment-and-env.md` | 統合 | 要 | 完了 |
| `document/STRUCTURE_ANALYSIS.md` | `docs/ja/reference/structure-analysis-history.md` | 履歴化 | 要 | 完了 |
| `document/UX_DESIGN_GUIDELINES.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/UX_IMPLEMENTATION_EXAMPLES.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/UX_QUICK_START.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |
| `document/VIDEO_PLAYER_ANALYSIS_AND_PLAN.md` | `docs/ja/history/design-and-roadmap-history.md` | 履歴化 | 要 | 完了 |

## 非 Markdown ファイル

- `document/SUPABASE_SQL_SETUP.sql` は `prisma/supabase_sql_setup.sql` へ移動済み
