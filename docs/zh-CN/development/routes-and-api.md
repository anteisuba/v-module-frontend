# 路由与 API

- 日本語: [ルートと API](../../ja/development/routes-and-api.md)
- 最后更新: 2026-03-07

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
| `/u/[slug]/shop/order-success/[orderId]` | 订单成功占位页 |
| `/blog` | 当前硬编码重定向到 `/u/xiuruisu/blog` |
| `/shop` | 当前硬编码重定向到 `/u/xiuruisu/shop` |

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

### 新闻

- `GET /api/news`
- `GET/POST /api/news/articles`
- `GET/PUT/DELETE /api/news/articles/[id]`

### 博客

- `GET/POST /api/blog/posts`
- `GET/PUT/DELETE /api/blog/posts/[id]`
- `GET/POST /api/blog/posts/[id]/comments`
- `GET/POST /api/blog/posts/[id]/like`

### 商店与订单

- `GET/POST /api/shop/products`
- `GET/PUT/DELETE /api/shop/products/[id]`
- `POST /api/shop/checkout`
- `GET /api/shop/orders`
- `PUT /api/shop/orders/[id]`

## 权限注意事项

- `middleware.ts` 保护所有 `/admin/*`，但登录、注册、忘记密码、重置密码例外
- 公开博客评论与点赞支持匿名场景
- `POST /api/shop/checkout` 面向访客公开结账，不要求登录态
- `/api/shop/orders*` 只保留卖家后台订单列表和状态管理语义
