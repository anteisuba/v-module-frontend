# 文档迁移映射表

- 日本語: [文書移行マップ](../../ja/reference/doc-migration-map.md)
- 最后更新: 2026-03-07

## 用途

登记旧 `document/` 中每篇 Markdown 的新去向，保证删除旧目录后仍能追溯内容来源。

## 适用范围

- 文档迁移追踪
- 历史内容定位
- 文档审计

## 来源依据

- 迁移前 `document/*.md` 清单
- 本次 `docs/` 重构结果

## 相关链接

- [项目概览](../overview/project-overview.md)
- [部署与环境变量](../operations/deployment-and-env.md)
- [产品实现历史](../history/product-implementation-history.md)

## 迁移规则

- `docs/` 是唯一正式入口
- 旧文档按“当前规范 / 参考资料 / 历史记录”三类重组
- 日文版与中文版按相同路径镜像维护

## 映射表

| 原文档 | 新文档 | 状态 | 需重写 | 日文版 |
| --- | --- | --- | --- | --- |
| `document/API_TEST_EXAMPLES.md` | `docs/zh-CN/reference/api-test-examples.md` | 保留并收敛 | 是 | 已完成 |
| `document/BLOG_PRODUCT_ORDER_SETUP.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/BLOG_SHOP_IMPLEMENTATION.md` | `docs/zh-CN/history/product-implementation-history.md` | 合并为历史 | 是 | 已完成 |
| `document/CLOUDFLARE_R2_SETUP.md` | `docs/zh-CN/operations/deployment-and-env.md` | 合并 | 是 | 已完成 |
| `document/DATABASE_CLEANUP_ANALYSIS.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/DATABASE_CLEANUP_STEPS.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/DATABASE_CONNECTION.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/DATABASE_SETUP.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/DEPLOYMENT_CHECKLIST.md` | `docs/zh-CN/operations/deployment-and-env.md` | 合并 | 是 | 已完成 |
| `document/DEPLOYMENT_GUIDE.md` | `docs/zh-CN/operations/deployment-and-env.md` | 合并 | 是 | 已完成 |
| `document/DEPLOYMENT_PLAN.md` | `docs/zh-CN/operations/deployment-and-delivery-history.md` | 历史归档 | 是 | 已完成 |
| `document/DOMAIN_NAME_SUGGESTIONS.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/HOW_TO_CHECK_DOMAIN_AVAILABILITY.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/MEDIA_ASSET_MIGRATION.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/MIGRATION_SUMMARY.md` | `docs/zh-CN/history/product-implementation-history.md` | 历史归档 | 是 | 已完成 |
| `document/NEW_TABLES_INFO.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/P0_IMPLEMENTATION_SUMMARY.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/P1_IMPLEMENTATION_SUMMARY.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/PAGE_ROUTES.md` | `docs/zh-CN/development/routes-and-api.md` | 合并 | 是 | 已完成 |
| `document/PUBLIC_PAGES_IMPLEMENTATION.md` | `docs/zh-CN/history/product-implementation-history.md` | 历史归档 | 是 | 已完成 |
| `document/RESEND_DOMAIN_VERIFICATION.md` | `docs/zh-CN/operations/deployment-and-delivery-history.md` | 合并 | 是 | 已完成 |
| `document/RESEND_QUICK_START.md` | `docs/zh-CN/operations/deployment-and-env.md` | 合并 | 是 | 已完成 |
| `document/RLS_SETUP_GUIDE.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/ROADMAP.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/RUN_MIGRATION.md` | `docs/zh-CN/development/database-and-infra.md` | 合并 | 是 | 已完成 |
| `document/SMTP_SETUP_GUIDE.md` | `docs/zh-CN/operations/deployment-and-env.md` | 合并 | 是 | 已完成 |
| `document/STRUCTURE_ANALYSIS.md` | `docs/zh-CN/reference/structure-analysis-history.md` | 历史归档 | 是 | 已完成 |
| `document/UX_DESIGN_GUIDELINES.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/UX_IMPLEMENTATION_EXAMPLES.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/UX_QUICK_START.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |
| `document/VIDEO_PLAYER_ANALYSIS_AND_PLAN.md` | `docs/zh-CN/history/design-and-roadmap-history.md` | 历史归档 | 是 | 已完成 |

## 非 Markdown 附件

- `document/SUPABASE_SQL_SETUP.sql` 已迁移到 `prisma/supabase_sql_setup.sql`
