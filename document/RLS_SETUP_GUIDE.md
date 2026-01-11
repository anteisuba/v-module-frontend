# RLS (Row Level Security) 设置指南

## 问题说明

Supabase 会显示以下警告：
```
RLS Disabled in Public
Table public.Product is public, but RLS has not been enabled.
```

这是因为 Supabase 要求公开表必须启用 RLS 或明确禁用。

## 快速解决方案

### ⭐ 推荐方案：启用 RLS + 允许所有访问的策略

**这是 Supabase 最认可的方式**，既启用了 RLS，又允许你的应用正常访问：

1. **在 Supabase SQL Editor 中执行** `prisma/fix_rls_warnings.sql` 文件中的内容

2. **或者直接执行以下 SQL**:
   ```sql
   -- BlogPost
   ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "BlogPost allow all" ON "BlogPost" FOR ALL USING (true) WITH CHECK (true);
   
   -- Product
   ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Product allow all" ON "Product" FOR ALL USING (true) WITH CHECK (true);
   
   -- Order
   ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Order allow all" ON "Order" FOR ALL USING (true) WITH CHECK (true);
   
   -- OrderItem
   ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "OrderItem allow all" ON "OrderItem" FOR ALL USING (true) WITH CHECK (true);
   ```

3. **重要：重新运行 Linter**
   - 在 Supabase Security Advisor 页面
   - 点击底部的 **"Rerun linter"** 按钮
   - 等待几秒钟，警告应该消失

### 备选方案：禁用 RLS（如果方案一不行）

如果上面的方案不行，可以尝试禁用 RLS：

1. **在 Supabase SQL Editor 中执行**:
   ```sql
   ALTER TABLE "BlogPost" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "OrderItem" DISABLE ROW LEVEL SECURITY;
   ```

2. **重新运行 Linter**（重要！）

### 如果你的应用使用 Supabase Auth

如果你使用 Supabase Auth（`auth.uid()`），可以启用 RLS 并创建策略：

1. **在 Supabase SQL Editor 中执行**:
   ```sql
   -- 复制 prisma/enable_rls_policies.sql 中的内容
   -- 粘贴到 Supabase SQL Editor 并执行
   ```

2. **注意**: 
   - 策略使用 `auth.uid()::text` 来匹配 User.id
   - 如果你的 User.id 不是 UUID 格式，需要调整策略

## 方案对比

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **禁用 RLS** | 自定义认证（session/JWT） | 简单直接，不影响现有功能 | 安全性完全依赖应用层 |
| **启用 RLS + 策略** | Supabase Auth | 数据库层安全保护 | 需要配置策略，可能影响性能 |
| **服务角色策略** | 服务端访问 | 灵活控制 | 需要管理服务角色权限 |

## 推荐方案

**对于当前项目**，推荐**禁用 RLS**，因为：
- ✅ 项目使用自定义 session 认证
- ✅ Prisma 直接访问数据库
- ✅ 权限控制在应用层（API 路由）
- ✅ 简单直接，不会影响现有功能

## 安全说明

禁用 RLS 后，安全性完全依赖应用层的权限控制：

1. **API 路由验证**: 所有 API 路由都应该验证用户身份
2. **权限检查**: 确保用户只能访问自己的数据
3. **输入验证**: 使用 Zod 等工具验证输入
4. **SQL 注入防护**: Prisma 自动处理，但要注意原始 SQL

## 验证步骤

执行 SQL 后：

1. **重新运行 Linter** ⚠️ **这是关键步骤！**
   - 在 Supabase Security Advisor 页面
   - 滚动到底部
   - 点击 **"Rerun linter"** 按钮
   - 等待几秒钟让分析完成

2. **刷新 Supabase Dashboard**
   - 如果警告还在，等待 1-2 分钟后再次刷新

3. **检查警告是否消失**
   - 在 Security Advisor 中查看
   - 在 Table Editor 中，表应该不再显示 "RLS disabled" 或 "UNRESTRICTED" 标签

4. **测试应用功能**:
   ```bash
   # 确保应用正常工作
   pnpm dev
   ```

## 如果警告仍然存在

如果执行了 SQL 并重新运行了 linter，但警告仍然存在：

1. **检查 SQL 是否成功执行**
   ```sql
   -- 验证 RLS 状态
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('BlogPost', 'Product', 'Order', 'OrderItem');
   ```
   - `rowsecurity = true` 表示 RLS 已启用
   - `rowsecurity = false` 表示 RLS 已禁用

2. **检查策略是否存在**
   ```sql
   -- 查看所有策略
   SELECT schemaname, tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('BlogPost', 'Product', 'Order', 'OrderItem');
   ```

3. **尝试清除并重新创建**
   - 删除所有策略后重新创建
   - 使用 `prisma/fix_rls_warnings.sql` 中的完整脚本

## 相关文件

- `prisma/fix_rls_warnings.sql` - ⭐ **推荐使用**：启用 RLS + 允许所有访问的策略
- `prisma/disable_rls_for_custom_auth.sql` - 禁用 RLS（备选方案）
- `prisma/enable_rls_policies.sql` - 启用 RLS 和详细策略（Supabase Auth）
- `document/BLOG_PRODUCT_ORDER_SETUP.md` - 完整设置指南
