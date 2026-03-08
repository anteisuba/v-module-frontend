# 路由与 API

- 日本語: [ルートと API](../../ja/development/routes-and-api.md)
- 最后更新: 2026-03-08

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
- [支付网关接入方案](./payment-gateway-plan.md)

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
| `/u/[slug]/shop/order-success/[orderId]` | 订单成功 / 详情页 |
| `/blog` | 全站公开博客入口，聚合所有已发布博客 |
| `/shop` | 全站公开商品入口，聚合所有已发布商品 |

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
| `/admin/shop` | 商品列表 |
| `/admin/shop/new` | 新建商品 |
| `/admin/shop/[id]` | 编辑商品 |
| `/admin/orders` | 订单列表 |

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

### 商店与订单

- `GET/POST /api/shop/products`
- `GET/PUT/DELETE /api/shop/products/[id]`
- `POST /api/shop/checkout`
- `POST /api/payments/stripe/webhook`
- `GET /api/shop/orders`
- `GET /api/shop/orders/[id]`
- `PUT /api/shop/orders/[id]`

## 权限注意事项

- `middleware.ts` 保护所有 `/admin/*`，但登录、注册、忘记密码、重置密码例外
- 公开博客点赞支持匿名场景
- 公开博客评论支持匿名提交，但新评论默认进入 `PENDING` 审核；`GET /api/blog/posts/[id]/comments` 只返回 `APPROVED` 评论
- `GET /api/blog/comments` 与 `PUT/DELETE /api/blog/comments/[id]` 仅面向当前卖家自己的博客评论审核后台
- `POST /api/shop/checkout` 面向访客公开结账，不要求登录态；当前会预留订单、扣减库存并创建 Stripe Checkout Session，响应内返回 `checkoutUrl`
- `POST /api/payments/stripe/webhook` 处理 Stripe `checkout.session.completed`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`checkout.session.expired`
- Stripe 支付确认后才会发送买家确认邮件和卖家新订单提醒；Webhook 失败或会话过期会把订单标记为失败/过期并回补库存
- `GET /api/shop/orders` 支持卖家后台 `status` / `query` 过滤，并可通过 `export=csv` 导出当前筛选结果
- `GET /api/shop/orders/[id]` 支持卖家会话读取；访客公开读取时必须显式提供 `buyerEmail`
- `PUT /api/shop/orders/[id]` 更新状态后会向买家发送状态变更邮件；发信失败不会阻塞状态更新；Stripe 待支付订单不能在后台手工标记为 `PAID`
- `GET /api/shop/orders` 与 `PUT /api/shop/orders/[id]` 仍只保留卖家后台订单列表和状态管理语义
