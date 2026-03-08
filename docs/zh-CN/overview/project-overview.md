# 项目概览

- 日本語: [プロジェクト概要](../../ja/overview/project-overview.md)
- 最后更新: 2026-03-07

## 用途

`v-module-frontend` 是一个面向 VTuber / 创作者的多用户站点系统。项目提供登录后台、可配置公开页、新闻、博客、商店和订单基础流程，目标是让单个用户用一套 CMS 维护自己的公开展示站。

## 适用范围

- 新接手项目的开发者
- 需要确认当前产品边界的维护者
- 需要快速判断哪些功能已落地、哪些仍是历史计划的人

## 来源依据

- `package.json`
- `app/**`
- `domain/**`
- `features/**`
- `lib/**`
- `prisma/schema.prisma`
- 2026-03-07 命令验证：`pnpm build`、`pnpm check`、`pnpm lint`

## 相关链接

- [当前状态](./current-status.md)
- [后续待办](./backlog.md)
- [系统架构](../architecture/system-architecture.md)
- [本地开发与命令](../development/setup-and-commands.md)

## 一句话定位

这是一个基于 Next.js App Router 的“多租户创作者主页 + 内容管理后台”项目，目前已经超过原型阶段，具备真实的内容管理和公开访问链路，但仍存在若干功能闭环缺口与工程质量欠账。

## 当前已覆盖的业务域

- 用户注册、登录、退出、密码重置
- 后台 CMS 草稿保存与发布
- `/u/[slug]` 公开页配置驱动渲染
- 新闻列表、新闻详情、新闻后台编辑
- 博客列表、详情、点赞、评论
- 商店商品管理、公开商品展示、基础下单、卖家订单管理
- 图片上传、本地存储 / Cloudflare R2 切换、`MediaAsset` 记录
- 中日英多语言基础设施

## 当前技术基线

- 前端框架：Next.js 16 + React 19
- 语言与构建：TypeScript、pnpm、Turbopack
- 数据层：Prisma + PostgreSQL
- 认证：`iron-session`
- 校验：Zod
- 国际化：`next-intl`
- 邮件：Resend 或 SMTP
- 对象存储：Cloudflare R2，可回退到本地文件系统

## 项目现阶段判断

- 功能完成度：中高。核心内容管理已能跑通。
- 工程健康度：中低。构建和类型检查通过，但 lint 问题较多。
- 文档状态：本次重构前分散且重复，已统一迁入 `docs/`。

## 建议阅读顺序

1. [系统架构](../architecture/system-architecture.md)
2. [模块地图](../architecture/module-map.md)
3. [本地开发与命令](../development/setup-and-commands.md)
4. [当前状态](./current-status.md)
5. [后续待办](./backlog.md)
