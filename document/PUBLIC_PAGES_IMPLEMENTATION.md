# 公开页面和订单流程实现文档

本文档说明已实现的访客端公开页面、下单流程和订单管理功能。

## 已创建的文件

### 访客端博客页面

1. **`app/u/[slug]/blog/page.tsx`** - 博客列表页
   - 显示用户所有已发布的博客文章
   - 网格布局展示
   - SEO metadata 支持

2. **`app/u/[slug]/blog/[id]/page.tsx`** - 博客详情页
   - 显示博客完整内容
   - 支持封面图、视频嵌入
   - 外部链接展示
   - SEO metadata 和 Open Graph 支持

3. **`features/blog/BlogList.tsx`** - 博客列表组件
   - 响应式网格布局
   - 图片预览
   - 日期显示

4. **`features/blog/BlogDetail.tsx`** - 博客详情组件
   - Markdown 内容渲染（简单实现）
   - 视频嵌入
   - 外部链接列表

### 访客端商店页面

1. **`app/u/[slug]/shop/page.tsx`** - 商品列表页
   - 显示用户所有已发布的商品
   - 网格布局展示
   - SEO metadata 支持

2. **`app/u/[slug]/shop/[id]/page.tsx`** - 商品详情页
   - 多图轮播
   - 价格和库存显示
   - "立即购买"按钮
   - SEO metadata 和 Open Graph 支持

3. **`features/shop/ProductList.tsx`** - 商品列表组件
   - 响应式网格布局
   - 商品图片预览
   - 价格和库存状态显示

4. **`features/shop/ProductDetail.tsx`** - 商品详情组件
   - 图片轮播功能
   - 库存状态检查
   - 购买按钮

### 下单流程

1. **`app/u/[slug]/shop/[id]/checkout/page.tsx`** - 下单页面
   - 商品信息展示
   - 数量选择
   - 买家信息表单（邮箱、姓名、配送地址）
   - 配送方式选择
   - 提交订单功能

2. **`app/u/[slug]/shop/order-success/[orderId]/page.tsx`** - 订单成功页面
   - 订单提交成功提示
   - 订单号显示
   - 后续流程说明

### 订单管理

1. **`app/admin/orders/page.tsx`** - 卖家订单管理页面
   - 订单列表展示
   - 订单状态统计（待处理订单数、今日销售额）
   - 订单状态更新功能
   - 订单详情显示（买家信息、商品列表、总金额）

2. **`app/api/shop/orders/[id]/route.ts`** - 订单状态更新 API
   - PUT 方法更新订单状态
   - 自动更新时间戳（paidAt, shippedAt, deliveredAt）

### API 更新

1. **`lib/api/endpoints.ts`** - 添加了以下方法：
   - `shopApi.getOrders()` - 获取订单列表
   - `shopApi.createOrder()` - 创建订单
   - `shopApi.updateOrderStatus()` - 更新订单状态

### 导航更新

1. **`features/home-hero/components/HeroMenu.tsx`** - 更新了菜单组件
   - 在用户页面（/u/[slug]）动态显示 Blog 和 Shop 链接
   - 链接指向 `/u/[slug]/blog` 和 `/u/[slug]/shop`

## 功能说明

### 博客展示

- **列表页**：网格布局，显示封面图、标题、摘要和发布日期
- **详情页**：完整内容展示，支持 Markdown（简单实现）、视频和外部链接
- **SEO**：每个页面都有适当的 metadata 和 Open Graph 标签

### 商店展示

- **列表页**：网格布局，显示商品图片、名称、价格和库存状态
- **详情页**：多图轮播、详细描述、价格和库存显示
- **购买流程**：点击"立即购买"跳转到下单页面

### 下单流程

1. **下单页面**：
   - 显示商品信息和总价
   - 收集买家信息（邮箱必填，其他可选）
   - 配送地址和方式选择
   - 提交后调用 `/api/shop/orders` 创建订单

2. **订单成功页面**：
   - 显示订单提交成功消息
   - 提示卖家会通过邮箱联系

3. **后端验证**：
   - 库存检查（在 `createOrder` 服务中）
   - 事务处理确保数据一致性

### 订单管理

- **订单列表**：显示所有关联到当前卖家的订单
- **统计信息**：待处理订单数和今日销售额
- **状态更新**：支持 PENDING → PAID → SHIPPED → DELIVERED 的状态流转
- **订单详情**：显示买家信息、商品列表、总金额和创建时间

## 注意事项

### 1. Markdown 渲染

当前 `BlogDetail` 组件使用简单的文本替换来实现 Markdown 渲染：
- 支持粗体（`**text**`）
- 支持斜体（`*text*`）
- 支持链接（`[text](url)`）
- 支持换行

**建议**：如需完整的 Markdown 支持，请安装 `react-markdown`：
```bash
pnpm add react-markdown
```

然后更新 `features/blog/BlogDetail.tsx`：
```typescript
import ReactMarkdown from "react-markdown";

// 在组件中使用
<ReactMarkdown>{post.content}</ReactMarkdown>
```

### 2. 图片优化

当前使用 Next.js 的 `Image` 组件，已配置 `sizes` 属性进行响应式优化。

**建议**：如需进一步优化，可以考虑：
- 在上传时压缩图片
- 使用 CDN 存储图片
- 配置 Next.js Image 的 `loader` 使用自定义图片服务

### 3. SEO 优化

所有页面都已添加 `generateMetadata` 函数，支持：
- 页面标题和描述
- Open Graph 标签（用于社交媒体分享）

### 4. 订单状态更新

订单状态更新 API 已实现，但前端订单管理页面中的状态更新按钮需要确保调用正确的 API。

### 5. 导航菜单

HeroMenu 组件已更新，在用户页面（`/u/[slug]`）会自动显示 Blog 和 Shop 链接。链接会根据当前路径动态生成。

## 待实现功能

1. **订单详情页**：为卖家提供更详细的订单查看页面
2. **订单搜索和过滤**：按状态、日期等过滤订单
3. **支付集成**：集成 Stripe 或其他支付网关
4. **邮件通知**：订单创建和状态更新时发送邮件通知
5. **库存预警**：当库存低于阈值时提醒卖家
6. **订单导出**：导出订单数据为 CSV 或 Excel

## 使用示例

### 访问用户的博客列表
```
/u/[slug]/blog
```

### 访问用户的商店
```
/u/[slug]/shop
```

### 查看博客详情
```
/u/[slug]/blog/[postId]
```

### 查看商品详情并购买
```
/u/[slug]/shop/[productId]
/u/[slug]/shop/[productId]/checkout
```

### 订单成功页面
```
/u/[slug]/shop/order-success/[orderId]
```

### 卖家订单管理
```
/admin/orders
```

## 更新日志

- 2024-12-XX: 初始实现
  - 创建博客和商店的访客端页面
  - 实现下单流程
  - 创建订单管理页面
  - 更新导航菜单
