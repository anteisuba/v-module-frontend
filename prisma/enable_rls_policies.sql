-- ============================================
-- 启用 Row Level Security (RLS) 并创建策略
-- ============================================
-- 此脚本为 BlogPost, Product, Order, OrderItem 表启用 RLS 并创建安全策略
-- 执行此脚本可以解决 Supabase 的 RLS 警告

-- ============================================
-- BlogPost 表 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有人可以查看已发布的博客文章
CREATE POLICY "BlogPost is viewable by everyone if published"
ON "BlogPost"
FOR SELECT
USING (published = true);

-- 策略 2: 作者可以查看自己的所有博客文章（包括未发布的）
CREATE POLICY "BlogPost is viewable by author"
ON "BlogPost"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "BlogPost"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 3: 作者可以创建自己的博客文章
CREATE POLICY "BlogPost is insertable by author"
ON "BlogPost"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "BlogPost"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 4: 作者可以更新自己的博客文章
CREATE POLICY "BlogPost is updatable by author"
ON "BlogPost"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "BlogPost"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 5: 作者可以删除自己的博客文章
CREATE POLICY "BlogPost is deletable by author"
ON "BlogPost"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "BlogPost"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- ============================================
-- Product 表 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有人可以查看已发布的商品
CREATE POLICY "Product is viewable by everyone if published"
ON "Product"
FOR SELECT
USING (status = 'PUBLISHED');

-- 策略 2: 卖家可以查看自己的所有商品（包括草稿和已归档的）
CREATE POLICY "Product is viewable by seller"
ON "Product"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Product"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 3: 卖家可以创建自己的商品
CREATE POLICY "Product is insertable by seller"
ON "Product"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Product"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 4: 卖家可以更新自己的商品
CREATE POLICY "Product is updatable by seller"
ON "Product"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Product"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 5: 卖家可以删除自己的商品（但如果有订单项关联，会被 RESTRICT 阻止）
CREATE POLICY "Product is deletable by seller"
ON "Product"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Product"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- ============================================
-- Order 表 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- 策略 1: 卖家可以查看自己的订单
CREATE POLICY "Order is viewable by seller"
ON "Order"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Order"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 2: 买家可以通过邮箱查看自己的订单（如果实现了邮箱验证）
-- 注意：这个策略需要你的应用支持邮箱验证，否则可以注释掉
-- CREATE POLICY "Order is viewable by buyer"
-- ON "Order"
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM "User"
--     WHERE "User".email = "Order"."buyerEmail"
--     AND "User".id = auth.uid()::text
--   )
-- );

-- 策略 3: 卖家可以创建订单（通常通过应用逻辑创建，但保留此策略）
CREATE POLICY "Order is insertable by seller"
ON "Order"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Order"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 4: 卖家可以更新自己的订单
CREATE POLICY "Order is updatable by seller"
ON "Order"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Order"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 5: 卖家可以删除自己的订单（谨慎使用）
CREATE POLICY "Order is deletable by seller"
ON "Order"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE "User".id = "Order"."userId"
    AND "User".id = auth.uid()::text
  )
);

-- ============================================
-- OrderItem 表 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;

-- 策略 1: 可以查看订单项，如果关联的订单属于当前用户
CREATE POLICY "OrderItem is viewable by order owner"
ON "OrderItem"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Order"
    JOIN "User" ON "User".id = "Order"."userId"
    WHERE "Order".id = "OrderItem"."orderId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 2: 可以创建订单项，如果关联的订单属于当前用户
CREATE POLICY "OrderItem is insertable by order owner"
ON "OrderItem"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Order"
    JOIN "User" ON "User".id = "Order"."userId"
    WHERE "Order".id = "OrderItem"."orderId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 3: 可以更新订单项，如果关联的订单属于当前用户
CREATE POLICY "OrderItem is updatable by order owner"
ON "OrderItem"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "Order"
    JOIN "User" ON "User".id = "Order"."userId"
    WHERE "Order".id = "OrderItem"."orderId"
    AND "User".id = auth.uid()::text
  )
);

-- 策略 4: 可以删除订单项，如果关联的订单属于当前用户
CREATE POLICY "OrderItem is deletable by order owner"
ON "OrderItem"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM "Order"
    JOIN "User" ON "User".id = "Order"."userId"
    WHERE "Order".id = "OrderItem"."orderId"
    AND "User".id = auth.uid()::text
  )
);

-- ============================================
-- 重要说明
-- ============================================
-- 
-- 注意：这些策略使用了 auth.uid()，这需要 Supabase Auth 系统
-- 
-- 如果你的应用不使用 Supabase Auth，而是使用自己的认证系统（如 session），
-- 你需要修改这些策略以匹配你的认证方式。
-- 
-- 对于使用自定义认证的应用，你可能需要：
-- 1. 禁用 RLS（不推荐，但可以快速解决警告）
-- 2. 创建服务角色策略，允许服务端完全访问
-- 3. 使用 Postgres 函数和 JWT 来验证用户身份
-- 
-- 如果使用自定义认证，可以执行以下 SQL 来禁用 RLS：
-- ALTER TABLE "BlogPost" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "OrderItem" DISABLE ROW LEVEL SECURITY;
