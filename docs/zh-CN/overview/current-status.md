# 当前状态

- 日本語: [現状](../../ja/overview/current-status.md)
- 最后更新: 2026-03-14

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
- `pnpm test`：通过，当前为 `31` 个文件 `111` 个测试
- `pnpm test:e2e`：已存在 `11` 个 e2e 规格，当前配置会在 Chromium / Firefox / WebKit 三浏览器矩阵下执行
- `pnpm lint`：通过，当前为 `0 errors / 0 warnings`
- GitHub Actions：已新增 PR / push 持续集成，执行 `pnpm check`、`pnpm test`、`pnpm build`、`pnpm lint`，并以 Chromium / Firefox / WebKit 矩阵运行 Playwright；e2e 失败时会上传 `playwright-report` 与 `test-results`
- Vercel：生产部署与分支 Preview Deployments 已接入，可在 `main` 外的活跃分支上生成独立预览环境
- 自动化测试文件：仓库内已存在 `Vitest + Playwright` 规格，并已实际执行覆盖认证、权限边界、页面配置编辑与公开渲染链路、媒体库、公开内容、Shop 公开结账、订单详情 / 退款 / 导出、Stripe Checkout / Webhook / Connect / 对账 / 结算、内部定时同步和 payout onboarding 回流等场景
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
- 结算核销：后台已提供 Stripe 结算核销页，可同步 `balance transactions` / `payouts`、查看 payout 汇总，并按 payout 状态分组浏览流水后批量标记核销状态
- Stripe Connect：已提供卖家收款账户模型、onboarding / dashboard link / account sync API、`/admin/settings/payouts` 页面，以及 destination charge 与 `PLATFORM` fallback 路由；payout settings 页已补充资金流、推荐操作顺序、状态说明、onboarding 进度提示和异常状态引导
- Connect Webhook：`POST /api/payments/stripe/connect/webhook` 已对 `account.updated`、`account.external_account.*` 和 `payout.*` 做 Connect secret 验签，并可回写收款账户状态与 connected account 维度的 payout 快照
- Connect 运维可见性：后台订单详情、订单 CSV、对账页和结算页已展示或导出 `paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net 等快照字段；其中对账页已支持按 `routing mode` 和 `connected account` 过滤
- 部署交付：Vercel 已同时承载生产环境与分支预览环境，便于在合并前验证 Next.js 页面、API 和后台链路
- 自动定时同步：已提供内部 cron 路由，可按卖家批量同步 Stripe 结算流水、payout 和 dispute 数据
- 财务异常告警：内部 `stripe-finance-sync` 在发现支付对账 / 结算异常时，可向卖家邮箱发送告警，并可选发 Slack 汇总消息
- 测试夹具基线：已沉淀页面配置、会话和 Stripe 事件的共享 fixture / helper，减少高风险 API 与渲染测试中的重复 mock
- 订单通知：Stripe 支付确认后会向买家发送确认邮件、向卖家发送新订单提醒；订单状态更新时会向买家发送状态变更邮件
- 媒体库：后台已提供统一媒体库页面，支持复用、按使用场景筛选、批量选择、删除保护、引用追踪、库内直接替换引用资源与批量标签维护
- 媒体上传：后台上传接口、本地文件系统与 R2 分支、`MediaAsset` 数据记录
- 国际化基础：存在 `zh`、`ja`、`en` 文案文件与语言切换器

## 部分完成 / 存在缺口

- 当前支付正式路线仍是 Stripe 单一通道；PayPal / 本地支付方式已明确后置
- Stripe Connect 主链路已可用，当前剩余缺口主要转向 Connect 账户状态定期同步的健康检查日志和 dispute 证据提交流程
- 工程基线已进入“可构建 / 可检查 / 可测试 / 可跑 e2e / 可预览部署”的稳定态，且已接入 GitHub Actions、Vercel Preview 与 Chromium / Firefox / WebKit 持续执行；当前剩余缺口主要是是否引入 `changesets` 管理版本、更细的 flaky 治理和 Stripe Connect 运维闭环打磨

## 未实现

- 购物车与多商品结账
- 库存预警
- Turnstile / 验证码
- 直播日程 `ScheduleBlock`
- PayPal / 本地支付方式
- 更完整的 SEO、监控、日志和错误追踪

## 当前结论

这已经是一个“公开页 + CMS + 内容 + 商店订单 + Stripe 支付运维”都已成型的项目，不应再按原型判断。下一阶段重点应该放在 Stripe Connect 运维闭环打磨和更细粒度的 flaky 治理，而不是把媒体库、warning 清理或 PayPal 重新误判成当前最高优先级。
