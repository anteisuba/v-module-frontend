# vtuber-site

[中文](#中文) | [日本語](#日本語)

## 中文

面向 VTuber 站点的 Next.js App Router 项目，包含首页 Hero 视觉、后台登录/注册与 CMS 图片管理。

### 功能概览
- 首页 Hero：粘性滚动背景、自动轮播淡入淡出、缩略图切换
- 管理端登录/注册：基于 `iron-session` 的会话与 `bcryptjs` 密码校验
- CMS：上传/替换/删除 3 个 Hero Slot 图片，文件写入 `public/upload-img1`

### 页面与路由
- `/`：首页 Hero
- `/admin`：管理端登录
- `/admin/register`：管理端注册
- `/admin/cms`：Hero 图片管理

### API
- `POST /api/admin/register`：注册管理员
- `POST /api/admin/login`：登录并写入 session
- `GET /api/admin/me`：获取当前管理员信息
- `GET /api/admin/hero/slides`：读取 Hero 配置
- `POST /api/admin/hero/upload`：上传 Hero 图片（slot 1~3）
- `DELETE /api/admin/hero/slide?slot=1`：删除指定 slot

### 技术栈
- Next.js 16 / React 19（App Router）
- Tailwind CSS v4 + daisyUI
- Prisma + PostgreSQL
- iron-session、bcryptjs

### 数据库模型（Prisma）
- `AdminUser`：管理员账号
- `SiteConfig`：站点配置（`heroSlides` JSON）
- `MediaAsset`：媒体资源记录（当前未直接使用）

### 本地开发
1. 准备 PostgreSQL（可选）
   ```bash
   docker compose up -d
   ```
2. 配置环境变量 `.env`
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
   SESSION_PASSWORD=replace-with-a-long-random-string
   ```
3. 安装依赖并迁移数据库
   ```bash
   pnpm install
   npx prisma migrate dev
   ```
4. 启动开发服务器
   ```bash
   pnpm dev
   ```

---

## 日本語

VTuber 向けサイトの Next.js App Router プロジェクト。トップの Hero 表現、管理ログイン/登録、CMS 画像管理を備えています。

### 主な機能
- Hero セクション：スクロール追従、フェード切替、自動スライド、サムネイル選択
- 管理ログイン/登録：`iron-session` のセッションと `bcryptjs` のパスワード検証
- CMS：Hero の 3 枚をアップロード/差し替え/削除（`public/upload-img1` に保存）

### ページ/ルート
- `/`：トップ
- `/admin`：管理ログイン
- `/admin/register`：管理登録
- `/admin/cms`：Hero 画像管理

### API
- `POST /api/admin/register`
- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET /api/admin/hero/slides`
- `POST /api/admin/hero/upload`
- `DELETE /api/admin/hero/slide?slot=1`

### 技術スタック
- Next.js 16 / React 19（App Router）
- Tailwind CSS v4 + daisyUI
- Prisma + PostgreSQL
- iron-session、bcryptjs

### データモデル（Prisma）
- `AdminUser`：管理者
- `SiteConfig`：サイト設定（`heroSlides` JSON）
- `MediaAsset`：メディア資産（現状は未使用）

### ローカル開発
1. PostgreSQL を用意（任意）
   ```bash
   docker compose up -d
   ```
2. 環境変数 `.env`
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vtuber
   SESSION_PASSWORD=replace-with-a-long-random-string
   ```
3. 依存関係とマイグレーション
   ```bash
   pnpm install
   npx prisma migrate dev
   ```
4. 開発サーバー起動
   ```bash
   pnpm dev
   ```
