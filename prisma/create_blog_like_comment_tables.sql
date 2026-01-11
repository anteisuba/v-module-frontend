-- 创建博客点赞表
CREATE TABLE IF NOT EXISTS "BlogLike" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("id")
);

-- 创建博客评论表
CREATE TABLE IF NOT EXISTS "BlogComment" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- 创建外键约束
ALTER TABLE "BlogLike" ADD CONSTRAINT "BlogLike_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS "BlogLike_blogPostId_createdAt_idx" ON "BlogLike"("blogPostId", "createdAt");
CREATE INDEX IF NOT EXISTS "BlogLike_userId_idx" ON "BlogLike"("userId");
CREATE INDEX IF NOT EXISTS "BlogComment_blogPostId_createdAt_idx" ON "BlogComment"("blogPostId", "createdAt");
CREATE INDEX IF NOT EXISTS "BlogComment_userId_idx" ON "BlogComment"("userId");

-- 创建唯一约束（同一用户对同一博客只能点赞一次）
CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_blogPostId_userId_key" ON "BlogLike"("blogPostId", "userId") WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_blogPostId_userEmail_key" ON "BlogLike"("blogPostId", "userEmail") WHERE "userEmail" IS NOT NULL AND "userId" IS NULL;

-- 启用 RLS（如果需要）
-- ALTER TABLE "BlogLike" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "BlogComment" ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（如果使用自定义认证）
-- CREATE POLICY "BlogLike allow all" ON "BlogLike" FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "BlogComment allow all" ON "BlogComment" FOR ALL USING (true) WITH CHECK (true);
