# BlogPost、Product 和 Order 模型设置指南

本文档说明如何为项目添加 BlogPost（博客）、Product（商品）和 Order（订单）相关的数据库模型。

## 方式一：使用 Prisma Migrate（推荐）

如果你可以使用 Prisma Migrate，这是最简单的方式：

### 1. 确认 schema.prisma 已更新

确保 `prisma/schema.prisma` 文件已包含新的模型定义（已自动更新）。

### 2. 创建迁移

```bash
pnpm db:migrate
```

在提示时输入迁移名称，例如：`add_blog_product_order_models`

### 3. 应用迁移

迁移会自动应用到数据库。

## 方式二：在 Supabase 上手动创建表（如果无法使用 Prisma）

如果你无法使用 Prisma Migrate，可以在 Supabase 的 SQL Editor 中手动执行 SQL。

### 步骤

1. **登录 Supabase Dashboard**
   - 访问你的 Supabase 项目
   - 进入 SQL Editor

2. **执行 SQL 脚本**
   - 打开文件 `prisma/create_blog_product_order_tables.sql`
   - 复制所有 SQL 代码
   - 在 Supabase SQL Editor 中粘贴并执行

3. **验证表创建**
   - 在 Supabase Dashboard 的 Table Editor 中检查是否创建了以下表：
     - `BlogPost`
     - `Product`
     - `Order`
     - `OrderItem`

