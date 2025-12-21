# 运行数据库迁移指南

## 🎯 目标

在生产数据库（Supabase）中创建必要的表结构（User、Page、UserPasswordResetToken 等）。

## 📋 步骤

### 步骤 1：设置数据库连接字符串

在终端中设置环境变量（使用 Supabase Transaction Pooler 连接字符串）：

```bash
export DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:qazyang123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**或者**一行运行（推荐）：

```bash
DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:qazyang123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" npx prisma migrate deploy
```

### 步骤 2：运行迁移

使用 `prisma migrate deploy`（生产环境推荐）：

```bash
npx prisma migrate deploy
```

**完整命令（一行）**：

```bash
DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:qazyang123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" npx prisma migrate deploy
```

### 步骤 3：验证迁移成功

迁移成功后，你应该看到类似输出：

```
Applying migration `20241220_xxxxx_init`
✔ Migration applied successfully
```

### 步骤 4：验证数据库表

你可以使用 Prisma Studio 查看数据库表（可选）：

```bash
# 设置 DATABASE_URL
export DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:qazyang123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 启动 Prisma Studio
npx prisma studio
```

或者在 Supabase Dashboard 中查看：
- 进入 Supabase Dashboard → Table Editor
- 应该能看到：`User`、`Page`、`UserPasswordResetToken`、`MediaAsset` 等表

## ⚠️ 注意事项

### 1. 使用 `migrate deploy` 而不是 `migrate dev`

- ✅ **生产环境**：使用 `prisma migrate deploy`
- ❌ **不要使用**：`prisma migrate dev`（这是开发环境使用的）

### 2. Transaction Pooler vs Direct Connection

- **迁移时**：可以使用 Transaction Pooler（端口 6543）或 Direct Connection（端口 5432）
- **应用运行时**：推荐使用 Transaction Pooler（适合 Serverless 环境）

如果使用 Transaction Pooler 迁移失败，可以尝试 Direct Connection：

```bash
# Direct Connection（用于迁移，如果需要）
DATABASE_URL="postgresql://postgres.jjhxhadkkkuduzajsinz:qazyang123@db.jjhxhadkkkuduzajsinz.supabase.co:5432/postgres" npx prisma migrate deploy
```

### 3. 检查迁移文件

确保 `prisma/migrations` 目录下有迁移文件：

```bash
ls -la prisma/migrations/
```

如果迁移文件不存在，需要先创建：

```bash
# 只在开发环境使用
pnpm db:migrate
```

## 🔍 常见问题

### Q: 迁移失败，提示连接错误？

**A**: 
1. 检查 DATABASE_URL 是否正确
2. 检查密码是否正确
3. 检查 Supabase 数据库是否已创建并运行
4. 尝试使用 Direct Connection（端口 5432）

### Q: 迁移失败，提示表已存在？

**A**: 
- 可能已经运行过迁移
- 检查 Supabase Dashboard → Table Editor，看看表是否已存在
- 如果表已存在，可以跳过迁移，直接使用

### Q: 迁移成功但应用仍然报错？

**A**: 
1. 确认 Vercel 环境变量中的 `DATABASE_URL` 已正确配置
2. 重新部署应用
3. 检查 Vercel 日志查看具体错误

## ✅ 完成后的检查清单

- [ ] 迁移命令已成功执行
- [ ] 在 Supabase Dashboard 中可以看到所有表（User、Page、UserPasswordResetToken、MediaAsset）
- [ ] Vercel 环境变量中的 `DATABASE_URL` 已配置
- [ ] 应用已重新部署
- [ ] 测试注册/登录功能是否正常

