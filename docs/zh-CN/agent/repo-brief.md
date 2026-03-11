# 仓库摘要

- 最后更新：2026-03-11
- 角色：AI / 代理的快速项目概览，不替代正式长文档
- 正式来源：[`../overview/project-overview.md`](../overview/project-overview.md)、[`../overview/current-status.md`](../overview/current-status.md)

## 一句话定位

这是一个基于 Next.js App Router 的多租户创作者站点系统，当前已经覆盖公开页、后台 CMS、新闻、博客、评论审核、商店订单，以及 Stripe 支付 / 对账 / 结算 / Connect 运维链路。

## 目标和边界

- 目标：让单个创作者通过一套后台维护自己的公开主页、内容模块和商店
- 当前产品边界：认证、页面配置、新闻、博客、评论审核、商品、订单、媒体库、Stripe Checkout / Webhook / 退款 / 对账 / 结算 / Connect 已落地
- 当前不应误判为已完成的能力：购物车、多支付通道、库存预警、Turnstile / 验证码、`ScheduleBlock`、更完整的 SEO / 监控 / 日志

## 当前能力

- 用户注册、登录、退出、密码重置
- `/u/[slug]` 配置驱动公开页
- 页面配置读写会自动清理 legacy `links` section，不再留下空白公开卡片
- 已接入 `Vitest + Playwright` 测试文件；当前 `pnpm test` 为 `27` 个文件 `81` 个测试通过，`pnpm test:e2e` 为 `11` 个 Chromium 场景通过
- 公开下单成功页已可读取订单详情，使用 `orderId + buyerEmail` 作为访客访问边界，并在需要时补做支付确认
- 卖家后台订单列表已支持搜索、状态过滤和 CSV 导出；订单详情页已展示支付时间线、退款记录和 Connect routing 快照
- 已接入 Stripe Checkout + Webhook：公开结账会创建 Checkout Session，支付成功后回写订单并触发邮件通知
- 已提供 Stripe 对账页、结算核销页、内部定时同步接口和 dispute 记录
- 已提供卖家 Stripe Connect payout settings、onboarding / sync / dashboard link API，以及 `PLATFORM` fallback
- 后台 CMS / 博客 / 商店编辑已统一为 tab + 折叠面板骨架，保留草稿保存和发布能力
- 新闻列表 / 详情 / 后台编辑
- 博客列表 / 详情 / 点赞 / 评论提交，评论默认进入审核队列；卖家后台可在 `/admin/comments` 审核与删除
- 商品管理、公开商品展示、公开结账下单、卖家订单管理
- 统一媒体库页面，支持筛选、引用追踪、库内替换和批量标签维护
- 媒体上传，本地文件系统和 Cloudflare R2 双分支

## 当前已知缺口

- Playwright 已稳定执行 Chromium 场景，但尚未形成 CI / 多浏览器回归矩阵
- Stripe Connect 运营视角仍可继续补 routing / account 维度筛选、告警和卖家后台说明
- 正式支付路线仍是 Stripe 单一通道；PayPal / 本地支付方式已后置

## AI 阅读顺序

1. [`./repo-map.md`](./repo-map.md)
2. [`./workflows.md`](./workflows.md)
3. 对应局部 `AGENTS.md`
4. 需要长解释时再回到 `docs/zh-CN/*`
