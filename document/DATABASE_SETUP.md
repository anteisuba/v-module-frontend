# 生产数据库配置指南

## 📊 数据库服务对比

| 服务 | 免费套餐 | 适合场景 | 备注 |
|------|---------|---------|------|
| **Supabase** | ✅ 500MB 数据库 + 2GB 带宽 | 小型项目、开发测试 | **推荐** |
| **Vercel Postgres** | ✅ 256MB + 60 小时计算 | Vercel 项目 | 与 Vercel 集成最好 |
| **Railway** | ✅ $5 免费额度 | 小型项目 | 超出后按量付费 |
| **Neon** | ✅ 0.5GB 数据库 | 小型项目 | 基于 PostgreSQL |
| **AWS RDS** | ❌ 不免费 | 大型生产环境 | 最小实例约 $15/月 |

**推荐：Supabase**（免费且功能完整）

## 🚀 使用 Supabase（推荐）

### 步骤 1：创建 Supabase 项目

1. **访问 [Supabase](https://supabase.com)**
   - 使用 GitHub 账号登录（推荐）

2. **创建新项目**
   - 点击 "New Project"
   - 填写项目信息：
     - **Name**: `vtuber-site`（或你喜欢的名称）
     - **Database Password**: 设置一个强密码（**保存好，后续需要**）
     - **Region**: 选择靠近用户的地区（如 `Southeast Asia (Singapore)`）
   - 点击 "Create new project"

3. **等待项目创建**
   - 通常需要 1-2 分钟

### 步骤 2：获取数据库连接字符串

1. **进入项目设置**
   - 在项目 Dashboard，点击左侧 **Settings**（⚙️ 图标）
   - 选择 **Database**
   - 或点击项目右上角的 **"Connect"** 按钮

2. **获取连接字符串（重要：使用 Transaction Pooler）**
   - 在连接设置页面，确保 **Method** 选择 **"Transaction pooler"**（不是 "Direct connection"）
   - Transaction pooler 适合 Serverless 环境（如 Vercel），且支持 IPv4
   - 复制连接字符串，格式类似：
     ```
     postgresql://postgres.jjhxhadkkkuduzajsinz:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
     ```
   - **替换 `[YOUR-PASSWORD]` 为你创建项目时设置的密码**
   - **添加 `?pgbouncer=true` 参数**（如果使用 Prisma）

### 步骤 3：在 Vercel 配置环境变量

1. **进入 Vercel Dashboard**
   - 项目 → Settings → Environment Variables

2. **更新 DATABASE_URL**
   - 找到 `DATABASE_URL` 变量
   - 点击右侧的菜单（三个点）→ **Edit**
   - 粘贴 Supabase 的连接字符串
   - 确保选择了 **Production** 环境
   - 点击 **Save**

3. **确认其他环境变量**
   - `SESSION_PASSWORD` ✅（已配置）
   - `RESEND_API_KEY` ✅（已配置）
   - `RESEND_FROM` ✅（已配置）
   - `NEXT_PUBLIC_BASE_URL` - 需要设置为 `https://v-module-frontend.vercel.app`

### 步骤 4：运行数据库迁移

在本地运行迁移（使用生产数据库 URL）：

**重要**：迁移时建议使用 **Direct Connection**（端口 5432），而不是 Transaction Pooler（端口 6543），因为迁移需要直接连接数据库。

```bash
# 方法 1：使用 Direct Connection（推荐用于迁移）
DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:你的密码@db.jjhxhadkkkuduzajsinz.supabase.co:5432/postgres" npx prisma migrate deploy

# 方法 2：使用 Transaction Pooler（如果方法 1 失败可以尝试）
DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:你的密码@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" npx prisma migrate deploy
```

**获取 Direct Connection 字符串**：
- 在 Supabase Dashboard → Settings → Database → Connection string
- 选择 **Method: Direct connection**（不是 Transaction pooler）
- 复制连接字符串

**注意**：
- 使用 `prisma migrate deploy` 而不是 `prisma migrate dev`（生产环境推荐）
- 迁移后，应用运行时仍然使用 Transaction Pooler（端口 6543），因为适合 Serverless 环境

### 步骤 5：重新部署

1. **重新部署应用**
   - 在 Vercel Dashboard → Deployments
   - 点击最新部署右侧的 "..." → **Redeploy**

2. **等待部署完成**

### 步骤 6：验证

1. **测试注册功能**
   - 访问 `https://v-module-frontend.vercel.app/admin/register`
   - 尝试注册一个新用户

2. **测试登录功能**
   - 访问 `https://v-module-frontend.vercel.app/admin`
   - 使用注册的账号登录

## 🔍 Supabase 免费套餐限制

- **数据库大小**: 500MB
- **带宽**: 2GB/月
- **API 请求**: 50,000/月
- **文件存储**: 1GB

对于小型项目，这些限制通常足够使用。

## 🆚 如果使用 AWS RDS

### 成本

- **最小实例** (db.t3.micro): 约 $15/月
- **加上存储**: 额外费用
- **数据传输**: 超出免费额度后收费

### 配置步骤

1. **创建 RDS PostgreSQL 实例**
2. **配置安全组**（允许 Vercel IP 范围）
3. **获取连接字符串**
4. **在 Vercel 配置 DATABASE_URL**

**不推荐**用于小型项目，成本较高。

## ✅ 检查清单

- [ ] Supabase 项目已创建
- [ ] 数据库连接字符串已获取
- [ ] `DATABASE_URL` 已在 Vercel 配置（Production 环境）
- [ ] 数据库迁移已运行
- [ ] `NEXT_PUBLIC_BASE_URL` 已设置为生产 URL
- [ ] 应用已重新部署
- [ ] 注册/登录功能已测试

## 🔗 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase 免费套餐详情](https://supabase.com/pricing)
- [Prisma 迁移指南](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

