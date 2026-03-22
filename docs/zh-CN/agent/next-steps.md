# 后续建议摘要

- 最后更新：2026-03-23
- 角色：AI / 代理视角的优先级摘要，不是 canonical backlog
- canonical backlog：[`../overview/backlog.md`](../overview/backlog.md)

## P0

- 当前无新增 P0；本轮已经把 `build / check / test / lint / test:e2e` 基线恢复到全绿

## P1

- Stripe Connect 运维闭环已基本完成（对账、结算、告警、健康检查、dispute 证据提交均已落地）；测试侧下一步做 flaky 治理和剩余高风险链路补测
- SEO 基础设施：meta tags、Open Graph、sitemap.xml、robots.txt、动态 OG 图片（Phase B of NEXT-PHASE-PLAN）
- ScheduleBlock 直播日程模块：section 全链路（Phase C of NEXT-PHASE-PLAN）

## P2

- 购物车和多商品结账
- 库存预警
- 更完整的监控、日志和错误追踪

## 已完成（本轮）

- Cloudflare Turnstile 验证码接入（5 个公开入口）
- 视觉自由度系统（主题预设 + Section 变体 + Showcase）
- Dispute 证据提交流程（服务 + API + UI + 测试）

## 使用约束

- 不要再把 Stripe Connect 运维闭环写回 P1 首要任务，它已经完成
- PayPal / 本地支付方式是后置项
- 如果要改正式优先级，请回到 [`../overview/backlog.md`](../overview/backlog.md)
