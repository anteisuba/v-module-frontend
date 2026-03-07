# 仓库地图

- 最后更新：2026-03-07
- 角色：AI / 代理的目录地图和危险区域索引
- 正式来源：[`../architecture/module-map.md`](../architecture/module-map.md)、[`../development/routes-and-api.md`](../development/routes-and-api.md)

## 顶层目录

| 路径 | 职责 | 备注 |
| --- | --- | --- |
| `app/` | 页面路由和 API 路由入口 | 公开页、后台页、`app/api/*` 都在这里 |
| `features/` | 用户可见功能块 | 包括首页 Hero、新闻轮播、公开页渲染器等 |
| `domain/` | 业务服务和类型 | 页面配置、新闻、博客、商店 |
| `components/` | 后台编辑器和共享 UI | `components/ui/` 里混有通用控件和业务编辑器 |
| `lib/` | 会话、环境变量、上下文、API 客户端、工具函数 | 认证和上传相关约束都在这里汇聚 |
| `prisma/` | schema、迁移、seed、辅助 SQL | 数据模型变更必须先看这里 |
| `docs/` | 正式长文档 | 人类主文档层 |
| `.claude/` | AI 结构层 | skills、hooks 和局部规则补充 |

## 关键入口

- 公开主页：[`../../../app/u/[slug]/page.tsx`](../../../app/u/[slug]/page.tsx)
- 后台首页：[`../../../app/admin/dashboard/page.tsx`](../../../app/admin/dashboard/page.tsx)
- CMS：[`../../../app/admin/cms/page.tsx`](../../../app/admin/cms/page.tsx)
- 卖家订单 API：[`../../../app/api/shop/orders/route.ts`](../../../app/api/shop/orders/route.ts)
- 公开结账 API：[`../../../app/api/shop/checkout/route.ts`](../../../app/api/shop/checkout/route.ts)
- 会话守卫：[`../../../middleware.ts`](../../../middleware.ts)

## 关键数据流

### 公开页渲染

1. 访问 `/u/[slug]`
2. `domain/page-config` 读取用户和 `publishedConfig`
3. `ThemeProvider` 注入主题色和字体
4. `features/page-renderer` 按 section 类型分发渲染

### 后台编辑和发布

1. 访问 `/admin/*`
2. `middleware.ts` 检查 `iron-session`
3. 前端通过 `lib/api` 调用 `app/api/*`
4. API 写回 `Page.draftConfig` 或其它内容表
5. 发布时把 `draftConfig` 复制到 `publishedConfig`

### 商店和订单

1. 卖家在后台维护商品
2. 访客在公开商店浏览商品和结账页
3. `POST /api/shop/checkout` 作为访客公开结账入口创建订单
4. `domain/shop/services.ts` 在事务里创建订单、订单项并扣库存

## 高风险区域

- 认证和后台保护：[`../../../lib/session/CLAUDE.md`](../../../lib/session/CLAUDE.md)
- 页面配置和 section 一致性：[`../../../domain/page-config/CLAUDE.md`](../../../domain/page-config/CLAUDE.md)
- 订单 / 商品 API 语义：[`../../../app/api/shop/CLAUDE.md`](../../../app/api/shop/CLAUDE.md)
- Prisma 关系、`Json` 和 `Decimal`：[`../../../prisma/CLAUDE.md`](../../../prisma/CLAUDE.md)

## 需要优先核对的文件

- [`../../../middleware.ts`](../../../middleware.ts)
- [`../../../lib/session/userSession.ts`](../../../lib/session/userSession.ts)
- [`../../../domain/page-config/types.ts`](../../../domain/page-config/types.ts)
- [`../../../lib/validation/pageConfigSchema.ts`](../../../lib/validation/pageConfigSchema.ts)
- [`../../../features/page-renderer/registry.tsx`](../../../features/page-renderer/registry.tsx)
- [`../../../domain/shop/services.ts`](../../../domain/shop/services.ts)
- [`../../../app/api/shop/orders/route.ts`](../../../app/api/shop/orders/route.ts)
- [`../../../app/api/page/me/upload/route.ts`](../../../app/api/page/me/upload/route.ts)
- [`../../../prisma/schema.prisma`](../../../prisma/schema.prisma)
