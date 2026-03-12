# 系统架构

- 日本語: [システム構成](../../ja/architecture/system-architecture.md)
- 最后更新: 2026-03-07

## 用途

说明项目的运行层次、关键数据流和模块边界，帮助开发者快速定位改动入口。

## 适用范围

- 架构理解
- 新功能选点
- 问题排查

## 来源依据

- `app/**`
- `features/**`
- `domain/**`
- `lib/**`
- `prisma/schema.prisma`

## 相关链接

- [模块地图](./module-map.md)
- [路由与 API](../development/routes-and-api.md)
- [数据库与基础设施](../development/database-and-infra.md)

## 分层结构

- `app/`：Next.js App Router 页面和 API 入口
- `features/`：按用户可见功能拆分的渲染与交互层
- `domain/`：业务领域服务与类型
- `components/`：编辑器与共享 UI 组件
- `hooks/`：页面级与共享 hook
- `lib/`：会话、API 客户端、上下文、环境变量、工具函数
- `prisma/`：数据库 schema、迁移、seed、辅助 SQL

## 核心数据流

### 公开页渲染

1. 访问 `/u/[slug]`
2. `domain/page-config` 读取用户和 `publishedConfig`
3. `ThemeProvider` 注入主题色和字体
4. `features/page-renderer` 按 section 类型分发渲染
5. 补充新闻列表、博客或商店等公开内容

### 后台内容管理

1. 访问 `/admin/*`
2. `proxy.ts` 校验 `iron-session`
3. 页面通过 `lib/api` 调用对应 API 路由
4. API 路由落到 `domain/*` 或直接用 Prisma 查询
5. 草稿与发布状态写回 `Page` / 内容表

### 商店与订单

1. 卖家在后台维护商品与订单状态
2. 访客在公开商店浏览商品详情
3. 公开结账页尝试调用订单创建 API
4. 订单写入 `Order` 和 `OrderItem`
5. 当前链路仍存在访客下单与 API 鉴权不一致的问题

## 基础设施

- 会话：`iron-session` cookie
- 数据库：PostgreSQL + Prisma
- 邮件：Resend 或 SMTP
- 上传：Cloudflare R2，可回退到本地文件系统
- 国际化：`next-intl`

## 当前架构约束

- 管理后台与公开页面混在一个 App Router 项目中
- 部分 API 仍直接在 route 内使用 Prisma，领域封装不完全统一
- 配置驱动页面以 JSON 为核心，灵活但更依赖类型一致性
