# 当前状态

- 日本語: [現状](../../ja/overview/current-status.md)
- 最后更新: 2026-03-11

## 用途

用一页文档回答三个问题：项目现在真实做到了什么、哪些地方只是部分完成、接下来最缺什么。

## 适用范围

- 功能评估
- 新人接手
- 需求排期前的基线确认

## 来源依据

- `pnpm build`
- `pnpm check`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`
- `git ls-files`
- 路由、API、Prisma 模型与主要页面代码

## 相关链接

- [项目概览](./project-overview.md)
- [后续待办](./backlog.md)
- [优化报告](./optimization-report.md)
- [路由与 API](../development/routes-and-api.md)

## 命令审计结果

- `pnpm build`：通过；`middleware -> proxy`、`prisma.config.ts` 迁移和本地构建 warning 已清理，当前为标准 build 输出
- `pnpm check`：通过
- `pnpm test`：通过，当前为 `27` 个文件 `81` 个测试
- `pnpm test:e2e`：通过，当前为 `11` 个 Chromium 场景
- `pnpm lint`：通过，当前为 `0 errors / 0 warnings`
- 自动化测试文件：仓库内已存在 `Vitest + Playwright` 规格，并已实际执行覆盖认证、页面配置、媒体库、公开内容、Shop 公开结账、订单详情 / 退款 / 导出、Stripe Checkout / Webhook / Connect / 对账 / 结算、内部定时同步和 payout onboarding 回流等场景
- Prisma migration 目录：当前为 `13` 个

## 已完成

- 用户系统：注册、登录、退出、密码重置、后台鉴权中间件
- 页面配置系统：草稿与发布版本分离，公开页读取发布配置；历史 `links` section 会在读写和渲染时自动清洗
- 后台编辑骨架：CMS、博客、商店列表 / 详情页已统一为 tab + 单开折叠面板结构
- 公开页：`/u/[slug]` 支持主题色、字体、背景、Hero、News、Video 等配置渲染
- 公开入口：`/blog`、`/shop` 已改为全站公开内容入口，不再依赖固定用户 slug
- 新闻系统：新闻列表页、详情页、后台编辑与发布接口
- 博客系统：后台列表 / 编辑、公开列表 / 详情、点赞接口、评论接口与前端 UI
- 评论审核：`BlogComment` 已支持 `PENDING / APPROVED / REJECTED`，访客评论默认进入待审核，卖家后台可搜索、审核和删除
- 商店系统：后台商品管理、公开商品列表 / 详情、公开结账、订单成功页访客查询、卖家订单列表 / 详情 / 状态更新
- 退款与争议：订单已记录 `OrderPaymentAttempt`、`OrderRefund`、`OrderDispute`，后台可对 Stripe 已支付订单发起退款并查看 dispute 时间线
- Stripe Checkout：`POST /api/shop/checkout` 会创建托管 Checkout Session；公开结账页跳转到 Stripe 支付页
- Stripe Webhook：`POST /api/payments/stripe/webhook` 已处理支付成功、异步失败、会话过期和 dispute，并回写订单支付状态与库存补偿
- 支付对账：后台已提供 Stripe 对账页，可查看事件、异常、导出 CSV，并按异常跳转到订单
- 结算核销：后台已提供 Stripe 结算核销页，可同步 `balance transactions` / `payouts`、查看 payout 汇总并批量标记核销状态
- Stripe Connect：已提供卖家收款账户模型、onboarding / dashboard link / account sync API、`/admin/settings/payouts` 页面，以及 destination charge 与 `PLATFORM` fallback 路由
- Connect 运维可见性：后台订单详情、对账页和结算页已展示 `paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net 等快照字段
- 自动定时同步：已提供内部 cron 路由，可按卖家批量同步 Stripe 结算流水、payout 和 dispute 数据
- 订单通知：Stripe 支付确认后会向买家发送确认邮件、向卖家发送新订单提醒；订单状态更新时会向买家发送状态变更邮件
- 媒体库：后台已提供统一媒体库页面，支持复用、按使用场景筛选、批量选择、删除保护、引用追踪、库内直接替换引用资源与批量标签维护
- 媒体上传：后台上传接口、本地文件系统与 R2 分支、`MediaAsset` 数据记录
- 国际化基础：存在 `zh`、`ja`、`en` 文案文件与语言切换器

## 部分完成 / 存在缺口

- 当前支付正式路线仍是 Stripe 单一通道；PayPal / 本地支付方式已明确后置
- Stripe Connect 主链路已可用，但更细粒度的运营筛选、告警和更广泛的浏览器回归仍可继续增强
- 工程基线已进入“可构建 / 可检查 / 可测试 / 可跑 e2e”的稳定态，但 Playwright 仍主要是本地单 worker、单浏览器执行，尚未形成 CI / 多浏览器回归矩阵

## 未实现

- 购物车与多商品结账
- 库存预警
- Turnstile / 验证码
- 直播日程 `ScheduleBlock`
- PayPal / 本地支付方式
- 更完整的 SEO、监控、日志和错误追踪

## 当前结论

这已经是一个“公开页 + CMS + 内容 + 商店订单 + Stripe 支付运维”都已成型的项目，不应再按原型判断。下一阶段重点应该放在 Playwright 持续执行、Stripe Connect 运维闭环打磨和更广泛的回归覆盖，而不是把媒体库、warning 清理或 PayPal 重新误判成当前最高优先级。
