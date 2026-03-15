# 路由与 API

- 日本語: [ルートと API](../../ja/development/routes-and-api.md)
- 最后更新: 2026-03-14

## 用途

集中说明当前公开路由、后台路由和 API 路由的真实入口与注意事项。

## 适用范围

- 页面排查
- 接口调用
- 权限分析

## 来源依据

- `app/**`
- `pnpm build` 产出的 route 列表

## 相关链接

- [系统架构](../architecture/system-architecture.md)
- [模块地图](../architecture/module-map.md)
- [当前状态](../overview/current-status.md)

## 公开页面

| 路由 | 说明 |
| --- | --- |
| `/` | 当前直接重定向到 `/admin` |
| `/news` | 新闻列表 |
| `/news/[id]` | 新闻详情 |
| `/u/[slug]` | 用户公开首页 |
| `/u/[slug]/blog` | 用户博客列表 |
| `/u/[slug]/blog/[id]` | 博客详情 |
| `/u/[slug]/shop` | 用户商店列表 |
| `/u/[slug]/shop/[id]` | 商品详情 |
| `/u/[slug]/shop/[id]/checkout` | 公开下单页 |
| `/u/[slug]/shop/order-success/[orderId]` | 订单成功 / 详情页，支持 `buyerEmail` 查询和 `session_id` 补确认 |
| `/blog` | 全站公开博客入口，聚合所有已发布博客 |
| `/shop` | 全站公开商品入口，聚合所有已发布商品 |

说明：`/test`、`/test/stripe-hosted` 是内部联调页面，不作为产品路由入口。

## 管理后台页面

| 路由 | 说明 |
| --- | --- |
| `/admin` | 登录页 |
| `/admin/register` | 注册页 |
| `/admin/forgot-password` | 忘记密码 |
| `/admin/reset-password` | 重置密码 |
| `/admin/dashboard` | 后台入口页 |
| `/admin/cms` | 公开页 CMS |
| `/admin/blog` | 博客列表 |
| `/admin/blog/new` | 新建博客 |
| `/admin/blog/[id]` | 编辑博客 |
| `/admin/comments` | 评论审核后台 |
| `/admin/media` | 统一媒体库 |
| `/admin/shop` | 商品列表 |
| `/admin/shop/new` | 新建商品 |
| `/admin/shop/[id]` | 编辑商品 |
| `/admin/orders` | 订单列表 |
| `/admin/orders/[id]` | 订单详情、退款和支付时间线 |
| `/admin/orders/reconciliation` | Stripe 支付对账页 |
| `/admin/orders/reconciliation/settlements` | Stripe 结算核销页 |
| `/admin/settings/payouts` | Stripe Connect 收款账户设置 |

## API 路由分组

### 用户与会话

- `POST /api/user/register`
- `POST /api/user/login`
- `POST /api/user/logout`
- `GET /api/user/me`
- `POST /api/user/forgot-password`
- `POST /api/user/reset-password`

### 页面配置

- `GET /api/page/[slug]`
- `GET /api/page/me`
- `PUT /api/page/me`
- `POST /api/page/me/publish`
- `POST /api/page/me/upload`

说明：页面配置读写链路会自动清理历史 `links` section，当前公开配置仅保留 `hero`、`gallery`、`news`、`video`。

### 新闻

- `GET /api/news`
- `GET/POST /api/news/articles`
- `GET/PUT/DELETE /api/news/articles/[id]`

### 博客

- `GET/POST /api/blog/posts`
- `GET/PUT/DELETE /api/blog/posts/[id]`
- `GET/POST /api/blog/posts/[id]/comments`
- `GET /api/blog/comments`
- `PUT/DELETE /api/blog/comments/[id]`
- `GET/POST /api/blog/posts/[id]/like`

### 媒体库

- `GET/PATCH/DELETE /api/media-assets`
- `POST /api/media-assets/replace`

### 商店与订单

- `GET/POST /api/shop/products`
- `GET/PUT/DELETE /api/shop/products/[id]`
- `POST /api/shop/checkout`
- `GET /api/shop/orders`
- `GET /api/shop/orders/[id]`
- `PUT /api/shop/orders/[id]`
- `POST /api/shop/orders/[id]/confirm`
- `POST /api/shop/orders/[id]/refunds`

### 支付、对账与 Connect

- `POST /api/payments/stripe/webhook`
- `POST /api/payments/stripe/connect/webhook`
- `POST /api/payments/connect/accounts`
- `GET /api/payments/connect/accounts/me`
- `GET/POST /api/payments/connect/accounts/onboarding-link`
- `POST /api/payments/connect/accounts/dashboard-link`
- `POST /api/payments/connect/accounts/sync`
- `GET /api/shop/payments/reconciliation`
- `GET/POST/PATCH /api/shop/payments/settlements`

### 内部任务

- `POST /api/internal/cron/stripe-finance-sync`

## 权限注意事项

- `proxy.ts` 保护所有 `/admin/*`，但登录、注册、忘记密码、重置密码例外
- 公开博客点赞支持匿名场景
- 公开博客评论支持匿名提交，但新评论默认进入 `PENDING` 审核；`GET /api/blog/posts/[id]/comments` 只返回 `APPROVED` 评论
- `GET /api/blog/comments` 与 `PUT/DELETE /api/blog/comments/[id]` 仅面向当前卖家自己的评论审核后台
- `GET/PATCH/DELETE /api/media-assets` 与 `POST /api/media-assets/replace` 仅面向卖家后台媒体库，支持引用追踪、标签维护和库内替换
- `POST /api/shop/checkout` 面向访客公开结账，不要求登录态；当前会预留订单、扣减库存并创建 Stripe Checkout Session，响应内返回 `checkoutUrl`
- `GET /api/shop/orders` 仅面向卖家后台，支持 `status`、`query` 与 `export=csv`；导出的 CSV 已带 `paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net 等 Connect 快照字段
- `POST /api/shop/orders/[id]/confirm` 面向公开订单成功页，用于在 webhook 延迟时通过 `session_id` 主动确认订单
- `GET /api/shop/orders/[id]` 支持卖家会话读取；访客公开读取时必须显式提供 `buyerEmail`
- `PUT /api/shop/orders/[id]` 与 `POST /api/shop/orders/[id]/refunds` 仅面向卖家后台；Stripe 待支付订单不能在后台手工标记为 `PAID`
- `POST /api/payments/stripe/webhook` 处理 Stripe `checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`checkout.session.expired` 和 dispute
- `POST /api/payments/stripe/connect/webhook` 与 `/api/payments/connect/accounts/*` 仅面向卖家 Stripe Connect 收款账户同步 / onboarding 流程；其中 Connect webhook 会先用 Connect secret 验签，再处理 `account.updated`、`account.external_account.*` 和 `payout.*`
- `GET /api/shop/payments/reconciliation` 与 `GET/POST/PATCH /api/shop/payments/settlements` 仅面向卖家后台支付运维；其中对账接口支持 `start`、`end`、`paymentRoutingMode`、`connectedAccountId` 和 `export=events|anomalies`，返回已带 `paymentRoutingMode`、connected account、charge / transfer、platform fee、seller net 等快照字段
- `POST /api/internal/cron/stripe-finance-sync` 是内部同步入口，不应暴露为公开业务 API；配置邮件与 `FINANCE_ALERT_SLACK_WEBHOOK_URL` 后，会在发现支付对账 / 结算异常时发送告警
