# 当前状态

- 日本語: [現状](../../ja/overview/current-status.md)
- 最后更新: 2026-03-10

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
- `pnpm lint`
- `git ls-files`
- 路由、API、Prisma 模型与主要页面代码

## 相关链接

- [项目概览](./project-overview.md)
- [后续待办](./backlog.md)
- [优化报告](./optimization-report.md)
- [路由与 API](../development/routes-and-api.md)

## 命令审计结果

- `pnpm build`：当前 Windows 环境可能在 `prisma generate` 阶段触发 `EPERM` 锁文件错误；拆开执行 `pnpm prisma generate --no-engine` + `pnpm exec next build` 已通过
- `pnpm check`：通过
- `pnpm test`：通过
- `pnpm lint`：失败，`62 errors / 93 warnings`
- 自动化测试文件：已存在，覆盖认证、页面草稿保存/发布、CMS 浏览器层发布、CMS 发布到 `/u/[slug]` 的公开页回归、媒体库引用跳转替换、库内直接替换引用、媒体库批量标签维护、blog/news/shop 公开入口与详情页端到端回归、公开页读取、博客/商品/新闻后台编辑接口、Stripe Checkout 创建、Stripe 托管结账成功/取消回流浏览器链路、Stripe Webhook（含 dispute）、订单详情读取、订单列表筛选/导出、后台订单详情退款浏览器链路、退款路由、支付对账/结算核销接口、内部定时同步接口、邮件通知降级行为、博客评论公开/审核接口
- 迁移前文档数量：`33` 个 Markdown，其中 `31` 个位于 `document/`

## 已完成

- 用户系统：注册、登录、退出、密码重置、后台鉴权中间件
- 页面配置系统：草稿与发布版本分离，公开页读取发布配置
- 页面配置清理：`PageConfig.links` 已从 schema / types / 默认配置移除，历史 `links` section 会在读写和公开渲染时自动清洗
- 最小自动化测试基线：已接入 `vitest`，覆盖登录认证、公开页配置读取、公开结账订单创建
- 订单详情页：公开下单成功页已可基于 `orderId + buyerEmail` 读取并展示订单详情
- 卖家订单管理：后台订单列表已支持搜索、状态过滤和 CSV 导出，后台订单详情页已提供支付时间线、退款记录和手动退款入口
- Stripe Checkout：`POST /api/shop/checkout` 已改为创建 Stripe Checkout Session；公开结账页会跳转到 Stripe 托管支付页
- Stripe Webhook：`POST /api/payments/stripe/webhook` 已处理支付成功、异步失败和会话过期，并回写订单支付状态与库存补偿
- Stripe 退款基础设施：订单已记录 `OrderPaymentAttempt` / `OrderRefund`，后台可对 Stripe 已支付订单发起部分退款或全额退款，并回写支付状态
- 支付对账：后台已提供 Stripe 对账页，可查看支付汇总、导出支付/退款事件 CSV、导出异常清单，并按异常跳转到具体订单
- 结算核销：后台已提供 Stripe 结算核销页，可同步 `balance transactions` / `payouts`、查看 payout 汇总、识别缺失结算流水，并批量标记核销状态
- dispute / chargeback：Stripe webhook 与后台订单详情已支持记录和展示 dispute 状态；支付对账会对待响应争议和败诉 chargeback 产生异常提示
- 自动定时同步：已提供内部 cron 路由，可按卖家批量同步 Stripe 结算流水、payout 和 dispute 数据
- 订单通知：Stripe 支付确认后会向买家发送确认邮件、向卖家发送新订单提醒；状态更新时会向买家发送状态变更邮件
- 后台编辑骨架：CMS、博客、商店列表/详情页已统一为 tab + 单开折叠面板结构
- 媒体库：后台已提供统一媒体库页面，支持复用、按使用场景筛选、批量选择、删除保护、引用追踪、库内直接替换引用资源、批量标签维护，以及跳转到具体编辑器替换入口
- 公开页：`/u/[slug]` 支持主题色、字体、背景、Hero、News、Video 等配置渲染
- 公开入口：`/blog`、`/shop` 已改为全站公开内容入口，不再依赖固定用户 slug
- 新闻系统：新闻列表页、详情页、后台编辑与发布接口
- 博客系统：后台列表/编辑、公开列表/详情、点赞接口、评论接口与前端 UI
- 评论审核：`BlogComment` 已引入 `PENDING / APPROVED / REJECTED` 状态，历史评论迁移后保持公开可见；访客评论默认进入待审核，卖家后台已可搜索、审核和删除评论
- 商店系统：后台商品管理、商店列表/商品详情背景编辑、公开商品列表/详情、公开结账接口 `POST /api/shop/checkout`、卖家订单列表、订单状态更新
- 媒体上传：后台上传接口、本地文件系统与 R2 分支、`MediaAsset` 数据记录
- 国际化基础：存在 `zh`、`ja`、`en` 文案文件与语言切换器

## 部分完成 / 存在缺口

- 当前支付仍只接入 Stripe 单一通道；虽然退款后台、基础对账页、结算核销页、争议处理和自动同步已具备闭环，但 PayPal / 本地支付方式和更深入的支付流程已暂时后置，保留为后续优化 TODO

## 未实现

- 购物车
- 库存预警
- Turnstile / 验证码
- 直播日程 `ScheduleBlock`

## 当前结论

这是一个“功能已成型、闭环未完全打磨、工程债务明显”的项目。后续开发应优先补齐功能矛盾和质量问题，再扩展新能力。
