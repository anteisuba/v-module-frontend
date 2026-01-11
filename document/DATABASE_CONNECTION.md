# 数据库连接与功能对应文档

本文档详细说明了项目的数据库连接方式、数据库模型结构，以及各个功能对应的数据库表和操作。

> 📚 **相关文档**:
> - [页面路由文档](./PAGE_ROUTES.md) - 所有页面对应的文件路径和路由说明

## 数据库连接配置

### 连接方式

项目使用 **Prisma ORM** 连接 **PostgreSQL** 数据库。

- **ORM**: Prisma
- **数据库**: PostgreSQL
- **连接配置**: 通过环境变量 `DATABASE_URL` 配置

### 连接文件

- **Prisma Client 初始化**: `lib/prisma.ts`
- **数据库模型定义**: `prisma/schema.prisma`
- **数据库迁移文件**: `prisma/migrations/`

### 连接代码

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// 在全局对象中缓存 Prisma Client 以重用连接
// 这在无服务器环境（Vercel）中特别重要
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
```

### 环境变量配置

```bash
# .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
```

### 使用方式

在项目中使用数据库：

```typescript
import { prisma } from "@/lib/prisma";

// 查询示例
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

## 数据库模型结构

### 模型概览

| 模型名称 | 表名 | 说明 |
|---------|------|------|
| `User` | `User` | 用户表（VTuber） |
| `Page` | `Page` | 页面配置表 |
| `NewsArticle` | `NewsArticle` | 新闻文章表 |
| `MediaAsset` | `MediaAsset` | 媒体资源表 |
| `UserPasswordResetToken` | `UserPasswordResetToken` | 密码重置 Token 表 |

### 详细模型结构

#### 1. User（用户表）

**用途**: 存储用户基本信息

**字段**:
- `id` (String, PK): 用户 ID
- `slug` (String, Unique): URL 友好标识，用于 `/u/[slug]` 路由
- `email` (String, Unique): 登录邮箱
- `passwordHash` (String): bcrypt 加密后的密码
- `displayName` (String?): 显示名称（可选）
- `createdAt` (DateTime): 创建时间
- `updatedAt` (DateTime): 更新时间

**关系**:
- `page` (1:1): 每个用户一个页面配置
- `passwordResetTokens` (1:N): 密码重置 Token
- `mediaAssets` (1:N): 用户上传的媒体资源
- `newsArticles` (1:N): 用户创建的新闻文章

**索引**:
- `@@index([slug])`
- `@@index([email])`

**使用位置**:
- `app/api/user/login/route.ts` - 用户登录
- `app/api/user/register/route.ts` - 用户注册
- `app/api/user/me/route.ts` - 获取当前用户
- `app/api/user/forgot-password/route.ts` - 忘记密码
- `app/api/user/reset-password/route.ts` - 重置密码
- `app/api/page/me/upload/route.ts` - 上传图片时验证用户
- `domain/page-config/services.ts` - 获取用户页面数据

#### 2. Page（页面配置表）

**用途**: 存储用户的页面配置（草稿和发布版本分离）

**字段**:
- `id` (String, PK): 页面 ID
- `userId` (String, Unique, FK): 用户 ID（外键关联 User）
- `slug` (String, Unique): 页面 slug，用于 `/u/[slug]` 路由
- `draftConfig` (Json?): 草稿配置（编辑时保存）
- `publishedConfig` (Json?): 发布配置（公开可见）
- `createdAt` (DateTime): 创建时间
- `updatedAt` (DateTime): 更新时间

**关系**:
- `user` (N:1): 所属用户

**索引**:
- `@@index([userId])`
- `@@index([slug])`

**使用位置**:
- `domain/page-config/services.ts` - 所有页面配置操作
- `app/api/page/[slug]/route.ts` - 获取指定用户的页面配置
- `app/api/page/me/route.ts` - 获取/更新当前用户页面配置
- `app/api/page/me/publish/route.ts` - 发布页面配置
- `app/u/[slug]/page.tsx` - 用户个人页面渲染

