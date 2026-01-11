# Blog 和 Shop 功能实现文档

本文档说明已实现的 Blog（博客）和 Shop（商店）功能的领域服务和 API 路由。

## 已创建的文件

### 领域服务层

1. **`domain/blog/services.ts`** - Blog 领域服务
   - `getBlogPosts()` - 获取博客文章列表（支持分页和按 userSlug 过滤）
   - `getBlogPostById()` - 获取单篇文章详细内容
   - `createBlogPost()` - 创建博客文章
   - `updateBlogPost()` - 更新博客文章（自动处理 publishedAt）
   - `deleteBlogPost()` - 删除博客文章

2. **`domain/shop/services.ts`** - Shop 领域服务
   - `getProducts()` - 获取商品列表（支持状态过滤）
   - `getProductById()` - 获取单个商品详情
   - `createProduct()` - 创建商品
   - `updateProduct()` - 更新商品
   - `updateProductStock()` - 更新商品库存（用于下单时增减库存）
   - `deleteProduct()` - 删除商品
   - `createOrder()` - 创建订单（事务处理）

3. **索引文件**
   - `domain/blog/index.ts` - Blog 服务导出
   - `domain/shop/index.ts` - Shop 服务导出

### API 路由层

1. **Blog API**
   - `app/api/blog/posts/route.ts` - GET（列表）、POST（创建）
   - `app/api/blog/posts/[id]/route.ts` - GET（详情）、PUT（更新）、DELETE（删除）

2. **Shop API**
   - `app/api/shop/products/route.ts` - GET（列表）、POST（创建）
   - `app/api/shop/products/[id]/route.ts` - GET（详情）、PUT（更新）、DELETE（删除）
   - `app/api/shop/orders/route.ts` - GET（列表）、POST（创建订单）

## API 端点说明

### Blog API

#### GET `/api/blog/posts`
获取博客文章列表

**查询参数**:
- `page` (number, 默认 1) - 页码
- `limit` (number, 默认 10) - 每页数量
- `userSlug` (string, 可选) - 用户 slug 过滤
- `published` (string, 可选) - "true" | "false" | null（所有）

**响应**:
```json
{
  "posts": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

#### POST `/api/blog/posts`
创建博客文章（需要认证）

**请求体**:
```json
{
  "title": "文章标题",
  "content": "文章内容",
  "coverImage": "https://example.com/cover.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "externalLinks": [{"url": "...", "label": "..."}],
  "published": false
}
```

#### GET `/api/blog/posts/[id]`
获取单篇博客文章

#### PUT `/api/blog/posts/[id]`
更新博客文章（需要认证，只能更新自己的）

#### DELETE `/api/blog/posts/[id]`
删除博客文章（需要认证，只能删除自己的）

### Shop API

#### GET `/api/shop/products`
获取商品列表

**查询参数**:
- `page` (number, 默认 1) - 页码
- `limit` (number, 默认 10) - 每页数量
- `status` (string, 可选) - "DRAFT" | "PUBLISHED" | "ARCHIVED"

**响应**:
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### POST `/api/shop/products`
创建商品（需要认证）

**请求体**:
```json
{
  "name": "商品名称",
  "description": "商品描述",
  "price": 99.99,
  "stock": 100,
  "images": ["https://example.com/image1.jpg"],
  "status": "DRAFT"
}
```

#### GET `/api/shop/products/[id]`
获取单个商品详情

#### PUT `/api/shop/products/[id]`
更新商品（需要认证，只能更新自己的）

#### DELETE `/api/shop/products/[id]`
删除商品（需要认证，只能删除自己的）

#### GET `/api/shop/orders`
获取订单列表（需要认证，只显示当前用户的订单，作为卖家）

**查询参数**:
- `page` (number, 默认 1)
- `limit` (number, 默认 10)
- `status` (string, 可选) - "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED"

#### POST `/api/shop/orders`
创建订单（需要认证）

**请求体**:
```json
{
  "buyerEmail": "buyer@example.com",
  "buyerName": "买家姓名",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Tokyo",
    "zipCode": "100-0001"
  },
  "shippingMethod": "Standard",
  "items": [
    {
      "productId": "product-id",
      "quantity": 2
    }
  ]
}
```

**响应**:
```json
{
  "order": {
    "id": "...",
    "userId": "...",
    "buyerEmail": "...",
    "totalAmount": 199.98,
    "status": "PENDING",
    "items": [
      {
        "id": "...",
        "productId": "...",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98
      }
    ],
    ...
  }
}
```

## 业务逻辑说明

### Blog 业务逻辑

1. **发布状态管理**:
   - 当 `published` 从 `false` 变为 `true` 时，自动设置 `publishedAt` 时间戳
   - 未发布的文章只有作者可以查看

2. **安全性**:
   - 更新和删除操作都验证 `userId`，确保用户只能操作自己的文章

### Shop 业务逻辑

1. **商品状态**:
   - `DRAFT`: 草稿，不对外显示
   - `PUBLISHED`: 已发布，对外可见
   - `ARCHIVED`: 已归档，不再销售

2. **库存管理**:
   - `updateProductStock()` 函数用于增减库存
   - 创建订单时自动扣减库存

3. **订单创建**:
   - 使用 Prisma 事务确保数据一致性
   - 验证商品存在且属于当前卖家
   - 检查库存是否充足
   - 计算订单总金额
   - 创建订单和订单项
   - 扣减商品库存

4. **安全性**:
   - 所有写操作都验证用户身份
   - 用户只能操作自己的商品和订单

## 使用示例

### 前端调用示例

```typescript
// 获取已发布的博客文章
const response = await fetch('/api/blog/posts?published=true&page=1&limit=10');
const data = await response.json();

