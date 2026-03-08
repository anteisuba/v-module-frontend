# 部署与环境变量

- 日本語: [デプロイと環境変数](../../ja/operations/deployment-and-env.md)
- 最后更新: 2026-03-07

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

### 存储相关

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`（可选）

## 当前环境校验行为

- `lib/env.ts` 在服务端启动时验证环境变量
- 生产环境和 Vercel 环境会对错误配置直接抛错
- 缺少邮件或 R2 时会输出警告

## 部署注意事项

- 当前仍使用 `middleware.ts`，后续需要迁移到 `proxy`
- 构建过程会执行 Prisma Client 生成
- 生产应启用 HTTPS 的 `NEXT_PUBLIC_BASE_URL`
- 上传、密码重置、邮件投递需要分别核对存储和邮件配置
