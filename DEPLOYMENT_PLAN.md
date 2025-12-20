# 生产环境部署计划

## 📋 概述

本计划将项目部署到：

- **前端**: Vercel (Next.js)
- **数据库**: AWS RDS PostgreSQL

---

## 🔍 需要修改的文件列表

### 代码修改（最小改动）

1. **API 路由 - 添加 runtime 配置**

   - `app/api/admin/login/route.ts` - 添加 `export const runtime = "nodejs"`
   - `app/api/admin/register/route.ts` - 添加 `export const runtime = "nodejs"`
   - `app/api/admin/forgot-password/route.ts` - 添加 `export const runtime = "nodejs"`
   - `app/api/admin/reset-password/route.ts` - 添加 `export const runtime = "nodejs"`
   - `app/api/admin/me/route.ts` - 添加 `export const runtime = "nodejs"`（虽然不使用 Prisma，但使用 session，建议添加）

2. **Next.js 配置**

   - `next.config.ts` - 确保 Prisma 在构建时正确生成

3. **构建脚本**
   - `package.json` - 添加 `postinstall` 脚本用于 Prisma 生成

### 配置文件（新建）

4. **Vercel 配置**
   - `vercel.json` - 可选，用于配置构建命令和环境变量

---

## 🔐 环境变量清单

### 必需环境变量（Vercel）

#### 数据库连接

- `DATABASE_URL` - PostgreSQL 连接字符串（从 AWS RDS 获取）

#### Session 安全

- `SESSION_PASSWORD` - 用于 iron-session 加密的密码（至少 32 字符）

#### 邮件服务（生产环境必需）

- `SMTP_HOST` - SMTP 服务器地址
- `SMTP_PORT` - SMTP 端口（通常 587 或 465）
- `SMTP_USER` - SMTP 用户名
- `SMTP_PASSWORD` - SMTP 密码或应用密码
- `SMTP_FROM` - 发件人邮箱地址（可选，默认使用 SMTP_USER）

#### 应用 URL

- `NEXT_PUBLIC_BASE_URL` - 生产环境域名（例如：`https://your-domain.vercel.app`）

### 可选环境变量

- `NODE_ENV` - Vercel 自动设置为 `production`

---

## 📝 部署步骤

### 阶段 1: AWS RDS 数据库设置

#### 1.1 创建 RDS PostgreSQL 实例

1. 登录 AWS Console，进入 RDS 服务
2. 点击 "Create database"
3. 选择配置：
   - **Engine**: PostgreSQL
   - **Version**: 16.x（或最新稳定版）
   - **Template**: Free tier（个人项目）或 Production（生产环境）
   - **DB instance identifier**: `vtuber-db`（自定义）
   - **Master username**: `postgres`（或自定义）
   - **Master password**: 生成强密码并保存
   - **DB instance class**:
     - 免费层：`db.t3.micro` 或 `db.t4g.micro`
     - 生产：`db.t3.small` 或更高
   - **Storage**:
     - 类型：General Purpose SSD (gp3)
     - 大小：20 GB（最小，可根据需要增加）
   - **VPC**: 默认 VPC 或创建新 VPC
   - **Public access**: **Yes**（如果选择公共访问，见安全组配置）
   - **Security group**: 创建新的安全组（见下一步）

#### 1.2 配置安全组（Security Group）

**选项 A: 公共访问（推荐用于小型项目 + Vercel）**

1. 创建新的安全组：`vtuber-db-sg`
2. 添加入站规则：
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: `0.0.0.0/0`（允许所有 IP，因为 Vercel 没有固定 IP）
   - **Description**: "Allow Vercel connections"

**安全建议**：

- 使用强密码
- 定期轮换密码
- 考虑使用 AWS Secrets Manager 管理密码
- 监控数据库访问日志

**选项 B: 私有访问（更安全，但需要 VPN 或 AWS Lambda）**

1. 将 RDS 放在私有子网
2. 使用 AWS Lambda 作为数据库代理
3. 或使用 AWS Systems Manager Session Manager 通过 SSH 隧道连接

**推荐**：对于个人项目，选项 A 更简单，配合强密码和定期监控即可。

#### 1.3 获取连接信息

创建完成后，在 RDS 控制台找到：

- **Endpoint**: `vtuber-db.xxxxx.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database name**: `postgres`（默认）或自定义
- **Username**: 创建时设置的主用户名
- **Password**: 创建时设置的主密码

**连接字符串格式**：

```
postgresql://username:password@endpoint:port/database?sslmode=require
```

示例：

```
postgresql://postgres:YourPassword@vtuber-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require
```

#### 1.4 测试连接（本地）

在本地 `.env` 文件中添加 `DATABASE_URL`，然后测试：

```bash
npx prisma db pull  # 测试连接
```

---

### 阶段 2: 代码准备

#### 2.1 修复 API 路由 runtime 配置

为所有使用 Prisma 的 API 路由添加 `runtime = "nodejs"`。

#### 2.2 更新 package.json

添加 `postinstall` 脚本，确保 Prisma Client 在 Vercel 构建时生成。

#### 2.3 验证 Prisma 配置

确保 `lib/prisma.ts` 中的单例模式正确（已正确配置）。

---

### 阶段 3: Vercel 部署

#### 3.1 准备 Vercel 项目

1. 登录 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 GitHub/GitLab/Bitbucket 仓库
4. 或使用 Vercel CLI：
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

#### 3.2 配置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

**必需变量**：

- `DATABASE_URL` - 从 AWS RDS 获取
- `SESSION_PASSWORD` - 至少 32 字符的随机字符串
- `SMTP_HOST` - SMTP 服务器
- `SMTP_PORT` - SMTP 端口
- `SMTP_USER` - SMTP 用户名
- `SMTP_PASSWORD` - SMTP 密码
- `SMTP_FROM` - 发件人邮箱（可选）
- `NEXT_PUBLIC_BASE_URL` - 生产环境 URL（例如：`https://your-app.vercel.app`）

