# vtuber-site

[中文](#中文) | [日本語](#日本語)

## 中文

面向 VTuber 的多用户页面管理系统，基于 Next.js App Router 构建。每个用户可以创建和自定义自己的公开页面。

### 功能概览

- **多用户系统**：用户注册、登录、密码重置
- **页面配置系统**：支持草稿和发布版本，配置驱动渲染
- **用户公开页面**：`/u/[slug]` 动态路由展示用户发布的页面
- **CMS 编辑器**：可视化编辑页面配置（背景、Hero Section、Links、Gallery）
- **图片管理**：支持本地图片上传和外部图片 URL
- **首页 Hero**：粘性滚动背景、自动轮播淡入淡出、缩略图切换

### 页面与路由

#### 公开页面

- `/`：首页 Hero（固定模板）
- `/u/[slug]`：用户公开页面（例如：`/u/testuser`）

#### 用户管理

- `/admin`：用户登录
- `/admin/register`：用户注册
- `/admin/forgot-password`：忘记密码（请求重置链接）
- `/admin/reset-password?token=xxx`：重置密码（设置新密码）
- `/admin/cms`：页面编辑器（需要登录）

### API

#### 用户相关

- `POST /api/user/register`：注册新用户
- `POST /api/user/login`：用户登录
- `GET /api/user/me`：获取当前用户信息（需要认证）
- `POST /api/user/forgot-password`：请求密码重置链接
- `POST /api/user/reset-password`：重置密码

#### 页面配置相关

- `GET /api/page/[slug]`：获取用户的公开页面配置（无需认证）
- `GET /api/page/me`：获取当前用户的草稿配置（需要认证）
- `PUT /api/page/me`：更新当前用户的草稿配置（需要认证）
- `POST /api/page/me/publish`：发布草稿配置（需要认证）
- `POST /api/page/me/upload`：上传图片（需要认证）

### 技术栈

- **框架**：Next.js 16 / React 19（App Router）
- **样式**：Tailwind CSS v4 + daisyUI
- **数据库**：Prisma + PostgreSQL
- **认证**：iron-session、bcryptjs
- **验证**：Zod

### 数据库模型（Prisma）

- `User`：用户账号（slug、email、passwordHash）
- `Page`：页面配置（draftConfig、publishedConfig）
- `UserPasswordResetToken`：密码重置 token（24 小时过期，一次性使用）

### 项目结构

```
vtuber-site/
├── app/                    # Next.js 路由层
│   ├── page.tsx           # 首页
│   ├── admin/             # 用户管理页面
│   ├── u/[slug]/          # 用户公开页面
│   └── api/               # API 路由
│       ├── user/          # 用户相关 API
│       └── page/          # 页面配置 API
├── features/              # 功能域（Feature-Sliced Design）
│   ├── home-hero/         # 首页 Hero 功能
│   ├── admin-auth/        # 用户认证功能
│   └── page-renderer/     # 页面渲染器
├── domain/                # 业务领域层
│   ├── page-config/       # 页面配置领域
│   └── hero/              # Hero 领域
├── lib/                   # 工具层
│   ├── validation/        # Zod 校验 schemas
│   ├── session/           # Session 管理
│   └── prisma.ts          # Prisma Client
└── prisma/                # 数据库
    └── schema.prisma      # 数据库模型
```

### 本地开发

1. **准备 PostgreSQL**

   ```bash
   docker compose up -d
   ```

2. **配置环境变量 `.env`**

   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
   SESSION_PASSWORD=replace-with-a-long-random-string

   # 邮件服务配置（密码重置功能需要）
   # 开发环境：可以不配置，邮件内容会输出到控制台
   # 生产环境：需要配置 SMTP 服务
   #
   # 推荐使用 Resend（最简单）：
   # SMTP_HOST=smtp.resend.com
   # SMTP_PORT=587
   # SMTP_USER=resend
   # SMTP_PASSWORD=re_你的API_KEY
   # SMTP_FROM=noreply@resend.dev
   #
   # 详细配置指南请查看 SMTP_SETUP_GUIDE.md

   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASSWORD=your-resend-api-key
   SMTP_FROM=noreply@resend.dev
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **安装依赖并迁移数据库**

   ```bash
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   ```

4. **启动开发服务器**

   ```bash
   pnpm dev
   ```

5. **访问应用**
   - 首页：http://localhost:3000
   - 登录：http://localhost:3000/admin
   - 测试用户页面：http://localhost:3000/u/testuser

### 开发命令

```bash
# 数据库迁移
pnpm db:migrate

# 数据库 seed（创建测试用户）
pnpm db:seed

# 打开 Prisma Studio
pnpm db:studio

# 开发服务器
pnpm dev

# 构建
pnpm build
```

### 测试用户

运行 `pnpm db:seed` 后会创建测试用户：

- Email: `test@example.com`
- Password: `123456`
- Slug: `testuser`

---

## 日本語

VTuber 向けのマルチユーザーページ管理システム。Next.js App Router で構築されています。各ユーザーが自分の公開ページを作成・カスタマイズできます。

### 主な機能

- **マルチユーザーシステム**：ユーザー登録、ログイン、パスワードリセット
- **ページ設定システム**：下書きと公開版をサポート、設定駆動レンダリング
- **ユーザー公開ページ**：`/u/[slug]` 動的ルートでユーザーの公開ページを表示
- **CMS エディター**：ページ設定を視覚的に編集（背景、Hero Section、Links、Gallery）
- **画像管理**：ローカル画像アップロードと外部画像 URL をサポート
- **トップ Hero**：スクロール追従、フェード切替、自動スライド、サムネイル選択

### ページ/ルート

#### 公開ページ

- `/`：トップページ Hero（固定テンプレート）
- `/u/[slug]`：ユーザー公開ページ（例：`/u/testuser`）

#### ユーザー管理

- `/admin`：ユーザーログイン
- `/admin/register`：ユーザー登録
- `/admin/forgot-password`：パスワード忘れ（リセットリンク要求）
- `/admin/reset-password?token=xxx`：パスワードリセット（新パスワード設定）
- `/admin/cms`：ページエディター（ログイン必要）

### API

#### ユーザー関連

- `POST /api/user/register`：新規ユーザー登録
- `POST /api/user/login`：ユーザーログイン
- `GET /api/user/me`：現在のユーザー情報取得（認証必要）
- `POST /api/user/forgot-password`：パスワードリセットリンク要求
- `POST /api/user/reset-password`：パスワードリセット

#### ページ設定関連

- `GET /api/page/[slug]`：ユーザーの公開ページ設定取得（認証不要）
- `GET /api/page/me`：現在のユーザーの下書き設定取得（認証必要）
- `PUT /api/page/me`：現在のユーザーの下書き設定更新（認証必要）
- `POST /api/page/me/publish`：下書き設定を公開（認証必要）
- `POST /api/page/me/upload`：画像アップロード（認証必要）

### 技術スタック

- **フレームワーク**：Next.js 16 / React 19（App Router）
- **スタイル**：Tailwind CSS v4 + daisyUI
- **データベース**：Prisma + PostgreSQL
- **認証**：iron-session、bcryptjs
- **検証**：Zod

### データモデル（Prisma）

- `User`：ユーザーアカウント（slug、email、passwordHash）
- `Page`：ページ設定（draftConfig、publishedConfig）
- `UserPasswordResetToken`：パスワードリセットトークン（24 時間有効期限、一回限り）

### ローカル開発

1. **PostgreSQL を用意**

   ```bash
   docker compose up -d
   ```

2. **環境変数 `.env`**

   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
   SESSION_PASSWORD=replace-with-a-long-random-string
   ```

3. **依存関係とマイグレーション**

   ```bash
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   ```

4. **開発サーバー起動**
   ```bash
   pnpm dev
   ```
