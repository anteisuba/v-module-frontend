# 数据库与基础设施

- 日本語: [データベースと基盤](../../ja/development/database-and-infra.md)
- 最后更新: 2026-03-07

## 用途

汇总数据库模型、迁移方式、会话基础设施、对象存储与旧数据库文档的合并结果。

## 适用范围

- 数据模型理解
- 迁移执行
- 环境初始化

## 来源依据

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `prisma/seed.ts`
- `lib/session/userSession.ts`
- `prisma/supabase_sql_setup.sql`

## 相关链接

- [本地开发与命令](./setup-and-commands.md)
- [部署与环境变量](../operations/deployment-and-env.md)
- [文档迁移映射表](../reference/doc-migration-map.md)

## 当前 Prisma 模型

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

## 当前迁移状态

- 仓库内已有 `6` 个 Prisma 迁移目录
- `pnpm db:migrate` 是默认迁移入口
- `prisma/seed.ts` 会创建测试用户与默认页面配置

## 基础设施约束

- 会话依赖 `SESSION_PASSWORD`
- 数据库默认使用 PostgreSQL
- 生产环境建议配置 `DIRECT_URL` 以支持迁移
- 上传能力依赖 R2 或本地文件系统

## Supabase / RLS 补充

- 历史文档中有一组 RLS 与 Supabase 说明
- 当前代码并未建立强依赖的 Supabase Auth 方案
- 如果继续走 Supabase SQL 手动部署，可参考 `prisma/supabase_sql_setup.sql`
- 历史 RLS 建议只作为参考，不应覆盖当前 Prisma-first 工作流

## 本次合并来源

以下旧文档内容已并入本页或相邻当前文档：

- `DATABASE_SETUP.md`
- `DATABASE_CONNECTION.md`
- `DATABASE_CLEANUP_ANALYSIS.md`
- `DATABASE_CLEANUP_STEPS.md`
- `RLS_SETUP_GUIDE.md`
- `RUN_MIGRATION.md`
- `BLOG_PRODUCT_ORDER_SETUP.md`
- `NEW_TABLES_INFO.md`
