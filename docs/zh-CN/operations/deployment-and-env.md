# 部署与环境变量

- 日本語: [デプロイと環境変数](../../ja/operations/deployment-and-env.md)
- 最后更新: 2026-03-08

## 用途

提供当前推荐的部署拓扑、环境变量清单和生产注意事项。

## 适用范围

- 新环境部署
- 生产配置核对
- 运维交接

## 来源依据

- `env.example`
- `lib/env.ts`
- `next.config.ts`
- 构建日志与旧部署文档

## 相关链接

- [本地开发与命令](../development/setup-and-commands.md)
- [部署与投递历史](./deployment-and-delivery-history.md)

## 当前推荐拓扑

- 前端与 API：Vercel
- 数据库：PostgreSQL
- 邮件：Resend 优先，SMTP 备用
- 上传：Cloudflare R2，未配置时回退到本地文件系统

## 关键环境变量

### 必需

- `DATABASE_URL`
- `SESSION_PASSWORD`
- `NEXT_PUBLIC_BASE_URL`

### 邮件相关

- `RESEND_API_KEY`
- `RESEND_FROM`
- 或 SMTP 组合：
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASSWORD`
  - `SMTP_FROM`
- 财务异常邮件告警会复用以上邮件配置，直接发给对应卖家邮箱

### 运维告警

- `FINANCE_ALERT_SLACK_WEBHOOK_URL`（可选）

### 存储相关

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`（可选）

### 支付网关

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CURRENCY`（建议默认 `JPY`）

说明：当前代码已接入 Stripe Checkout，公开结账依赖 `STRIPE_SECRET_KEY`，Webhook 依赖 `STRIPE_WEBHOOK_SECRET`。`STRIPE_CURRENCY` 默认为 `JPY`。详见 [支付网关接入方案](../development/payment-gateway-plan.md)。

## 当前环境校验行为

- `lib/env.ts` 在服务端启动时验证环境变量
- 生产环境和 Vercel 环境会对错误配置直接抛错
- 缺少邮件、R2 或 Stripe 配置时会输出警告

## 部署注意事项

- 当前使用 `proxy.ts` 作为请求拦截入口；Next.js 16 下不要和 `middleware.ts` 并存
- 构建过程会执行 Prisma Client 生成
- 生产应启用 HTTPS 的 `NEXT_PUBLIC_BASE_URL`
- 上传、密码重置、订单通知邮件投递需要分别核对存储和邮件配置
- 部署 Stripe Checkout 时，需要保证 `NEXT_PUBLIC_BASE_URL` 指向公网 HTTPS 地址，并在 Stripe 后台配置 `POST /api/payments/stripe/webhook` 对应的 Webhook
- 如果需要把支付对账 / 结算异常汇总推送到团队频道，请配置 `FINANCE_ALERT_SLACK_WEBHOOK_URL`；未配置时仍会尝试向卖家邮箱发告警