**重要说明**:
- `draftConfig`: 编辑时保存的配置，只有用户自己可见
- `publishedConfig`: 发布后的配置，所有访客可见
- 发布操作会将 `draftConfig` 复制到 `publishedConfig`

#### 3. NewsArticle（新闻文章表）

**用途**: 存储用户创建的新闻文章

**字段**:
- `id` (String, PK): 文章 ID
- `userId` (String, FK): 所属用户 ID（外键关联 User）
- `title` (String): 标题
- `content` (String, Text): 内容（支持 Markdown）
- `category` (String): 分类（如 "MEDIA", "MAGAZINE", "あの", "ANO"）
- `tag` (String?): 标签（可选）
- `shareUrl` (String?): 分享链接
- `shareChannels` (Json?): 分享渠道配置 `[{platform: "twitter", enabled: true}, ...]`
- `backgroundType` (String?): 背景类型（"color" | "image"）
- `backgroundValue` (String?): 背景值（颜色值或图片 URL）
- `published` (Boolean): 是否发布
- `createdAt` (DateTime): 创建时间
- `updatedAt` (DateTime): 更新时间
- `publishedAt` (DateTime?): 发布时间

**关系**:
- `user` (N:1): 所属用户

**索引**:
- `@@index([userId, createdAt])`
- `@@index([published, createdAt])`
- `@@index([category])`

**使用位置**:
- `domain/news/services.ts` - 获取已发布的新闻文章（服务端）
- `app/api/news/articles/route.ts` - 获取/创建新闻文章列表
- `app/api/news/articles/[id]/route.ts` - 获取/更新/删除单篇新闻
- `app/news/page.tsx` - 新闻列表页
- `app/news/[id]/page.tsx` - 新闻详情页
- `features/news-list/NewsListSection.tsx` - 用户页面新闻列表

#### 4. MediaAsset（媒体资源表）

**用途**: 存储用户上传的媒体资源（图片等）

**字段**:
- `id` (String, PK): 资源 ID
- `userId` (String?, FK): 用户 ID（可选，外键关联 User）
- `src` (String): 图片 URL（本地路径或 S3/R2 URL）
- `mimeType` (String): MIME 类型
- `size` (Int): 文件大小
- `originalName` (String?): 原始文件名
- `createdAt` (DateTime): 创建时间

**关系**:
- `user` (N:1): 所属用户（可选）

**索引**:
- `@@index([userId, createdAt])`

**使用位置**:
- `app/api/page/me/upload/route.ts` - 上传图片时创建媒体资源记录

**说明**:
- 支持本地存储和云存储（S3/R2）
- 本地路径格式: `/uploads/user-slug/filename.jpg`
- 云存储格式: `https://your-domain.com/uploads/user-slug/filename.jpg`

#### 5. UserPasswordResetToken（密码重置 Token 表）

**用途**: 存储密码重置 Token，用于安全验证

**字段**:
- `id` (String, PK): Token ID
- `tokenHash` (String, Unique): 哈希后的 token（用于查找和验证）
- `userId` (String, FK): 用户 ID（外键关联 User）
- `expiresAt` (DateTime): 过期时间
- `used` (Boolean): 是否已使用
- `createdAt` (DateTime): 创建时间

**关系**:
- `user` (N:1): 所属用户

**索引**:
- `@@index([userId])`
- `@@index([expiresAt])`

**使用位置**:
- `app/api/user/forgot-password/route.ts` - 创建重置 Token
- `app/api/user/reset-password/route.ts` - 验证和使用 Token

**安全说明**:
- Token 以哈希形式存储，不存储明文
- Token 24 小时后过期
- Token 使用后标记为已使用，不能重复使用

## 功能与数据库对应关系

### 用户认证功能

