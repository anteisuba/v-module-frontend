# 新建数据库表详细信息

本文档详细说明新增的四个数据库表：BlogPost、Product、Order、OrderItem。

## 1. BlogPost（博客文章表）

### 基本信息

- **表名**: `BlogPost`
- **用途**: 存储用户创建的博客文章
- **关联**: 属于 User（多对一关系）

### 字段详情

| 字段名          | 类型         | 约束                  | 默认值            | 说明                                                                    |
| --------------- | ------------ | --------------------- | ----------------- | ----------------------------------------------------------------------- |
| `id`            | TEXT         | PRIMARY KEY           | cuid()            | 文章唯一标识                                                            |
| `userId`        | TEXT         | NOT NULL, FOREIGN KEY | -                 | 所属用户 ID（关联 User.id）                                             |
| `title`         | TEXT         | NOT NULL              | -                 | 文章标题                                                                |
| `content`       | TEXT         | NOT NULL              | -                 | 文章内容（支持 Markdown）                                               |
| `coverImage`    | TEXT         | NULL                  | NULL              | 封面图片 URL（可选）                                                    |
| `videoUrl`      | TEXT         | NULL                  | NULL              | 视频 URL（可选）                                                        |
| `externalLinks` | JSONB        | NULL                  | NULL              | 外部链接 JSON 数组（可选）<br>格式：`[{url: "...", label: "..."}, ...]` |
| `published`     | BOOLEAN      | NOT NULL              | false             | 是否发布                                                                |
| `createdAt`     | TIMESTAMP(3) | NOT NULL              | CURRENT_TIMESTAMP | 创建时间                                                                |
| `updatedAt`     | TIMESTAMP(3) | NOT NULL              | 自动更新          | 更新时间                                                                |
| `publishedAt`   | TIMESTAMP(3) | NULL                  | NULL              | 发布时间（可选）                                                        |

### 索引

- `@@index([userId, createdAt])` - 按用户和时间查询
- `@@index([published, createdAt])` - 查询已发布文章

### 外键关系

- `userId` → `User.id` (ON DELETE CASCADE)

### 使用示例

```typescript
// 创建博客文章
const blogPost = await prisma.blogPost.create({
  data: {
    userId: "user-id",
    title: "我的第一篇博客",
    content: "这是博客内容...",
    coverImage: "https://example.com/cover.jpg",
    videoUrl: "https://example.com/video.mp4",
    externalLinks: [{ url: "https://example.com", label: "示例链接" }],
    published: true,
  },
});

// 查询已发布的博客文章
const publishedPosts = await prisma.blogPost.findMany({
  where: { published: true },
  orderBy: { createdAt: "desc" },
});

// 查询用户的博客文章
const userPosts = await prisma.blogPost.findMany({
  where: { userId: "user-id" },
  include: { user: true },
});
```

---

## 2. Product（商品表）

### 基本信息

- **表名**: `Product`
- **用途**: 存储用户创建的商品信息（类似 Shopify）
- **关联**: 属于 User（多对一关系）

### 字段详情

| 字段名        | 类型          | 约束                  | 默认值            | 说明                                           |
| ------------- | ------------- | --------------------- | ----------------- | ---------------------------------------------- |
| `id`          | TEXT          | PRIMARY KEY           | cuid()            | 商品唯一标识                                   |
| `userId`      | TEXT          | NOT NULL, FOREIGN KEY | -                 | 所属用户 ID（卖家，关联 User.id）              |
| `name`        | TEXT          | NOT NULL              | -                 | 商品名称                                       |
| `description` | TEXT          | NULL                  | NULL              | 商品描述（可选）                               |
| `price`       | DECIMAL(10,2) | NOT NULL              | -                 | 商品价格（精度 10，小数位 2）                  |
| `stock`       | INTEGER       | NOT NULL              | 0                 | 库存数量                                       |
| `images`      | JSONB         | NOT NULL              | -                 | 图片 URL 数组<br>格式：`["url1", "url2", ...]` |
| `status`      | TEXT          | NOT NULL              | 'DRAFT'           | 商品状态<br>可选值：DRAFT, PUBLISHED, ARCHIVED |
| `createdAt`   | TIMESTAMP(3)  | NOT NULL              | CURRENT_TIMESTAMP | 创建时间                                       |
| `updatedAt`   | TIMESTAMP(3)  | NOT NULL              | 自动更新          | 更新时间                                       |

### 索引

- `@@index([userId, createdAt])` - 按用户和时间查询
- `@@index([status, createdAt])` - 按状态查询
- `@@index([userId, status])` - 按用户和状态查询

### 外键关系

- `userId` → `User.id` (ON DELETE CASCADE)

### 状态说明

- **DRAFT**: 草稿状态，不对外显示
- **PUBLISHED**: 已发布，对外可见
- **ARCHIVED**: 已归档，不再销售但保留记录

### 使用示例