// 创建博客文章
const createResponse = await fetch('/api/blog/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '我的博客',
    content: '内容...',
    published: true,
  }),
});

// 获取已发布的商品
const productsResponse = await fetch('/api/shop/products?status=PUBLISHED');
const productsData = await productsResponse.json();

// 创建订单
const orderResponse = await fetch('/api/shop/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    buyerEmail: 'buyer@example.com',
    items: [
      { productId: 'product-id', quantity: 2 }
    ],
  }),
});
```

### 服务端直接调用示例

```typescript
import { getBlogPosts, createBlogPost } from '@/domain/blog';
import { getProducts, createOrder } from '@/domain/shop';

// 获取博客文章
const blogPosts = await getBlogPosts({
  page: 1,
  limit: 10,
  userSlug: 'user-slug',
  published: true,
});

// 创建商品
const product = await createProduct({
  userId: 'user-id',
  name: '商品名称',
  price: 99.99,
  stock: 100,
  images: ['https://example.com/image.jpg'],
  status: 'PUBLISHED',
});

// 创建订单
const order = await createOrder({
  userId: 'seller-id',
  buyerEmail: 'buyer@example.com',
  items: [
    { productId: 'product-id', quantity: 2 }
  ],
});
```

## 错误处理

所有 API 路由都包含错误处理：

- **401 Unauthorized**: 未登录或认证失败
- **403 Forbidden**: 无权访问（不是资源所有者）
- **404 Not Found**: 资源不存在
- **400 Bad Request**: 请求参数错误
- **500 Internal Server Error**: 服务器错误

错误响应格式：
```json
{
  "error": "错误消息"
}
```

## 注意事项

1. **认证要求**: 所有 POST、PUT、DELETE 请求都需要用户登录
2. **权限控制**: 用户只能操作自己的资源（博客文章、商品、订单）
3. **数据验证**: 所有输入都经过验证
4. **事务处理**: 订单创建使用事务确保数据一致性
5. **库存检查**: 创建订单时会检查库存是否充足
6. **价格快照**: 订单项中的价格是下单时的快照，不会随商品价格变化

## 更新日志

- 2024-12-XX: 初始实现
  - 创建 Blog 领域服务和 API 路由
  - 创建 Shop 领域服务和 API 路由
  - 实现订单创建功能（事务处理）
  - 实现库存管理功能
