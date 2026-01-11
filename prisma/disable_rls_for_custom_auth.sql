-- ============================================
-- 禁用 RLS（适用于使用自定义认证的应用）
-- ============================================
-- 如果你的应用使用自定义认证系统（如 session、JWT），而不是 Supabase Auth
-- 可以执行此脚本来禁用 RLS，解决 Supabase 的警告
-- 
-- ⚠️ 警告：禁用 RLS 后，表的安全性完全依赖于应用层的权限控制
-- 确保你的应用有完善的权限验证机制

-- 禁用 BlogPost 表的 RLS
ALTER TABLE "BlogPost" DISABLE ROW LEVEL SECURITY;

-- 禁用 Product 表的 RLS
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;

-- 禁用 Order 表的 RLS
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;

-- 禁用 OrderItem 表的 RLS
ALTER TABLE "OrderItem" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 替代方案：创建服务角色策略（推荐）
-- ============================================
-- 如果你使用服务角色（service_role）来访问数据库，
-- 可以创建允许服务角色完全访问的策略，而不是完全禁用 RLS

-- 启用 RLS
-- ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- 创建服务角色策略（允许服务角色完全访问）
-- CREATE POLICY "Service role can do everything on BlogPost"
-- ON "BlogPost"
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Service role can do everything on Product"
-- ON "Product"
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Service role can do everything on Order"
-- ON "Order"
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Service role can do everything on OrderItem"
-- ON "OrderItem"
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);
