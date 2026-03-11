# 优化报告

- 日本語: [改善レポート](../../ja/overview/optimization-report.md)
- 最后更新: 2026-03-11

## 用途

沉淀当前最需要处理的工程优化项，避免后续开发继续建立在脆弱基础之上。

## 适用范围

- 技术债治理
- 迭代前风险评估
- 代码健康度提升

## 来源依据

- `pnpm build`
- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`
- 关键页面与 API 抽样扫描

## 相关链接

- [当前状态](./current-status.md)
- [后续待办](./backlog.md)
- [系统架构](../architecture/system-architecture.md)

## P0：当前无新增阻断

- 本轮已修复公开结账 / 订单 API 的语义冲突、`/blog` `/shop` 固定 slug、媒体库缺失和 lint error 阻断
- 当前 `pnpm build`、`pnpm check`、`pnpm test`、`pnpm lint`、`pnpm test:e2e` 均可执行，未发现新的阻断级功能矛盾

## P1：持续执行与长期可维护性

- `pnpm lint` warning 和 `middleware` / Prisma 配置弃用项已清理完成，当前更重要的是守住新基线，不让工具噪音重新回流
- Playwright 场景已经覆盖 CMS、公开内容、订单与 Connect onboarding，且本轮已稳定执行 `11` 个 Chromium 场景；下一步是 CI 接入、多浏览器覆盖和夹具沉淀
- Stripe Connect 的 routing / account 快照已经进入后台订单、对账和结算视图，后续可继续补筛选、导出和异常告警，而不是回头优先做 PayPal

## P2：平台兼容层与后续增强

- 当前通过 `proxy.ts`、`prisma.config.ts` 以及脚本层 preload 兼容处理，保持 Next / Prisma / Playwright 输出干净；升级 Next / Browserslist 时需要复核并尝试移除这层兼容
- 部署环境仍需保持公网 HTTPS `NEXT_PUBLIC_BASE_URL`、R2、Stripe 等配置正确，当前本地构建不再对 `localhost / 127.0.0.1` 反复报伪生产警告

## 建议执行顺序

1. 先把 Playwright 持续执行和 CI / 多浏览器回归补上
2. 再继续打磨 Stripe Connect 运维视图
3. 最后推进购物车、库存预警、`ScheduleBlock`、SEO / 监控等新增能力
