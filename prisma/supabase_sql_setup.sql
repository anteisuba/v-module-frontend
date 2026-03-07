-- Supabase 数据库初始化 SQL
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本

-- ============================================
-- 1. 创建 User 表
-- ============================================
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 创建 Page 表
-- ============================================
CREATE TABLE IF NOT EXISTS "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "draftConfig" JSONB,
    "publishedConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 3. 创建 UserPasswordResetToken 表
-- ============================================
CREATE TABLE IF NOT EXISTS "UserPasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- 4. 创建 MediaAsset 表（支持普通用户和管理员用户）
-- ============================================
-- 注意：MediaAsset 表中的 userId 和 adminUserId 都是可选的
-- 如果需要关联到 User 表，可以后续添加外键约束
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "adminUserId" TEXT,
    "src" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. 创建索引
-- ============================================

-- User 表索引
CREATE INDEX IF NOT EXISTS "User_slug_idx" ON "User"("slug");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Page 表索引
CREATE INDEX IF NOT EXISTS "Page_userId_idx" ON "Page"("userId");
CREATE INDEX IF NOT EXISTS "Page_slug_idx" ON "Page"("slug");

-- UserPasswordResetToken 表索引
CREATE INDEX IF NOT EXISTS "UserPasswordResetToken_userId_idx" ON "UserPasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "UserPasswordResetToken_expiresAt_idx" ON "UserPasswordResetToken"("expiresAt");

-- MediaAsset 表索引
CREATE INDEX IF NOT EXISTS "MediaAsset_userId_createdAt_idx" ON "MediaAsset"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "MediaAsset_adminUserId_createdAt_idx" ON "MediaAsset"("adminUserId", "createdAt");

-- ============================================
-- 6. 验证表是否创建成功
-- ============================================
-- 运行以下查询来验证表是否创建成功：
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

