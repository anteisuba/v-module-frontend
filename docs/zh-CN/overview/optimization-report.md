# 优化报告

- 日本語: [改善レポート](../../ja/overview/optimization-report.md)
- 最后更新: 2026-03-07

## 用途

沉淀当前最需要处理的工程优化项，避免后续开发继续建立在脆弱基础之上。

## 适用范围

- 技术债治理
- 迭代前风险评估
- 代码健康度提升

## 来源依据

- `pnpm lint`
- `pnpm build`
- `pnpm check`
- 关键页面与 API 抽样扫描

## 相关链接

- [当前状态](./current-status.md)
- [后续待办](./backlog.md)
- [系统架构](../architecture/system-architecture.md)

## P0：正确性与一致性

- 订单链路矛盾：公开结账页面向访客，但订单创建 API 要求登录
- `PageConfig.links` 类型与实际渲染逻辑不一致，容易制造假能力
- 根级 `/blog`、`/shop` 硬编码 slug，会让部署和产品语义混乱

## P1：Lint 阻塞项

- 当前 `pnpm lint` 失败，结果为 `62 errors / 93 warnings`
- 主导错误类型是 `@typescript-eslint/no-explicit-any`，当前约 `43` 处
- 还存在多处 Hooks 调用顺序错误、render 中使用 `Math.random()` / `Date.now()`、effect 中同步 `setState`
- 典型风险文件集中在：
  - `components/ui/*`
  - `features/video-section/*`
  - `lib/api/endpoints.ts`
  - 若干 `app/api/*` 与 `app/u/*` 页面

## P2：可维护性问题

- 大量未使用变量和不完整依赖数组，说明页面组件正在积累边界漂移
- 后台与公开页存在重复样式和重复状态处理逻辑
- 历史文档长期与代码不一致，已通过本次文档重构统一收口

## 平台与工具警告

- `middleware.ts` 约定已被 Next.js 标记为过时，后续需要迁移到 `proxy`
- `package.json#prisma` 配置已被 Prisma 标记为弃用，后续应迁移到 `prisma.config.ts`
- `baseline-browser-mapping` 数据过旧，构建日志建议升级

## 建议执行顺序

1. 先修 P0 功能矛盾
2. 再清理会阻断 lint 的 Hooks / purity / any 问题
3. 最后推进支付、购物车、媒体库等新增能力