```typescript
// 创建商品
const product = await prisma.product.create({
  data: {
    userId: "user-id",
    name: "商品名称",
    description: "商品描述",
    price: 99.99,
    stock: 100,
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
    status: "PUBLISHED",
  },
});

// 查询已发布的商品
const publishedProducts = await prisma.product.findMany({
  where: {
    status: "PUBLISHED",
    stock: { gt: 0 }, // 有库存
  },
  orderBy: { createdAt: "desc" },
});

// 查询用户的商品
const userProducts = await prisma.product.findMany({
  where: { userId: "user-id" },
  include: { user: true },
});
```

---

## 3. Order（订单表）

### 基本信息

- **表名**: `Order`
- **用途**: 存储订单信息
- **关联**: 属于 User（多对一关系，卖家）

### 字段详情

| 字段名            | 类型          | 约束                  | 默认值            | 说明                                                               |
| ----------------- | ------------- | --------------------- | ----------------- | ------------------------------------------------------------------ |
| `id`              | TEXT          | PRIMARY KEY           | cuid()            | 订单唯一标识                                                       |
| `userId`          | TEXT          | NOT NULL, FOREIGN KEY | -                 | 卖家用户 ID（关联 User.id）                                        |
| `buyerEmail`      | TEXT          | NOT NULL              | -                 | 买家邮箱                                                           |
| `buyerName`       | TEXT          | NULL                  | NULL              | 买家姓名（可选）                                                   |
| `totalAmount`     | DECIMAL(10,2) | NOT NULL              | -                 | 订单总金额                                                         |
| `status`          | TEXT          | NOT NULL              | 'PENDING'         | 订单状态<br>可选值：PENDING, PAID, SHIPPED, DELIVERED, CANCELLED   |
| `shippingAddress` | JSONB         | NULL                  | NULL              | 配送地址 JSON（可选）<br>格式：`{street: "...", city: "...", ...}` |
| `shippingMethod`  | TEXT          | NULL                  | NULL              | 配送方式（可选）                                                   |
| `createdAt`       | TIMESTAMP(3)  | NOT NULL              | CURRENT_TIMESTAMP | 创建时间                                                           |
| `updatedAt`       | TIMESTAMP(3)  | NOT NULL              | 自动更新          | 更新时间                                                           |
| `paidAt`          | TIMESTAMP(3)  | NULL                  | NULL              | 支付时间（可选）                                                   |
| `shippedAt`       | TIMESTAMP(3)  | NULL                  | NULL              | 发货时间（可选）                                                   |
| `deliveredAt`     | TIMESTAMP(3)  | NULL                  | NULL              | 送达时间（可选）                                                   |

### 索引

- `@@index([userId, createdAt])` - 按卖家和时间查询
- `@@index([buyerEmail, createdAt])` - 按买家查询
- `@@index([status, createdAt])` - 按状态查询

### 外键关系

- `userId` → `User.id` (ON DELETE CASCADE)

### 状态说明

- **PENDING**: 待支付
- **PAID**: 已支付
- **SHIPPED**: 已发货
- **DELIVERED**: 已送达
- **CANCELLED**: 已取消

### 使用示例

```typescript
// 创建订单
const order = await prisma.order.create({
  data: {
    userId: "seller-id",
    buyerEmail: "buyer@example.com",
    buyerName: "买家姓名",
    totalAmount: 199.98,
    status: "PENDING",
    shippingAddress: {
      street: "123 Main St",
      city: "Tokyo",
      zipCode: "100-0001",
    },
    shippingMethod: "Standard",
    items: {
      create: [
        {
          productId: "product-id-1",
          price: 99.99,
          quantity: 2,
          subtotal: 199.98,
        },
      ],
    },
  },
  include: { items: { include: { product: true } } },
});

// 查询卖家的订单
const sellerOrders = await prisma.order.findMany({
  where: { userId: "seller-id" },
  include: { items: true },
  orderBy: { createdAt: "desc" },
});

// 更新订单状态
await prisma.order.update({
  where: { id: "order-id" },
  data: {
    status: "PAID",
    paidAt: new Date(),
  },
});
```

---

## 4. OrderItem（订单项表）

### 基本信息

- **表名**: `OrderItem`
- **用途**: 订单与商品的关联表，记录下单时的价格快照
- **关联**: 属于 Order（多对一）和 Product（多对一）

### 字段详情

| 字段名      | 类型          | 约束                  | 默认值            | 说明                       |
| ----------- | ------------- | --------------------- | ----------------- | -------------------------- |
| `id`        | TEXT          | PRIMARY KEY           | cuid()            | 订单项唯一标识             |
| `orderId`   | TEXT          | NOT NULL, FOREIGN KEY | -                 | 订单 ID（关联 Order.id）   |
| `productId` | TEXT          | NOT NULL, FOREIGN KEY | -                 | 商品 ID（关联 Product.id） |
| `price`     | DECIMAL(10,2) | NOT NULL              | -                 | 下单时的单价（价格快照）   |
| `quantity`  | INTEGER       | NOT NULL              | -                 | 购买数量                   |
| `subtotal`  | DECIMAL(10,2) | NOT NULL              | -                 | 小计（price × quantity）   |
| `createdAt` | TIMESTAMP(3)  | NOT NULL              | CURRENT_TIMESTAMP | 创建时间                   |

