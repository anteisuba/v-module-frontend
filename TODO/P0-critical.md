# P0：阻断级问题

> 最后更新：2026-03-14

## 当前状态：✅ 无阻断项

经过前几轮迭代，主要阻断问题已全部解决：

- [x] 公开结账和订单 API 语义冲突 — 已拆分 `/api/shop/checkout` 和 `/api/shop/orders`
- [x] `/blog` `/shop` 公开入口依赖固定用户 slug — 已改为全站公开入口
- [x] 媒体库页面缺失 — 已提供统一后台媒体库
- [x] lint error 阻断构建 — 已清零
- [x] build / check / test / lint 基线全绿

## 监控项

以下情况如果发生，立即升级为 P0：

- `pnpm build` 或 `pnpm check` 失败
- Stripe Webhook 回调丢失导致订单状态不更新
- 认证中间件 (`proxy.ts`) 被绕过
- 数据库迁移执行失败
