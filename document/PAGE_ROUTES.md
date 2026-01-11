# 页面路由文档

本文档列出了项目中所有页面对应的文件路径，方便快速定位和查找。

> 📚 **相关文档**:
>
> - [数据库连接与功能对应文档](./DATABASE_CONNECTION.md) - 数据库连接方式、模型结构和功能对应关系

## 快速索引

| 路由                     | 文件路径                             | 类型   | 说明              |
| ------------------------ | ------------------------------------ | ------ | ----------------- |
| `/`                      | `app/page.tsx`                       | 重定向 | 重定向到 `/admin` |
| `/news`                  | `app/news/page.tsx`                  | 页面   | 新闻列表页        |
| `/news/[id]`             | `app/news/[id]/page.tsx`             | 页面   | 新闻详情页        |
| `/u/[slug]`              | `app/u/[slug]/page.tsx`              | 页面   | 用户个人页面      |
| `/admin`                 | `app/admin/page.tsx`                 | 页面   | 管理后台登录页    |
| `/admin/dashboard`       | `app/admin/dashboard/page.tsx`       | 页面   | 管理后台仪表板    |
| `/admin/cms`             | `app/admin/cms/page.tsx`             | 页面   | CMS 编辑页面      |
| `/admin/register`        | `app/admin/register/page.tsx`        | 页面   | 注册页面          |
| `/admin/forgot-password` | `app/admin/forgot-password/page.tsx` | 页面   | 忘记密码页面      |
| `/admin/reset-password`  | `app/admin/reset-password/page.tsx`  | 页面   | 重置密码页面      |

## 公共页面

### 1. 首页（重定向）

- **路由**: `/`
- **文件**: `app/page.tsx`
- **描述**: 自动重定向到 `/admin` 管理后台登录页面
- **功能**: 使用 Next.js `redirect` 函数实现服务器端重定向

### 2. 新闻列表页

- **路由**: `/news`
- **文件**: `app/news/page.tsx`
- **加载状态**: `app/news/loading.tsx`
- **描述**: 显示所有已发布的新闻文章列表，支持分页
- **功能**:
  - 文章列表展示
  - 分页导航
  - 支持从用户页面跳转（通过 `from` 参数）

### 3. 新闻详情页

- **路由**: `/news/[id]`
- **文件**: `app/news/[id]/page.tsx`
- **组件文件**: `app/news/[id]/NewsDetailContent.tsx`
- **加载状态**: `app/news/[id]/loading.tsx`
- **描述**: 显示单篇新闻文章的详细内容
- **功能**:
  - 文章详情展示
  - 作者可编辑文章
  - 分享功能（Twitter、Facebook、LINE）
  - 自定义背景设置

### 4. 用户个人页面

- **路由**: `/u/[slug]`
- **文件**: `app/u/[slug]/page.tsx`
- **加载状态**: `app/u/[slug]/loading.tsx`
- **描述**: 显示用户的个人页面，包含页面配置和新闻列表
- **组件**:
  - `PageRenderer` (来自 `@/features/page-renderer`)
  - `NewsListSection` (来自 `@/features/news-list`)
- **功能**:
  - 动态页面配置渲染
  - **用户专属新闻列表展示**（只显示该用户的文章）
  - SEO 元数据生成
- **重要说明**:
  - `NewsListSection` 组件会根据 `slug` 参数过滤，只显示该用户的已发布文章
  - 每个用户的页面只显示自己的新闻，不会显示其他用户的内容

## 管理后台页面

### 5. 管理后台登录页

- **路由**: `/admin`
- **文件**: `app/admin/page.tsx`
- **描述**: 管理员登录页面
- **组件**:
  - `AdminAuthPanel` (来自 `@/features/admin-auth`)
  - `LanguageSelector` (语言选择器)
- **说明**: 已移除返回首页按钮

### 6. 管理后台仪表板

- **路由**: `/admin/dashboard`
- **文件**: `app/admin/dashboard/page.tsx`
- **描述**: 管理后台主页面，提供页面选择功能
- **功能**:
  - 页面选择（CMS、Blog、Media）
  - 用户信息显示
  - 退出登录
  - 查看公开页面链接

### 7. CMS 编辑页面

- **路由**: `/admin/cms`
- **文件**: `app/admin/cms/page.tsx`
- **描述**: 内容管理系统编辑页面，用于编辑用户个人页面配置
- **功能**:
  - Hero Section 编辑
  - News Section 编辑
  - Video Section 编辑
  - 页面背景编辑
  - 新闻文章编辑
  - 草稿保存和发布
  - 键盘快捷键支持（保存、发布）

### 8. 注册页面

- **路由**: `/admin/register`
- **文件**: `app/admin/register/page.tsx`
- **描述**: 用户注册页面
- **功能**:
  - 邮箱注册
  - 密码设置
  - 显示名称设置
  - 用户名（slug）设置

### 9. 忘记密码页面

- **路由**: `/admin/forgot-password`
- **文件**: `app/admin/forgot-password/page.tsx`
- **描述**: 忘记密码页面，发送重置密码链接
- **功能**:
  - 邮箱验证
  - 发送重置密码邮件

