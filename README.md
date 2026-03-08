# v-module-frontend

`v-module-frontend` 是一个面向 VTuber / 创作者的多用户站点系统，基于 Next.js App Router 提供公开主页、后台 CMS、新闻、博客、商店和订单基础链路。

## 技术栈与前提

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL
- `iron-session`、Zod、`next-intl`
- Node.js `>=20`
- pnpm `>=8`

## 快速启动

1. `docker compose up -d`
2. 参考 [`env.example`](./env.example) 配置环境变量
3. `pnpm install`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

## 当前状态快照

- 2026-03-07 基线：`pnpm build` 通过，`pnpm check` 通过，`pnpm lint` 失败（`62 errors / 93 warnings`）
- 已覆盖链路：认证、公开页配置、新闻、博客、商品、订单基础流程、媒体上传
- 主要缺口：订单详情缺失、媒体库 UI 缺失、自动化测试缺失

## 文档入口

- 人类文档入口：[`docs/README.md`](./docs/README.md)
- AI 北极星入口：[`CLAUDE.md`](./CLAUDE.md)
- 中文项目概览：[`docs/zh-CN/overview/project-overview.md`](./docs/zh-CN/overview/project-overview.md)
- 中文当前状态：[`docs/zh-CN/overview/current-status.md`](./docs/zh-CN/overview/current-status.md)
- 中文开发命令：[`docs/zh-CN/development/setup-and-commands.md`](./docs/zh-CN/development/setup-and-commands.md)
- 中文后续待办：[`docs/zh-CN/overview/backlog.md`](./docs/zh-CN/overview/backlog.md)

## 文档分层说明

- `docs/` 是人类维护者的正式长文档层
- 根 [`CLAUDE.md`](./CLAUDE.md)、局部 `CLAUDE.md`、[`.claude/skills/`](./.claude/skills) 和 [`.claude/hooks/`](./.claude/hooks) 是 AI / 代理快速建立上下文的入口
- 旧 `document/` 目录已退役，现行说明以 `docs/` 和当前代码为准

Japanese readers should start from [`docs/README.md`](./docs/README.md).