**环境范围**：选择 "Production", "Preview", "Development"（根据需要）

#### 3.3 配置构建设置

在 Vercel 项目设置 → General → Build & Development Settings：

- **Framework Preset**: Next.js（自动检测）
- **Build Command**: `pnpm build`（或 `npm run build`）
- **Output Directory**: `.next`（默认）
- **Install Command**: `pnpm install`（或 `npm install`）

#### 3.4 首次部署

1. 推送代码到 Git 仓库
2. Vercel 会自动触发部署
3. 或手动部署：`vercel --prod`

---

### 阶段 4: 数据库迁移

#### 4.1 运行生产环境迁移

**重要**：使用 `prisma migrate deploy`，**不要**使用 `migrate dev`。

**选项 A: 在本地运行（推荐）**

```bash
# 设置生产环境 DATABASE_URL
export DATABASE_URL="postgresql://..."

# 运行迁移
npx prisma migrate deploy
```

**选项 B: 在 Vercel Build 命令中运行（不推荐）**

虽然可以在构建时运行，但不推荐，因为：

- 每次部署都会尝试运行迁移
- 如果迁移失败，整个部署会失败
- 无法单独回滚迁移

**推荐流程**：

1. 代码部署到 Vercel
2. 在本地或 CI/CD 中运行 `prisma migrate deploy`
3. 验证迁移成功

#### 4.2 验证迁移

```bash
# 检查迁移状态
npx prisma migrate status

# 应该显示：Database schema is up to date!
```

---

### 阶段 5: 邮件服务配置

#### 5.1 选择邮件服务

**选项 A: SendGrid（推荐）**

- 免费层：100 封/天
- 易于配置
- 良好的送达率

**选项 B: Resend**

- 免费层：3000 封/月
- 专为开发者设计
- 简单的 API

**选项 C: AWS SES**

- 与 AWS RDS 集成方便
- 成本低（$0.10/1000 封）
- 需要验证域名

**选项 D: Gmail SMTP**

- 免费，但有限制
- 需要应用专用密码
- 不推荐用于生产环境

#### 5.2 配置 SendGrid（示例）

1. 注册 SendGrid 账号
2. 创建 API Key（Settings → API Keys）
3. 验证发件人邮箱（Sender Authentication）
4. 在 Vercel 环境变量中设置：
   - `SMTP_HOST=smtp.sendgrid.net`
   - `SMTP_PORT=587`
   - `SMTP_USER=apikey`
   - `SMTP_PASSWORD=<your-sendgrid-api-key>`
   - `SMTP_FROM=noreply@yourdomain.com`

#### 5.3 验证邮件发送

部署后，测试密码重置功能，确认邮件正常发送。

---

## ⚠️ 重要注意事项

### Prisma 在 Serverless 环境

1. **Prisma Client 单例**：已正确配置在 `lib/prisma.ts`
2. **Runtime 配置**：所有使用 Prisma 的 API 路由必须设置 `runtime = "nodejs"`
3. **Edge Runtime 限制**：Prisma 不支持 Edge Runtime，必须使用 Node.js Runtime

### 数据库迁移最佳实践

✅ **应该做**：

- 使用 `prisma migrate deploy` 在生产环境
- 在部署前测试迁移
- 备份数据库后再运行迁移
- 使用事务确保迁移原子性

❌ **不应该做**：

- 使用 `prisma migrate dev` 在生产环境
- 使用 `prisma db push` 在生产环境
- 在生产环境直接修改数据库结构

### 安全考虑

1. **数据库密码**：使用强密码，定期轮换
2. **Session 密码**：至少 32 字符的随机字符串
3. **环境变量**：不要在代码中硬编码
4. **HTTPS**：Vercel 自动提供 HTTPS
5. **CORS**：根据需要配置（当前项目不需要）

### 邮件服务

1. **生产环境必须配置**：否则密码重置功能无法工作
2. **域名验证**：使用自己的域名发送邮件（提高送达率）
3. **SPF/DKIM 记录**：配置 DNS 记录以提高邮件送达率

---

## 🧪 部署后验证清单

- [ ] 网站可以正常访问
- [ ] 数据库连接正常（可以登录/注册）
- [ ] Session 功能正常（登录后可以访问 CMS）
- [ ] 密码重置功能正常（可以发送和接收邮件）
- [ ] 文件上传功能正常（Hero 图片上传）
- [ ] 所有 API 端点响应正常
- [ ] 生产环境日志无错误

---

## 📚 参考资源

- [Vercel 部署文档](https://vercel.com/docs)
- [AWS RDS 文档](https://docs.aws.amazon.com/rds/)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [SendGrid 文档](https://docs.sendgrid.com/)

---

## 🔄 后续维护

### 数据库备份

- 定期备份 RDS 数据库（AWS 自动备份或手动快照）
- 测试恢复流程

### 监控

- 设置 Vercel 监控和告警
- 监控 RDS 性能指标
- 设置邮件发送失败告警

### 更新

- 定期更新依赖包
- 定期更新 Prisma 和数据库驱动
- 定期检查安全更新
