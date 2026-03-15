# AGENTS.md

## Why

- 这是一个“多租户创作者公开页 + 后台 CMS”项目，目标是让单个用户用一套后台维护自己的主页、新闻、博客和商店
- 当前已经不是纯原型：认证、公开页配置、内容管理、商品和订单基础链路已落地
- 当前阶段重点不是继续堆功能，而是先修闭环矛盾、减少工程债、补最小测试基线

## Map

- `app/`: Next.js 页面路由和 API 路由入口
- `features/`: 面向用户功能块和公开页渲染逻辑
- `domain/`: 业务服务、类型和查询逻辑
- `components/`: 后台编辑器和共享 UI
- `lib/`: 会话、环境变量、上下文、客户端封装、工具函数
- `prisma/`: schema、迁移、seed、辅助 SQL
- `docs/`: 正式长文档层
- `.agents/skills/`: 可复用 AI 工作模式

关键入口：

- 公开页：[`app/u/[slug]/page.tsx`](./app/u/[slug]/page.tsx)
- 后台首页：[`app/admin/dashboard/page.tsx`](./app/admin/dashboard/page.tsx)
- CMS：[`app/admin/cms/page.tsx`](./app/admin/cms/page.tsx)
- 卖家订单 API：[`app/api/shop/orders/route.ts`](./app/api/shop/orders/route.ts)
- 公开结账 API：[`app/api/shop/checkout/route.ts`](./app/api/shop/checkout/route.ts)
- 会话守卫：[`proxy.ts`](./proxy.ts)

危险区域：

- 认证和会话：[`lib/session/CLAUDE.md`](./lib/session/CLAUDE.md)
- 页面配置：[`domain/page-config/CLAUDE.md`](./domain/page-config/CLAUDE.md)
- 订单和商店 API：[`app/api/shop/CLAUDE.md`](./app/api/shop/CLAUDE.md)
- 数据模型和迁移：[`prisma/CLAUDE.md`](./prisma/CLAUDE.md)

优先阅读：

- AI 摘要：[`docs/zh-CN/agent/repo-brief.md`](./docs/zh-CN/agent/repo-brief.md)
- AI 地图：[`docs/zh-CN/agent/repo-map.md`](./docs/zh-CN/agent/repo-map.md)
- AI 工作流：[`docs/zh-CN/agent/workflows.md`](./docs/zh-CN/agent/workflows.md)
- 继续旧任务前：如果根目录存在 `*-handoff.md`，先读日期最新的一份
- 长文档入口：[`docs/README.md`](./docs/README.md)
- 技能：[`review-checklist`](./.agents/skills/review-checklist/SKILL.md)、[`change-playbook`](./.agents/skills/change-playbook/SKILL.md)、[`repo-handoff`](./.agents/skills/repo-handoff/SKILL.md)

## Rules

- 不要把根文档写成知识堆。短入口放在这里，长解释放到 `docs/` 或局部 `CLAUDE.md`
- 继续未完成任务时，先核对最新 `*-handoff.md`、`git status --short` 和 `git diff --stat`
- 改认证逻辑时，同时检查 `proxy.ts`、`lib/session/`、相关 API 路由和登录后的跳转行为
- 改页面配置时，同时检查类型、Zod 校验、CMS 编辑器、渲染器和现状文档
- 改商店 / 订单时，先分清“卖家后台管理”与“访客公开下单”两种语义；不要再把公开结账写回 `/api/shop/orders`
- 改 Prisma 时，只新增 migration，不手改旧 migration；`Decimal`、`Date`、`Json` 在 API 返回时都要显式处理
- 改产品能力或现状判断时，同步更新 [`docs/zh-CN/overview/current-status.md`](./docs/zh-CN/overview/current-status.md) 和必要的 backlog 摘要
- 当前最低验证基线：TypeScript / React / API 改动跑 `pnpm check`；Prisma 改动补迁移上下文自检；文档改动做链接和路径自检；`pnpm lint` 仅作参考

## Workflows

### 页面和 UI 改动

1. 先读 [`docs/zh-CN/agent/repo-map.md`](./docs/zh-CN/agent/repo-map.md) 和相关局部 `CLAUDE.md`
2. 确认改动落在 `app/`、`features/`、`components/` 还是 `domain/page-config/`
3. 如果改到 section 或公开页行为，同步检查配置类型、编辑器和渲染器
4. 运行 `pnpm check`

### API 和业务逻辑改动

1. 同时看 route handler 和对应 `domain/*` 服务
2. 明确权限边界、输入校验和返回序列化
3. 如果触及订单或会话，优先看对应局部 `CLAUDE.md`
4. 运行 `pnpm check`

### Prisma 改动

1. 先看 [`prisma/CLAUDE.md`](./prisma/CLAUDE.md)
2. 修改 `schema.prisma` 后新增 migration，不覆写历史 migration
3. 检查 `seed.ts`、依赖该模型的 route handler 和文档是否需要同步
4. 对 `Decimal`、`Json`、关系字段的序列化做一次人工核对

### 文档改动

1. 根 `AGENTS.md` 只保留摘要和跳转
2. `docs/` 维护正式长文档，`docs/zh-CN/agent/` 维护 AI 快速上下文
3. 新增行为、缺口状态或优先级变化时，更新 canonical 文档而不是额外复制一份 TODO
