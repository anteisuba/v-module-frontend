# 数据库与基础设施

- 日本語: [データベースと基盤](../../ja/development/database-and-infra.md)
- 最后更新: 2026-03-11

## 用途

汇总数据库模型、迁移方式、会话基础设施、对象存储与支付运维相关基础设施。

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

### 用户与页面配置

- `User`
- `Page`
- `UserPasswordResetToken`

### 内容与媒体

- `MediaAsset`
- `NewsArticle`
- `BlogPost`
- `BlogLike`
- `BlogComment`
- `Product`

### 订单与支付

- `Order`
- `OrderItem`
- `OrderPaymentAttempt`
- `OrderRefund`
- `OrderDispute`

### 收款与结算

- `SellerPayoutAccount`
- `PaymentSettlementPayout`
- `PaymentSettlementEntry`

## 当前迁移状态

- 仓库内已有 `13` 个 Prisma migration 目录
- 最近一批 migration 已补入 Stripe 结算流水账和卖家收款账户 / Connect 路由字段
- `pnpm db:migrate` 是默认迁移入口
- 变更 `schema.prisma` 后应先 `prisma generate`，再验证 route handler、seed 和文档是否同步

## Seed 基线

- `prisma/seed.ts` 会创建测试账号 `test@example.com / 123456`
- Seed 会同时创建默认 slug `testuser` 和默认页面配置

## 基础设施约束

- 会话依赖 `SESSION_PASSWORD`
- 数据库默认使用 PostgreSQL
- 生产环境建议配置 `DIRECT_URL` 以支持迁移
- 上传能力依赖 R2 或本地文件系统
- Stripe Checkout / Webhook / Connect / 对账同步依赖对应的 Stripe 密钥与 webhook 配置
- `Decimal`、`Date`、`Json` 在 API 返回时都需要显式序列化；订单、退款、争议、结算等接口已经遵循这个约束

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