| 功能 | API 路由 | 数据库操作 | 涉及表 |
|------|---------|-----------|--------|
| **用户登录** | `/api/user/login` | `prisma.user.findUnique()` | `User` |
| **用户注册** | `/api/user/register` | `prisma.user.create()`<br>`ensureUserPage()` | `User`, `Page` |
| **获取当前用户** | `/api/user/me` | `prisma.user.findUnique()` | `User` |
| **忘记密码** | `/api/user/forgot-password` | `prisma.user.findUnique()`<br>`prisma.userPasswordResetToken.create()` | `User`, `UserPasswordResetToken` |
| **重置密码** | `/api/user/reset-password` | `prisma.userPasswordResetToken.findUnique()`<br>`prisma.user.update()`<br>`prisma.userPasswordResetToken.update()` | `UserPasswordResetToken`, `User` |

**相关文件**:
- `app/api/user/login/route.ts`
- `app/api/user/register/route.ts`
- `app/api/user/me/route.ts`
- `app/api/user/forgot-password/route.ts`
- `app/api/user/reset-password/route.ts`

### 页面配置功能

| 功能 | API 路由/服务 | 数据库操作 | 涉及表 |
|------|-------------|-----------|--------|
| **获取页面配置** | `/api/page/[slug]` | `prisma.user.findUnique()`<br>`include: { page }` | `User`, `Page` |
| **获取草稿配置** | `getUserDraftConfig()` | `prisma.page.findUnique()` | `Page` |
| **更新草稿配置** | `/api/page/me` (PUT) | `prisma.page.update()` | `Page` |
| **发布页面** | `/api/page/me/publish` | `prisma.page.findUnique()`<br>`prisma.page.update()` | `Page` |
| **获取发布配置** | `getPublishedConfigBySlug()` | `prisma.page.findUnique()` | `Page` |
| **确保用户有页面** | `ensureUserPage()` | `prisma.page.findUnique()`<br>`prisma.page.create()` | `Page` |

**相关文件**:
- `domain/page-config/services.ts` - 所有页面配置服务函数
- `app/api/page/[slug]/route.ts` - 获取指定用户页面配置
- `app/api/page/me/route.ts` - 获取/更新当前用户页面配置
- `app/api/page/me/publish/route.ts` - 发布页面
- `app/u/[slug]/page.tsx` - 用户个人页面（使用 `getUserPageDataBySlug`）

### 新闻文章功能

| 功能 | API 路由/服务 | 数据库操作 | 涉及表 |
|------|-------------|-----------|--------|
| **获取新闻列表** | `/api/news/articles` (GET) | `prisma.newsArticle.findMany()`<br>`prisma.newsArticle.count()` | `NewsArticle` |
| **创建新闻** | `/api/news/articles` (POST) | `prisma.newsArticle.create()` | `NewsArticle` |
| **获取单篇新闻** | `/api/news/articles/[id]` (GET) | `prisma.newsArticle.findUnique()` | `NewsArticle` |
| **更新新闻** | `/api/news/articles/[id]` (PUT) | `prisma.newsArticle.findUnique()`<br>`prisma.newsArticle.update()` | `NewsArticle` |
| **删除新闻** | `/api/news/articles/[id]` (DELETE) | `prisma.newsArticle.findUnique()`<br>`prisma.newsArticle.delete()` | `NewsArticle` |
| **获取已发布新闻（服务端）** | `getPublishedNewsArticles()` | `prisma.newsArticle.findMany()`<br>`include: { user }` | `NewsArticle`, `User` |

**相关文件**:
- `domain/news/services.ts` - 服务端获取新闻文章
- `app/api/news/articles/route.ts` - 新闻列表 API
- `app/api/news/articles/[id]/route.ts` - 单篇新闻 API
- `app/news/page.tsx` - 新闻列表页
- `app/news/[id]/page.tsx` - 新闻详情页
- `features/news-list/NewsListSection.tsx` - 用户页面新闻列表