### 10. 重置密码页面

- **路由**: `/admin/reset-password`
- **文件**: `app/admin/reset-password/page.tsx`
- **描述**: 重置密码页面，通过 token 设置新密码
- **功能**:
  - Token 验证
  - 新密码设置
  - 密码确认

## 布局文件

### 根布局

- **文件**: `app/layout.tsx`
- **描述**: 应用根布局，包含全局配置和上下文提供者
- **功能**:
  - 全局样式引入
  - 错误边界
  - 用户上下文提供
  - 国际化提供
  - 环境变量验证

## API 路由

### API 路由快速索引

| 路由                         | 文件路径                                 | 方法           | 说明                      |
| ---------------------------- | ---------------------------------------- | -------------- | ------------------------- |
| `/api/user/login`            | `app/api/user/login/route.ts`            | POST           | 用户登录                  |
| `/api/user/register`         | `app/api/user/register/route.ts`         | POST           | 用户注册                  |
| `/api/user/logout`           | `app/api/user/logout/route.ts`           | POST           | 用户退出登录              |
| `/api/user/me`               | `app/api/user/me/route.ts`               | GET            | 获取当前用户信息          |
| `/api/user/forgot-password`  | `app/api/user/forgot-password/route.ts`  | POST           | 忘记密码                  |
| `/api/user/reset-password`   | `app/api/user/reset-password/route.ts`   | POST           | 重置密码                  |
| `/api/admin/login`           | `app/api/admin/login/route.ts`           | POST           | 管理员登录                |
| `/api/admin/register`        | `app/api/admin/register/route.ts`        | POST           | 管理员注册                |
| `/api/admin/me`              | `app/api/admin/me/route.ts`              | GET            | 获取当前管理员信息        |
| `/api/admin/forgot-password` | `app/api/admin/forgot-password/route.ts` | POST           | 管理员忘记密码            |
| `/api/admin/reset-password`  | `app/api/admin/reset-password/route.ts`  | POST           | 管理员重置密码            |
| `/api/page/[slug]`           | `app/api/page/[slug]/route.ts`           | GET            | 获取指定用户的页面配置    |
| `/api/page/me`               | `app/api/page/me/route.ts`               | GET/PUT        | 获取/更新当前用户页面配置 |
| `/api/page/me/publish`       | `app/api/page/me/publish/route.ts`       | POST           | 发布当前用户页面          |
| `/api/page/me/upload`        | `app/api/page/me/upload/route.ts`        | POST           | 上传图片                  |
| `/api/news/articles`         | `app/api/news/articles/route.ts`         | GET/POST       | 获取/创建新闻文章列表     |
| `/api/news/articles/[id]`    | `app/api/news/articles/[id]/route.ts`    | GET/PUT/DELETE | 获取/更新/删除单篇新闻    |
| `/api/news`                  | `app/api/news/route.ts`                  | GET            | 新闻 API                  |

### 用户相关 API

- **登录**: `/api/user/login` → `app/api/user/login/route.ts`
- **注册**: `/api/user/register` → `app/api/user/register/route.ts`
- **退出登录**: `/api/user/logout` → `app/api/user/logout/route.ts`
- **获取当前用户**: `/api/user/me` → `app/api/user/me/route.ts`
- **忘记密码**: `/api/user/forgot-password` → `app/api/user/forgot-password/route.ts`
- **重置密码**: `/api/user/reset-password` → `app/api/user/reset-password/route.ts`

### 管理后台 API

- **登录**: `/api/admin/login` → `app/api/admin/login/route.ts`
- **注册**: `/api/admin/register` → `app/api/admin/register/route.ts`
- **获取当前用户**: `/api/admin/me` → `app/api/admin/me/route.ts`
- **忘记密码**: `/api/admin/forgot-password` → `app/api/admin/forgot-password/route.ts`
- **重置密码**: `/api/admin/reset-password` → `app/api/admin/reset-password/route.ts`

### 页面配置 API

- **获取页面配置**: `/api/page/[slug]` → `app/api/page/[slug]/route.ts`
- **获取当前用户页面配置**: `/api/page/me` → `app/api/page/me/route.ts`
- **发布页面**: `/api/page/me/publish` → `app/api/page/me/publish/route.ts`
- **上传图片**: `/api/page/me/upload` → `app/api/page/me/upload/route.ts`

### 新闻相关 API

- **获取新闻列表**: `/api/news/articles` → `app/api/news/articles/route.ts`
- **获取单篇新闻**: `/api/news/articles/[id]` → `app/api/news/articles/[id]/route.ts`
- **新闻 API**: `/api/news` → `app/api/news/route.ts`

## 特殊文件说明

### Loading 状态文件

Next.js 使用 `loading.tsx` 文件来显示页面加载状态：

- `app/news/loading.tsx` - 新闻列表页加载状态
- `app/news/[id]/loading.tsx` - 新闻详情页加载状态
- `app/u/[slug]/loading.tsx` - 用户页面加载状态

### 全局文件

- `app/globals.css` - 全局样式文件
- `app/globals.ts` - 全局配置和错误过滤器
- `app/favicon.ico` - 网站图标

