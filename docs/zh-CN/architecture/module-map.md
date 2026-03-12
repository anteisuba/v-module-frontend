# 模块地图

- 日本語: [モジュールマップ](../../ja/architecture/module-map.md)
- 最后更新: 2026-03-07

## 用途

提供目录级地图，帮助开发者快速找到页面、服务、会话、数据库和共享组件的入口。

## 适用范围

- 文件定位
- 改动选点
- 代码审阅

## 来源依据

- `git ls-files`
- 顶层目录扫描

## 相关链接

- [系统架构](./system-architecture.md)
- [路由与 API](../development/routes-and-api.md)

## 目录职责表

| 路径 | 责任 | 代表文件 |
| --- | --- | --- |
| `app/` | 页面路由与 API 路由入口 | `app/u/[slug]/page.tsx`, `app/api/shop/orders/route.ts` |
| `components/ui/` | 编辑器和通用 UI 组件 | `CMSHeader.tsx`, `NewsArticleEditor.tsx` |
| `components/blog/` | 博客后台编辑组件 | `BlogEditor.tsx` |
| `components/shop/` | 商品后台编辑组件 | `ProductEditor.tsx` |
| `features/home-hero/` | 首页 Hero 展示与菜单逻辑 | `HomeHero.tsx`, `useHeroMenu.ts` |
| `features/page-renderer/` | 公开页 section 渲染器 | `PageRenderer.tsx`, `registry.tsx` |
| `features/blog/` | 博客公开列表与详情 | `BlogList.tsx`, `BlogDetail.tsx` |
| `features/shop/` | 商店公开列表与详情 | `ProductList.tsx`, `ProductDetail.tsx` |
| `features/video-section/` | 视频播放器与 URL 解析 | `VideoPlayer.tsx`, `urlParser.ts` |
| `domain/page-config/` | 页面配置常量、类型、查询服务 | `services.ts`, `types.ts` |
| `domain/news/` | 新闻领域服务 | `services.ts` |
| `domain/blog/` | 博客领域服务 | `services.ts` |
| `domain/shop/` | 商品与订单领域服务 | `services.ts` |
| `lib/api/` | 浏览器端 API 客户端封装 | `client.ts`, `endpoints.ts` |
| `lib/session/` | 用户会话配置与读取 | `userSession.ts` |
| `lib/context/` | 用户、Toast、检查器上下文 | `UserContext.tsx`, `ToastContext.tsx` |
| `lib/env.ts` | 环境变量校验 | `lib/env.ts` |
| `prisma/` | schema、迁移、seed、辅助 SQL | `schema.prisma`, `seed.ts` |

## 关键入口

- 公开主页入口：`app/u/[slug]/page.tsx`
- 后台首页入口：`app/admin/dashboard/page.tsx`
- CMS 编辑器入口：`app/admin/cms/page.tsx`
- 订单 API 入口：`app/api/shop/orders/route.ts`
- 会话守卫入口：`proxy.ts`

## 当前边界提醒

- 页面层与 API 层不完全一致，有些逻辑仍直接落在 route 文件里
- `components/ui/` 较重，既包含通用控件，也包含业务编辑器
- `features/` 与 `domain/` 已有初步分层，但还没有彻底统一
