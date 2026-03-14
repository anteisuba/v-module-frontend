# 后续建议摘要

- 最后更新：2026-03-14
- 角色：AI / 代理视角的优先级摘要，不是 canonical backlog
- canonical backlog：[`../overview/backlog.md`](../overview/backlog.md)

## P0

- 当前无新增 P0；本轮已经把 `build / check / test / lint / test:e2e` 基线恢复到全绿

## P1

- Playwright 的 CI 接入、多浏览器矩阵、README badge 和一轮高风险测试扩面已落地；测试侧下一步优先做 flaky 治理和剩余高风险链路补测
- 把 Stripe Connect 作为当前正式路线继续补运维闭环，routing / account 维度筛选、结算分组、异常告警、订单 CSV Connect 字段导出、payout settings 说明和 onboarding 进度提示已落地；下一步优先做异常状态引导
- 升级 Next / Browserslist / Playwright 时复核当前 `scripts/` 兼容层，能删除就删除，不长期堆兼容脚本

## P2

- 购物车和多商品结账
- 库存预警
- 直播日程模块
- Turnstile / 验证码
- 更完整的 SEO、监控、日志和错误追踪

## 使用约束

- 不要再把媒体库、退款后台、支付对账写回 P1，它们已经是现状
- PayPal / 本地支付方式是后置项，不应抢在 Stripe Connect 运维闭环之前
- 如果要改正式优先级，请回到 [`../overview/backlog.md`](../overview/backlog.md)
