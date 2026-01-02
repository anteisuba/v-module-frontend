-- 创建 NewsArticle 表的 SQL 脚本
-- 可以在 Supabase SQL Editor 中直接执行

-- 创建表
CREATE TABLE IF NOT EXISTS "NewsArticle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tag" TEXT,
    "shareUrl" TEXT,
    "shareChannels" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "NewsArticle_userId_createdAt_idx" ON "NewsArticle"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "NewsArticle_published_createdAt_idx" ON "NewsArticle"("published", "createdAt");
CREATE INDEX IF NOT EXISTS "NewsArticle_category_idx" ON "NewsArticle"("category");

-- 添加外键约束
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'NewsArticle_userId_fkey'
    ) THEN
        ALTER TABLE "NewsArticle" 
        ADD CONSTRAINT "NewsArticle_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

