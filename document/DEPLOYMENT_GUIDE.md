# 部署指南

## 📝 重要说明

**部署不会自动获得域名**。你需要：

1. **购买域名**（可选，但推荐）

   - 如果没有域名，可以使用平台的默认域名（如 `your-app.vercel.app`）
   - 但 Resend 域名验证需要使用你自己的域名，不能使用 `.vercel.app` 这种平台域名

2. **部署到生产环境**
   - Vercel（推荐，与 Next.js 集成最好）
   - Netlify
   - 其他平台

## 🚀 部署到 Vercel（推荐）

### 前置准备

1. **GitHub 账号**（如果使用 GitHub 部署）
2. **Vercel 账号**（免费，使用 GitHub 登录）
3. **域名**（可选，如果需要自定义域名）

### 步骤 1：准备代码

确保代码已推送到 Git 仓库（GitHub、GitLab 等）：

```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 步骤 2：在 Vercel 部署

1. **访问 [Vercel](https://vercel.com)**

   - 使用 GitHub 账号登录

2. **导入项目**

   - 点击 "Add New Project"
   - 选择你的 Git 仓库
   - 点击 "Import"

3. **配置项目**

   - Framework Preset: **Next.js**（应该自动检测）
   - Root Directory: `./`（默认）
   - Build Command: `pnpm build`（或 `npm run build`）
   - Output Directory: `.next`（默认）

4. **配置环境变量**
   在部署前，需要添加以下环境变量：

   ```
   DATABASE_URL=你的生产数据库URL
   SESSION_PASSWORD=你的会话密钥（至少32字符）
   RESEND_API_KEY=re_你的API_KEY
   RESEND_FROM=onboarding@resend.dev  # 或验证域名后的邮箱
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app  # 部署后会更新
   ```

   - 在 "Environment Variables" 页面添加
   - 选择环境：Production、Preview、Development

5. **部署**

   - 点击 "Deploy"
   - 等待部署完成（通常 1-3 分钟）

6. **获得默认域名**
   - 部署成功后，Vercel 会提供一个默认域名：`your-app.vercel.app`
   - 可以在项目设置中查看和修改

### 步骤 3：配置自定义域名（可选）

如果你有自己的域名：

1. **在 Vercel 添加域名**

   - 进入项目 → Settings → Domains
   - 输入你的域名（如 `example.com`）
   - 按照提示添加 DNS 记录

2. **配置 DNS**

   - 在域名提供商处添加 CNAME 记录指向 Vercel
   - 或添加 A 记录指向 Vercel 的 IP

3. **等待 DNS 生效**
   - 通常需要几分钟到几小时

### 步骤 4：更新环境变量

部署完成后，更新 `NEXT_PUBLIC_BASE_URL`：

```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

或使用自定义域名：

```
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 🔒 配置 Resend 域名验证（生产环境推荐）

### 如果你有自己的域名

1. **在 Resend Dashboard 验证域名**

   - 访问 [resend.com/domains](https://resend.com/domains)
   - 添加你的域名
   - 配置 DNS 记录（SPF、DKIM、DMARC）
   - 验证域名

2. **更新 Vercel 环境变量**

   ```
   RESEND_FROM=noreply@your-domain.com
   ```

3. **重新部署**
   - Vercel 会自动重新部署，或手动触发重新部署

### 如果没有域名

- 继续使用 `onboarding@resend.dev`
- 功能正常，但邮件可能进入垃圾邮件文件夹
- 建议后续购买域名并验证

## 📦 数据库配置

### 推荐：使用 Supabase（免费且功能完整）

**为什么推荐 Supabase？**

- ✅ 免费套餐：500MB 数据库 + 2GB 带宽
- ✅ 功能完整：PostgreSQL 数据库，包含 Dashboard
- ✅ 易于使用：5 分钟即可配置完成
- ✅ 适合小型项目

**详细步骤请查看：** `document/DATABASE_SETUP.md`

**快速步骤：**

1. 访问 [Supabase](https://supabase.com) 并创建项目
2. 获取数据库连接字符串（Settings → Database → Connection string）
3. 在 Vercel 环境变量中配置 `DATABASE_URL`
4. 在本地运行迁移：`DATABASE_URL="你的Supabase连接字符串" pnpm db:migrate`
5. 重新部署应用

### 其他选项

- **Vercel Postgres**：与 Vercel 集成最好，免费套餐 256MB
- **Railway**：免费 $5 额度，适合小型项目
- **Neon**：免费 0.5GB，基于 PostgreSQL
- **AWS RDS**：**不推荐**小型项目使用（最小实例约 $15/月）

详细对比和配置步骤请查看：`document/DATABASE_SETUP.md`

## ✅ 部署后检查清单

- [ ] 代码已推送到 Git 仓库
- [ ] 在 Vercel 部署成功
- [ ] 环境变量已配置（DATABASE_URL、SESSION_PASSWORD、RESEND_API_KEY 等）
- [ ] 数据库已创建并运行迁移
- [ ] `NEXT_PUBLIC_BASE_URL` 已更新为生产 URL
- [ ] 网站可以正常访问
- [ ] 测试用户注册/登录功能
- [ ] 测试密码重置功能（检查邮件发送）
- [ ] （可选）配置自定义域名
- [ ] （推荐）验证 Resend 域名

## 🔍 常见问题

### Q: 部署后如何更新代码？

**A**:

1. 推送代码到 Git 仓库
2. Vercel 会自动检测并重新部署
3. 或手动在 Vercel Dashboard 触发重新部署

### Q: 如何使用自己的域名？

**A**:

1. 在 Vercel 项目设置中添加域名
2. 在域名提供商处配置 DNS 记录
3. 等待 DNS 生效
4. 更新 `NEXT_PUBLIC_BASE_URL` 环境变量

### Q: 必须购买域名吗？

**A**:

- **不必须**：可以使用 Vercel 的默认域名（`.vercel.app`）
- **推荐**：购买域名可以获得更好的品牌形象
- **Resend 验证**：要验证域名用于邮件发送，必须有自己的域名

### Q: 免费套餐有限制吗？

**A**:

- **Vercel**: 免费套餐足够用于个人项目和小型应用
- **数据库**: 需要使用免费数据库服务（如 Supabase、Railway、Neon）
- **Resend**: 免费套餐每月 100 封邮件

### Q: 如何查看部署日志？

**A**:

- 在 Vercel Dashboard → Deployments → 选择部署 → View Logs
- 可以查看构建日志和运行日志

## 📚 相关资源

- [Vercel 部署文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [Resend 域名验证](./RESEND_DOMAIN_VERIFICATION.md)
