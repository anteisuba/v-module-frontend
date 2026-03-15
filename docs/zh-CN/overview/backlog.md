# 后续待办

- 日本語: [バックログ](../../ja/overview/backlog.md)
- 最后更新: 2026-03-14

## 用途

将扫描结果转成可排期的开发清单，优先级按“先稳基线，再补运维闭环，最后扩新能力”组织。

## 适用范围

- 版本规划
- 开发排期
- 技术债治理

## 来源依据

- [当前状态](./current-status.md)
- `pnpm build`
- `pnpm lint` 输出
- 路由与 API、Stripe Connect 相关代码扫描

## 相关链接

- [当前状态](./current-status.md)
- [优化报告](./optimization-report.md)
- [路由与 API](../development/routes-and-api.md)

## P0：立即处理

- 当前无新增 P0；主链路已可构建、可检查、可测试

## P1：工程稳定性与 Stripe 运维闭环

- 把现有 Playwright 场景正式纳入持续执行：当前已接入 GitHub Actions，在 PR / push 上运行 `check / test / build / lint`，并以 Chromium / Firefox / WebKit 矩阵执行 `11` 个 e2e 规格；失败时会上传 Playwright 产物。README badge 和一轮高风险测试扩面已落地，测试侧下一步优先做 flaky 治理和剩余高风险链路补测
- 交付链路方面，Vercel 生产部署与 Preview Deployments 已接入；当前剩余决策主要是是否引入 `changesets` 统一版本记录和 release note，而不是继续补 Preview 基线
- 继续补强 Stripe Connect 运维视角；对账页的 routing / account 维度筛选、结算核销页按 payout 状态分组、异常邮件 / Slack 告警、订单 CSV Connect 字段导出、payout settings 说明、onboarding 进度提示、异常状态引导，以及 Connect webhook 对 `account.updated` / `account.external_account.*` / `payout.*` 的验签和 payout 快照回写都已经落地；下一步优先补 Connect 账户状态定期同步的健康检查日志和 dispute 证据提交流程，而不是切回 PayPal 优先级
- 维持当前脚本基线：继续使用 `scripts/run-node-tool.mjs`、`scripts/run-prisma-generate.mjs` 和对应 preload 兼容层，避免 Next / Playwright / Prisma 的工具噪音重新回流到主链路

## TODO：支付扩展

- 在 Stripe Connect 与现有运维闭环稳定后，再评估 PayPal / 本地支付方式和更深入的 dispute 证据提交流程

## P2：体验与增长

- 购物车与多商品结账
- 库存预警
- 直播日程模块
- Turnstile / 验证码
- 更完整的 SEO 和公共入口策略
- 更细粒度的监控、日志和错误追踪

## 文档维护要求

- 中文 `docs/zh-CN` 是 canonical，日文镜像需要同步更新
- 新增功能、命令审计结果或优先级变化时，优先更新 [当前状态](./current-status.md) 和本页
- 历史计划只放在 `history/` 或 `reference/`，不要再次回流到入口文档