### 索引

- `@@index([orderId])` - 查询订单的所有商品
- `@@index([productId])` - 查询商品的订单
- `@@unique([orderId, productId])` - 唯一约束，一个订单中同一商品只能出现一次

### 外键关系

- `orderId` → `Order.id` (ON DELETE CASCADE)
- `productId` → `Product.id` (ON DELETE RESTRICT)

### 重要说明

1. **价格快照**: `price` 字段记录的是下单时的商品价格，即使商品价格后续变化，订单中的价格也不会改变
2. **唯一约束**: 一个订单中同一商品只能出现一次，如果需要购买多个，应该增加 `quantity`
3. **删除保护**: Product 删除时使用 RESTRICT，防止删除有订单的商品

### 使用示例

```typescript
// 创建订单项
const orderItem = await prisma.orderItem.create({
  data: {
    orderId: "order-id",
    productId: "product-id",
    price: 99.99, // 下单时的价格
    quantity: 2,
    subtotal: 199.98, // 99.99 * 2
  },
  include: {
    product: true,
    order: true,
  },
});

// 查询订单的所有商品
const orderItems = await prisma.orderItem.findMany({
  where: { orderId: "order-id" },
  include: { product: true },
});

// 查询商品的订单历史
const productOrders = await prisma.orderItem.findMany({
  where: { productId: "product-id" },
  include: { order: true },
});
```

---

## 表关系图

```
User (用户)
├── BlogPost (1:N) - 博客文章
│   └── userId → User.id
├── Product (1:N) - 商品
│   └── userId → User.id
│   └── OrderItem (1:N) - 订单项
└── Order (1:N) - 订单（作为卖家）
    └── userId → User.id
    └── OrderItem (1:N) - 订单项

Order (订单)
└── OrderItem (1:N) - 订单项
    └── orderId → Order.id
    └── productId → Product.id

Product (商品)
└── OrderItem (1:N) - 订单项
    └── productId → Product.id
```

## 数据库操作总结

### 创建操作

| 表        | 主要操作   | 关键字段                                |
| --------- | ---------- | --------------------------------------- |
| BlogPost  | `create()` | userId, title, content, published       |
| Product   | `create()` | userId, name, price, stock, status      |
| Order     | `create()` | userId, buyerEmail, totalAmount, status |
| OrderItem | `create()` | orderId, productId, price, quantity     |

### 查询操作

| 表        | 常用查询                                | 索引支持                                                 |
| --------- | --------------------------------------- | -------------------------------------------------------- |
| BlogPost  | 按用户查询、按发布状态查询              | userId+createdAt, published+createdAt                    |
| Product   | 按用户查询、按状态查询、按用户+状态查询 | userId+createdAt, status+createdAt, userId+status        |
| Order     | 按卖家查询、按买家查询、按状态查询      | userId+createdAt, buyerEmail+createdAt, status+createdAt |
| OrderItem | 按订单查询、按商品查询                  | orderId, productId                                       |

### 更新操作

| 表        | 常用更新             | 注意事项                 |
| --------- | -------------------- | ------------------------ |
| BlogPost  | 更新内容、发布状态   | 发布时设置 publishedAt   |
| Product   | 更新价格、库存、状态 | 价格变化不影响已有订单   |
| Order     | 更新订单状态         | 状态变更时更新对应时间戳 |
| OrderItem | 通常不更新           | 价格快照不应修改         |

## SQL 创建语句

完整的 SQL 创建语句请参考：

- `prisma/create_blog_product_order_tables.sql` - 表创建脚本
- `prisma/fix_rls_warnings.sql` - RLS 配置脚本

## 注意事项

1. **价格精度**: Product 和 Order 的价格使用 `DECIMAL(10,2)`，确保精度
2. **JSON 字段**: `images` 和 `externalLinks` 使用 JSONB 类型存储数组
3. **时间戳**: 所有表都有 `createdAt` 和 `updatedAt`，`updatedAt` 通过触发器自动更新
4. **级联删除**: BlogPost、Product、Order 删除用户时会级联删除
5. **删除保护**: OrderItem 删除商品时会阻止删除（RESTRICT），保护订单数据完整性
6. **唯一约束**: OrderItem 的 `orderId` + `productId` 组合唯一

## 更新日志

- 2024-12-XX: 初始创建
  - 添加 BlogPost 表
  - 添加 Product 表
  - 添加 Order 和 OrderItem 表
  - 创建完整文档
