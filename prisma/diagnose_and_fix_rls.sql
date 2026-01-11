-- ============================================
-- RLS 诊断和修复脚本
-- ============================================
-- 此脚本会：
-- 1. 检查当前 RLS 状态
-- 2. 清理可能存在的旧策略
-- 3. 启用 RLS 并创建允许所有访问的策略
-- 4. 验证修复结果

-- ============================================
-- 步骤 1: 检查当前状态
-- ============================================
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('BlogPost', 'Product', 'Order', 'OrderItem')
ORDER BY tablename;

-- ============================================
-- 步骤 2: 清理所有现有策略（避免冲突）
-- ============================================

-- BlogPost
DROP POLICY IF EXISTS "BlogPost allow all" ON "BlogPost";
DROP POLICY IF EXISTS "BlogPost is viewable by everyone if published" ON "BlogPost";
DROP POLICY IF EXISTS "BlogPost is viewable by author" ON "BlogPost";
DROP POLICY IF EXISTS "BlogPost is insertable by author" ON "BlogPost";
DROP POLICY IF EXISTS "BlogPost is updatable by author" ON "BlogPost";
DROP POLICY IF EXISTS "BlogPost is deletable by author" ON "BlogPost";
DROP POLICY IF EXISTS "Allow all access to BlogPost" ON "BlogPost";
DROP POLICY IF EXISTS "Service role can do everything on BlogPost" ON "BlogPost";

-- Product
DROP POLICY IF EXISTS "Product allow all" ON "Product";
DROP POLICY IF EXISTS "Product is viewable by everyone if published" ON "Product";
DROP POLICY IF EXISTS "Product is viewable by seller" ON "Product";
DROP POLICY IF EXISTS "Product is insertable by seller" ON "Product";
DROP POLICY IF EXISTS "Product is updatable by seller" ON "Product";
DROP POLICY IF EXISTS "Product is deletable by seller" ON "Product";
DROP POLICY IF EXISTS "Allow all access to Product" ON "Product";
DROP POLICY IF EXISTS "Service role can do everything on Product" ON "Product";

-- Order
DROP POLICY IF EXISTS "Order allow all" ON "Order";
DROP POLICY IF EXISTS "Order is viewable by seller" ON "Order";
DROP POLICY IF EXISTS "Order is viewable by buyer" ON "Order";
DROP POLICY IF EXISTS "Order is insertable by seller" ON "Order";
DROP POLICY IF EXISTS "Order is updatable by seller" ON "Order";
DROP POLICY IF EXISTS "Order is deletable by seller" ON "Order";
DROP POLICY IF EXISTS "Allow all access to Order" ON "Order";
DROP POLICY IF EXISTS "Service role can do everything on Order" ON "Order";

-- OrderItem
DROP POLICY IF EXISTS "OrderItem allow all" ON "OrderItem";
DROP POLICY IF EXISTS "OrderItem is viewable by order owner" ON "OrderItem";
DROP POLICY IF EXISTS "OrderItem is insertable by order owner" ON "OrderItem";
DROP POLICY IF EXISTS "OrderItem is updatable by order owner" ON "OrderItem";
DROP POLICY IF EXISTS "OrderItem is deletable by order owner" ON "OrderItem";
DROP POLICY IF EXISTS "Allow all access to OrderItem" ON "OrderItem";
DROP POLICY IF EXISTS "Service role can do everything on OrderItem" ON "OrderItem";

-- ============================================
-- 步骤 3: 启用 RLS 并创建策略
-- ============================================

-- BlogPost
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BlogPost_allow_all" ON "BlogPost" FOR ALL USING (true) WITH CHECK (true);

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product_allow_all" ON "Product" FOR ALL USING (true) WITH CHECK (true);

-- Order
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order_allow_all" ON "Order" FOR ALL USING (true) WITH CHECK (true);

-- OrderItem
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OrderItem_allow_all" ON "OrderItem" FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 步骤 4: 验证修复结果
-- ============================================

-- 检查 RLS 状态
SELECT 
    tablename,
    rowsecurity as "RLS Enabled",
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as "Status"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('BlogPost', 'Product', 'Order', 'OrderItem')
ORDER BY tablename;

-- 检查策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('BlogPost', 'Product', 'Order', 'OrderItem')
ORDER BY tablename, policyname;

-- ============================================
-- 完成提示
-- ============================================
-- 执行完此脚本后：
-- 1. 在 Supabase Dashboard 中点击 "Rerun linter"
-- 2. 等待几秒钟
-- 3. 刷新页面查看结果
