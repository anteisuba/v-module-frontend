# 部署检查清单

## ✅ 部署前检查

### 代码准备

- [x] 所有使用 Prisma 的 API 路由已添加 `runtime = "nodejs"`
- [x] `package.json` 已添加 `postinstall` 脚本
- [x] Prisma Client 单例模式已正确配置

### 环境变量准备

- [ ] AWS RDS 连接字符串已准备好
- [ ] Session 密码已生成（至少 32 字符）
- [ ] 邮件服务配置已准备好（SendGrid/Resend/AWS SES）
- [ ] 生产环境 URL 已确定

---

## 🚀 部署步骤

### 1. AWS RDS 设置

- [ ] 创建 PostgreSQL 实例
- [ ] 配置安全组（允许 Vercel IP 范围或 0.0.0.0/0）
- [ ] 获取连接字符串
- [ ] 测试本地连接

### 2. 代码部署到 Vercel

- [ ] 推送代码到 Git 仓库
- [ ] 在 Vercel 中导入项目
- [ ] 配置环境变量（见下方清单）
- [ ] 触发首次部署

### 3. 数据库迁移

- [ ] 在本地运行 `npx prisma migrate deploy`
- [ ] 验证迁移成功
- [ ] 检查数据库表结构

### 4. 功能验证

- [ ] 网站可以访问
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] 可以访问 CMS
- [ ] 可以上传图片
- [ ] 密码重置功能正常（发送和接收邮件）

---

## 🔐 Vercel 环境变量清单

复制以下变量到 Vercel 项目设置 → Environment Variables：

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
SESSION_PASSWORD=your-32-character-random-string
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**环境范围**：选择 "Production", "Preview", "Development"

---

## 📝 快速命令参考

### 生成 Session 密码

```bash
openssl rand -base64 32
```

### 运行生产环境迁移

```bash
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

### 检查迁移状态

```bash
npx prisma migrate status
```

### 验证数据库连接

```bash
npx prisma db pull
```

---

## ⚠️ 常见问题

### 问题：Prisma Client 未生成

**解决**：确保 `package.json` 中有 `postinstall` 脚本

### 问题：数据库连接失败

**解决**：

1. 检查 `DATABASE_URL` 格式
2. 检查 RDS 安全组规则
3. 确认 RDS 实例是 "Publicly accessible"

### 问题：邮件发送失败

**解决**：

1. 检查所有 SMTP 环境变量
2. 验证邮件服务账号状态
3. 检查生产环境日志

### 问题：迁移失败

**解决**：

1. 确保使用 `migrate deploy` 而不是 `migrate dev`
2. 检查数据库连接
3. 查看迁移文件是否有冲突
