# 本地开发与命令

- 日本語: [ローカル開発とコマンド](../../ja/development/setup-and-commands.md)
- 最后更新: 2026-03-07

## 用途

提供能把项目跑起来的最短路径，并列出仓库当前实际可用的命令。

## 适用范围

- 新环境初始化
- 本地调试
- 构建与检查

## 来源依据

- `package.json`
- `env.example`
- `docker-compose.yml`
- `prisma/seed.ts`

## 相关链接

- [数据库与基础设施](./database-and-infra.md)
- [部署与环境变量](../operations/deployment-and-env.md)

## 前置要求

- Node.js `>=20`
- pnpm `>=8`
- PostgreSQL 16，或直接使用外部 PostgreSQL
- 可选：Docker Desktop

## 快速启动

1. 启动本地数据库
   - `docker compose up -d`
2. 复制并填写环境变量
   - 参考 `env.example`
3. 安装依赖
   - `pnpm install`
4. 运行迁移
   - `pnpm db:migrate`
5. 初始化测试用户
   - `pnpm db:seed`
6. 启动开发服务
   - `pnpm dev`

## 常用命令

- `pnpm dev`：启动开发服务器
- `pnpm build`：生成 Prisma Client 并执行生产构建
- `pnpm start`：启动生产构建产物
- `pnpm lint`：执行 ESLint
- `pnpm check`：执行 TypeScript 类型检查
- `pnpm db:migrate`：执行 Prisma 迁移
- `pnpm db:seed`：写入测试用户
- `pnpm db:studio`：打开 Prisma Studio
- `pnpm clear-rate-limit`：清理限流记录脚本

## 本地验证建议

- 打开 `/admin` 测试登录
- 打开 `/admin/cms` 测试草稿保存与发布
- 打开 `/u/testuser` 测试公开页渲染
- 执行 `pnpm build` 与 `pnpm check`

## 当前已知情况

- `pnpm build` 通过
- `pnpm check` 通过
- `pnpm lint` 当前不通过，不适合当作提交前唯一门禁
- `prisma/seed.ts` 会创建测试用户 `test@example.com / 123456 / testuser`
