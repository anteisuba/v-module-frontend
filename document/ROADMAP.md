# VTuber CMS 优化与开发路线图

基于现有代码库与 `UX_DESIGN_GUIDELINES.md` 的深度优化计划。

## 一、 UI/UX 体验优化 (优先级 P0)

### 1. 统一视觉与交互反馈

- **加载状态 (Loading States)**:
  - 目标：废除单纯的文本加载，遵循设计规范实现骨架屏。
  - 任务：在 `ProductList.tsx` 和 `NewsList.tsx` 中，图片加载前显示闪烁的 Skeleton 占位图。
- **反馈机制 (Toast)**:
  - 目标：不打断用户的操作流。
  - 任务：封装全局 Toast 组件（右上角弹出），替代 `alert()`。用于保存成功、发布成功、加入购物车等场景。

### 2. 增强品牌感 (Theming)

- **配置增强**: 在 `Page` Prisma 模型中增加 `themeColor` 和 `fontFamily` 字段。
- **动态样式**: 按钮、链接的高亮色需读取 `themeColor`，不再硬编码为黑白。

### 3. 移动端优先 (Mobile First)

- **底部导航 (Bottom Tab Bar)**: Public View (`/u/[slug]`) 在移动端增加固定底部导航（Home, Blog, Shop, Profile）。
- **操作热区**: 将“购买”、“点赞”按钮下移至屏幕底部 1/3 处。

## 二、 功能闭环 (优先级 P1)

### 1. 电商闭环 (Shop System)

- **购物车 (Cart)**: 实现 React Context 购物车，支持多商品添加。在 ProductList 增加 Add to Cart 按钮。
- **结账 (Checkout)**: 创建结账页，收集配送地址与邮箱，生成 `Order` 记录（暂用邮件通知/模拟支付）。

### 2. 社区互动 (Interaction)

- **点赞**: 实装 `BlogLike` API，前端增加粒子动画心形按钮。
- **评论**: 实装 `BlogComment` API，支持匿名评论 + Turnstile 验证。
- **审核**: Admin Dashboard 增加评论管理。

### 3. 日程表 (Schedule)

- 新增 `ScheduleBlock` 组件，在首页展示“本周直播表”。

### 4. 媒体库 (Media Library)

- 在编辑器中集成媒体库弹窗，复用 `MediaAsset` 记录。

## 三、 执行阶段 (Phasing)

- **阶段一 (Current)**: UI/UX 打磨 (Toast, Skeleton, Mobile Nav)
- **阶段二**: 互动功能 (Like, Comment)
- **阶段三**: 电商核心 (Cart, Checkout)