4. **解决 RLS 警告** ⚠️
   - Supabase 会显示 RLS (Row Level Security) 警告
   - 如果你的应用使用自定义认证（如 session），执行 `prisma/disable_rls_for_custom_auth.sql`
   - 如果你的应用使用 Supabase Auth，执行 `prisma/enable_rls_policies.sql`
   - 详见下方 [RLS 配置](#rls-配置) 部分

## 模型说明

### BlogPost（博客文章）

**用途**: 存储用户创建的博客文章

**主要字段**:
- `id`: 文章 ID（主键）
- `userId`: 所属用户 ID（外键）
- `title`: 标题
- `content`: 内容（支持 Markdown）
- `coverImage`: 封面图片 URL（可选）
- `videoUrl`: 视频 URL（可选）
- `externalLinks`: 外部链接 JSON（可选）
- `published`: 是否发布（默认 false）
- `createdAt`, `updatedAt`, `publishedAt`: 时间戳

**索引**:
- `userId` + `createdAt`（按用户和时间查询）
- `published` + `createdAt`（查询已发布文章）

### Product（商品）

**用途**: 存储用户创建的商品信息（类似 Shopify）

**主要字段**:
- `id`: 商品 ID（主键）
- `userId`: 所属用户 ID（卖家，外键）
- `name`: 商品名称
- `description`: 商品描述（可选）
- `price`: 价格（Decimal(10,2)）
- `stock`: 库存数量（默认 0）
- `images`: 图片 URL 数组（JSON）
- `status`: 状态（DRAFT, PUBLISHED, ARCHIVED，默认 DRAFT）
- `createdAt`, `updatedAt`: 时间戳

**索引**:
- `userId` + `createdAt`（按用户和时间查询）
- `status` + `createdAt`（按状态查询）
- `userId` + `status`（按用户和状态查询）

### Order（订单）

**用途**: 存储订单信息

**主要字段**:
- `id`: 订单 ID（主键）
- `userId`: 卖家用户 ID（外键）
- `buyerEmail`: 买家邮箱
- `buyerName`: 买家姓名（可选）
- `totalAmount`: 订单总金额（Decimal(10,2)）
- `status`: 订单状态（PENDING, PAID, SHIPPED, DELIVERED, CANCELLED，默认 PENDING）
- `shippingAddress`: 配送地址 JSON（可选）
- `shippingMethod`: 配送方式（可选）
- `createdAt`, `updatedAt`: 时间戳
- `paidAt`, `shippedAt`, `deliveredAt`: 各阶段时间戳

**索引**:
- `userId` + `createdAt`（按卖家和时间查询）
- `buyerEmail` + `createdAt`（按买家查询）
- `status` + `createdAt`（按状态查询）

### OrderItem（订单项）

**用途**: 订单与商品的关联表，记录下单时的价格快照

**主要字段**:
- `id`: 订单项 ID（主键）
- `orderId`: 订单 ID（外键）
- `productId`: 商品 ID（外键）
- `price`: 下单时的单价（Decimal(10,2)）
- `quantity`: 购买数量
- `subtotal`: 小计（price * quantity，Decimal(10,2)）
- `createdAt`: 创建时间

**索引**:
- `orderId`（查询订单的所有商品）
- `productId`（查询商品的订单）
- `orderId` + `productId`（唯一约束，一个订单中同一商品只能出现一次）

**重要说明**:
- `price` 字段记录的是下单时的商品价格，即使商品价格后续变化，订单中的价格也不会改变
- 使用 `onDelete: Restrict` 防止删除有订单的商品

## 数据库关系

```
User (用户)
├── BlogPost (1:N) - 博客文章
├── Product (1:N) - 商品
└── Order (1:N) - 订单（作为卖家）

Order (订单)
└── OrderItem (1:N) - 订单项

Product (商品)
└── OrderItem (1:N) - 订单项
```

## 使用示例

### 创建博客文章

```typescript
import { prisma } from "@/lib/prisma";

const blogPost = await prisma.blogPost.create({
  data: {
    userId: "user-id",
    title: "我的第一篇博客",
    content: "这是博客内容...",
    coverImage: "https://example.com/image.jpg",
    published: true,
  },
});
```

### 创建商品

```typescript
const product = await prisma.product.create({
  data: {
    userId: "user-id",
    name: "商品名称",
    description: "商品描述",
    price: 99.99,
    stock: 100,
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    status: "PUBLISHED",
  },
});
```

### 创建订单

```typescript
const order = await prisma.order.create({
  data: {
    userId: "seller-id",
    buyerEmail: "buyer@example.com",
    buyerName: "买家姓名",
    totalAmount: 199.98,
    status: "PENDING",
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
});
```

## 注意事项

1. **Decimal 类型**: Product 和 Order 的价格字段使用 `Decimal(10,2)` 类型，确保精度
2. **JSON 字段**: `images` 和 `externalLinks` 使用 JSONB 类型存储数组
3. **外键约束**: 
   - BlogPost、Product、Order 删除用户时会级联删除（CASCADE）
   - OrderItem 删除订单时会级联删除（CASCADE）
   - OrderItem 删除商品时会阻止删除（RESTRICT），防止删除有订单的商品
4. **唯一约束**: OrderItem 的 `orderId` + `productId` 组合唯一，确保一个订单中同一商品只出现一次
5. **自动更新时间戳**: 已创建触发器自动更新 `updatedAt` 字段

## 验证

执行 SQL 后，可以通过以下方式验证：

1. **在 Supabase Table Editor 中查看表结构**
2. **运行 Prisma Studio**:
   ```bash
   pnpm db:studio
   ```
3. **生成 Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

## RLS 配置

### 什么是 RLS？

RLS (Row Level Security) 是 PostgreSQL 的行级安全特性，Supabase 要求公开表必须启用 RLS 或明确禁用。

### 方案选择

#### 方案一：禁用 RLS（适用于自定义认证）

如果你的应用使用自定义认证系统（如 session、JWT），而不是 Supabase Auth：

1. **执行禁用 RLS 脚本**:
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- 文件：prisma/disable_rls_for_custom_auth.sql
   ```

2. **说明**:
   - 这会禁用所有新表的 RLS
   - 安全性完全依赖应用层的权限控制
   - 适合使用 Prisma 直接访问数据库的应用

#### 方案二：启用 RLS 并创建策略（适用于 Supabase Auth）

如果你的应用使用 Supabase Auth：

1. **执行启用 RLS 脚本**:
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- 文件：prisma/enable_rls_policies.sql
   ```

2. **策略说明**:
   - **BlogPost**: 已发布的文章公开可读，只有作者可以修改
   - **Product**: 已发布的商品公开可读，只有卖家可以修改
   - **Order**: 只有订单的卖家可以查看和管理
   - **OrderItem**: 跟随 Order 的权限

3. **注意**: 
   - 这些策略使用 `auth.uid()`，需要 Supabase Auth
   - 如果你的 User 表的 id 不是 UUID 格式，需要调整策略

#### 方案三：服务角色策略（推荐用于生产环境）

如果你使用服务角色（service_role）访问数据库：

1. **启用 RLS**:
   ```sql
   ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
   ```

2. **创建服务角色策略**:
   ```sql
   -- 允许服务角色完全访问
   CREATE POLICY "Service role can do everything on BlogPost"
   ON "BlogPost" FOR ALL TO service_role
   USING (true) WITH CHECK (true);
   
   -- 对其他表重复相同操作
   ```

### 推荐方案

**对于当前项目（使用 session 认证）**，推荐使用**方案一**（禁用 RLS），因为：
- 项目使用自定义 session 认证，不是 Supabase Auth
- Prisma 直接访问数据库，权限控制在应用层
- 简单直接，不会影响现有功能

## 更新日志

- 2024-12-XX: 添加 RLS 配置说明
  - 添加 RLS 启用/禁用脚本
  - 添加策略说明
  - 添加方案选择指南
- 2024-12-XX: 初始创建
  - 添加 BlogPost 模型
  - 添加 Product 模型
  - 添加 Order 和 OrderItem 模型
  - 创建 SQL 脚本和文档