**重要说明**:
- 服务端函数 `getPublishedNewsArticles()` 支持按用户 slug 过滤
- 只有 `published: true` 的文章才会在公开页面显示
- 文章按创建时间倒序排列

### 媒体资源功能

| 功能 | API 路由 | 数据库操作 | 涉及表 |
|------|---------|-----------|--------|
| **上传图片** | `/api/page/me/upload` | `prisma.user.findUnique()`<br>`prisma.mediaAsset.create()` | `User`, `MediaAsset` |

**相关文件**:
- `app/api/page/me/upload/route.ts` - 图片上传 API

**说明**:
- 上传图片时会创建 `MediaAsset` 记录
- 支持本地存储和云存储（S3/R2）
- 图片 URL 存储在 `MediaAsset.src` 字段

## 数据库关系图

```
User (用户)
├── Page (1:1) - 页面配置
│   ├── draftConfig - 草稿配置
│   └── publishedConfig - 发布配置
├── NewsArticle (1:N) - 新闻文章
│   ├── published - 是否发布
│   └── category - 分类
├── MediaAsset (1:N) - 媒体资源
│   └── src - 资源 URL
└── UserPasswordResetToken (1:N) - 密码重置 Token
    ├── tokenHash - Token 哈希
    ├── expiresAt - 过期时间
    └── used - 是否已使用
```

## 数据库操作最佳实践

### 1. 使用服务层函数

优先使用 `domain/` 目录下的服务函数，而不是直接使用 Prisma：

```typescript
// ✅ 推荐：使用服务函数
import { getUserPageDataBySlug } from "@/domain/page-config";
const user = await getUserPageDataBySlug(slug);

// ❌ 不推荐：直接使用 Prisma
import { prisma } from "@/lib/prisma";
const user = await prisma.user.findUnique({ where: { slug } });
```

### 2. 使用缓存

对于频繁查询的数据，使用 React `cache` 函数：

```typescript
import { cache } from "react";

export const getUserPageDataBySlug = cache(async (slug: string) => {
  // 查询逻辑
});
```

### 3. 错误处理

所有数据库操作都应该包含错误处理：

```typescript
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "用户不存在" }, { status: 404 });
  }
} catch (error) {
  console.error("数据库查询失败:", error);
  return NextResponse.json({ message: "服务器错误" }, { status: 500 });
}
```

### 4. 事务处理

对于需要多个数据库操作的场景，使用事务：

```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: userData });
  await tx.page.create({ data: pageData });
});
```

## 数据库迁移

### 创建迁移

```bash
pnpm db:migrate
```

### 查看迁移历史

```bash
# 查看迁移文件
ls prisma/migrations/
```

### 重置数据库

```bash
# ⚠️ 警告：会删除所有数据
pnpm prisma migrate reset
```

## 数据库查询工具

### Prisma Studio

使用 Prisma Studio 可视化查看和编辑数据库：

```bash
pnpm db:studio
```

访问 `http://localhost:5555` 查看数据库内容。

## 环境变量

### 开发环境

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
```

### 生产环境

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

## 常见问题

### 1. 连接池耗尽

**问题**: 在无服务器环境中可能出现连接池耗尽

**解决**: Prisma Client 已经在 `lib/prisma.ts` 中配置了全局缓存，确保连接重用。

### 2. 迁移失败

**问题**: 迁移时出现错误

**解决**: 
1. 检查数据库连接是否正常
2. 查看迁移文件是否有语法错误
3. 使用 `prisma migrate resolve` 解决冲突

### 3. 类型错误

**问题**: TypeScript 类型不匹配

**解决**: 
1. 运行 `pnpm prisma generate` 重新生成 Prisma Client
2. 确保 `@prisma/client` 版本与 `prisma` 版本一致

## 更新日志

- 2024-12-XX: 初始文档创建
  - 添加数据库连接配置说明
  - 添加所有模型结构说明
  - 添加功能与数据库对应关系
  - 添加最佳实践和常见问题
