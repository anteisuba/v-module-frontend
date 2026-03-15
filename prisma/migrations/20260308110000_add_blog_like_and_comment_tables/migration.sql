CREATE TABLE IF NOT EXISTS "BlogLike" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogLike_pkey" PRIMARY KEY ("id")
);

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

ALTER TABLE "BlogLike"
ADD CONSTRAINT "BlogLike_blogPostId_fkey"
FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogComment"
ADD CONSTRAINT "BlogComment_blogPostId_fkey"
FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BlogLike_blogPostId_createdAt_idx"
ON "BlogLike"("blogPostId", "createdAt");

CREATE INDEX IF NOT EXISTS "BlogLike_userId_idx"
ON "BlogLike"("userId");

CREATE INDEX IF NOT EXISTS "BlogComment_blogPostId_createdAt_idx"
ON "BlogComment"("blogPostId", "createdAt");

CREATE INDEX IF NOT EXISTS "BlogComment_userId_idx"
ON "BlogComment"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_blogPostId_userId_key"
ON "BlogLike"("blogPostId", "userId")
WHERE "userId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_blogPostId_userEmail_key"
ON "BlogLike"("blogPostId", "userEmail")
WHERE "userEmail" IS NOT NULL AND "userId" IS NULL;