## 路由规则说明

### Next.js App Router 路由规则

1. **文件系统路由**: 基于文件系统结构自动生成路由
2. **动态路由**: 使用 `[param]` 格式的文件夹名称创建动态路由
3. **布局嵌套**: `layout.tsx` 文件会应用到该目录及其子目录的所有页面
4. **加载状态**: `loading.tsx` 文件用于显示页面加载状态
5. **元数据**: 使用 `generateMetadata` 函数生成 SEO 元数据

### 路由示例

- `app/page.tsx` → `/`
- `app/news/page.tsx` → `/news`
- `app/news/[id]/page.tsx` → `/news/123` (其中 123 是动态 id)
- `app/u/[slug]/page.tsx` → `/u/username` (其中 username 是动态 slug)
- `app/admin/page.tsx` → `/admin`
- `app/admin/cms/page.tsx` → `/admin/cms`

## 快速查找指南

### 按功能查找

| 功能               | 文件/目录                                                                   | 说明               |
| ------------------ | --------------------------------------------------------------------------- | ------------------ |
| **首页**           | `app/page.tsx`                                                              | 重定向到管理后台   |
| **新闻列表**       | `app/news/page.tsx`                                                         | 显示所有已发布新闻 |
| **新闻详情**       | `app/news/[id]/page.tsx`                                                    | 显示单篇新闻详情   |
| **用户页面**       | `app/u/[slug]/page.tsx`                                                     | 用户个人页面       |
| **管理后台登录**   | `app/admin/page.tsx`                                                        | 管理员登录页       |
| **管理后台仪表板** | `app/admin/dashboard/page.tsx`                                              | 管理后台主页       |
| **CMS 编辑**       | `app/admin/cms/page.tsx`                                                    | 内容管理系统       |
| **用户注册**       | `app/admin/register/page.tsx`                                               | 用户注册页         |
| **密码重置**       | `app/admin/forgot-password/page.tsx`<br>`app/admin/reset-password/page.tsx` | 密码重置流程       |
| **API 接口**       | `app/api/` 目录                                                             | 所有 API 路由      |

### 按路由查找

1. **确定路由路径**（如 `/news/123`）
2. **将路径转换为文件路径**（如 `app/news/[id]/page.tsx`）
3. **动态参数用 `[param]` 表示**

#### 路由转换规则

- `/` → `app/page.tsx`
- `/news` → `app/news/page.tsx`
- `/news/[id]` → `app/news/[id]/page.tsx`
- `/u/[slug]` → `app/u/[slug]/page.tsx`
- `/admin` → `app/admin/page.tsx`
- `/admin/dashboard` → `app/admin/dashboard/page.tsx`
- `/admin/cms` → `app/admin/cms/page.tsx`
- `/admin/register` → `app/admin/register/page.tsx`
- `/admin/forgot-password` → `app/admin/forgot-password/page.tsx`
- `/admin/reset-password` → `app/admin/reset-password/page.tsx`

## 注意事项

1. **服务器组件 vs 客户端组件**:

   - 默认情况下，Next.js 组件是服务器组件
   - 使用 `"use client"` 指令的组件是客户端组件
   - 客户端组件通常用于需要交互或浏览器 API 的组件

2. **动态路由参数**:

   - 在 Next.js 13+ 中，动态路由参数通过 `params` prop 传递
   - `params` 是一个 Promise，需要使用 `await` 解包

3. **API 路由**:

   - API 路由文件必须命名为 `route.ts`
   - 导出 HTTP 方法函数（GET、POST、PUT、DELETE 等）

4. **加载状态**:
   - `loading.tsx` 文件会在页面加载时自动显示
   - 使用 Suspense 边界可以更精细地控制加载状态

## 重要组件说明

### NewsListSection 组件

- **文件**: `features/news-list/NewsListSection.tsx`
- **功能**: 显示新闻文章列表
- **参数**:
  - `slug` (可选): 用户 slug，用于过滤特定用户的文章
  - `limit` (可选): 显示的文章数量，默认 3
  - `background` (可选): 新闻页面背景配置
- **行为**:
  - 当提供 `slug` 时，只显示该用户的已发布文章
  - 当不提供 `slug` 时，显示所有用户的已发布文章
- **使用位置**:
  - `app/u/[slug]/page.tsx` - 用户个人页面（传递 slug，显示该用户的文章）
  - 其他位置可根据需要选择是否传递 slug

### getPublishedNewsArticles 函数

- **文件**: `domain/news/services.ts`
- **功能**: 服务端获取已发布的新闻文章
- **参数**:
  - `limit` (可选): 限制返回的文章数量
  - `category` (可选): 按分类过滤
  - `userSlug` (可选): 按用户 slug 过滤，只返回该用户的文章
- **返回**: `NewsArticle[]` 数组

## 更新日志

- 2024-12-XX: 更新文档，反映最新变更
  - 首页重定向到 `/admin`
  - 管理后台登录页移除返回按钮
  - NewsListSection 组件按用户过滤文章
  - 添加重要组件说明
- 2024-01-XX: 初始文档创建
