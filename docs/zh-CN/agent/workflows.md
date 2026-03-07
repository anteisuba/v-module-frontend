# 工作流

- 最后更新：2026-03-07
- 角色：AI / 代理在本仓库做常见改动时的执行顺序
- 正式来源：[`../../../CLAUDE.md`](../../../CLAUDE.md)、各局部 `CLAUDE.md`

## 新增或修改公开页面 / section

1. 先读 [`../../../domain/page-config/CLAUDE.md`](../../../domain/page-config/CLAUDE.md)
2. 确认改动属于页面配置、公开渲染、后台编辑器还是公共样式
3. 如果触及 section 类型，同步检查：
   - `domain/page-config/types.ts`
   - `lib/validation/pageConfigSchema.ts`
   - `features/page-renderer/registry.tsx`
   - 对应 CMS 编辑器
4. 运行 `pnpm check`
5. 如果行为边界变化，更新 [`../overview/current-status.md`](../overview/current-status.md)

## 修改 API 或业务服务

1. 同时阅读 route handler 和对应 `domain/*` 服务
2. 明确权限边界、输入校验、序列化责任、错误码
3. 如果是订单或认证逻辑，优先看局部 `CLAUDE.md`
4. 运行 `pnpm check`
5. 如果改动影响产品闭环或已知缺口，更新 [`../overview/current-status.md`](../overview/current-status.md) 或 [`../overview/backlog.md`](../overview/backlog.md)

## 修改 Prisma schema 或数据关系

1. 先读 [`../../../prisma/CLAUDE.md`](../../../prisma/CLAUDE.md)
2. 修改 `schema.prisma` 时新增 migration，不改历史 migration
3. 检查是否需要同步：
   - `prisma/seed.ts`
   - 相关 route handler 的 `Decimal` / `Date` / `Json` 序列化
   - 相关长文档
4. 运行 `pnpm check`
5. 如果本次不执行 migration，也要在交付说明里明确这一点

## 修改上传、环境变量或会话

1. 上传链路先看 `app/api/page/me/upload/route.ts` 和 `lib/env.ts`
2. 会话链路先看 [`../../../lib/session/CLAUDE.md`](../../../lib/session/CLAUDE.md) 和 `middleware.ts`
3. 任何环境变量或存储策略变化，都要确认开发环境与部署环境是否行为一致
4. 运行 `pnpm check`

## 仅改文档

1. 根 `CLAUDE.md` 只放摘要和跳转，不灌长文
2. `docs/zh-CN/agent/*` 只做 AI 快速上下文，不复制 canonical backlog
3. `docs/zh-CN/*` 和 `docs/ja/*` 继续承担正式长文档角色
4. 做相对链接和路径自检

## 当前验证矩阵

- TypeScript / React / API：至少 `pnpm check`
- Prisma / schema / migration：`pnpm check` + 迁移上下文自检
- 文档：链接和路径自检
- `pnpm lint`：仅参考，不作为当前硬门禁
