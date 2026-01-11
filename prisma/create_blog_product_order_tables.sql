-- ============================================
-- 博客文章表 (BlogPost)
-- ============================================
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "videoUrl" TEXT,
    "externalLinks" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "BlogPost_userId_createdAt_idx" ON "BlogPost"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "BlogPost_published_createdAt_idx" ON "BlogPost"("published", "createdAt");

-- 创建外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BlogPost_userId_fkey'
    ) THEN
        ALTER TABLE "BlogPost" 
        ADD CONSTRAINT "BlogPost_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 商品表 (Product)
-- ============================================
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "Product_userId_createdAt_idx" ON "Product"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_userId_status_idx" ON "Product"("userId", "status");

-- 创建外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Product_userId_fkey'
    ) THEN
        ALTER TABLE "Product" 
        ADD CONSTRAINT "Product_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 订单表 (Order)
-- ============================================
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerName" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingAddress" JSONB,
    "shippingMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_buyerEmail_createdAt_idx" ON "Order"("buyerEmail", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- 创建外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Order_userId_fkey'
    ) THEN
        ALTER TABLE "Order" 
        ADD CONSTRAINT "Order_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 订单项表 (OrderItem)
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

-- 创建唯一约束（一个订单中同一商品只能出现一次）
CREATE UNIQUE INDEX IF NOT EXISTS "OrderItem_orderId_productId_key" ON "OrderItem"("orderId", "productId");

-- 创建外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'OrderItem_orderId_fkey'
    ) THEN
        ALTER TABLE "OrderItem" 
        ADD CONSTRAINT "OrderItem_orderId_fkey" 
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'OrderItem_productId_fkey'
    ) THEN
        ALTER TABLE "OrderItem" 
        ADD CONSTRAINT "OrderItem_productId_fkey" 
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- 创建 updatedAt 自动更新触发器函数（如果不存在）
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 BlogPost 表创建触发器
DROP TRIGGER IF EXISTS update_BlogPost_updated_at ON "BlogPost";
CREATE TRIGGER update_BlogPost_updated_at
    BEFORE UPDATE ON "BlogPost"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 Product 表创建触发器
DROP TRIGGER IF EXISTS update_Product_updated_at ON "Product";
CREATE TRIGGER update_Product_updated_at
    BEFORE UPDATE ON "Product"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 Order 表创建触发器
DROP TRIGGER IF EXISTS update_Order_updated_at ON "Order";
CREATE TRIGGER update_Order_updated_at
    BEFORE UPDATE ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
