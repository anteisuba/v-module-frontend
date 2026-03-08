ALTER TABLE "BlogComment"
ADD COLUMN "status" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3);

UPDATE "BlogComment"
SET
  "status" = 'APPROVED',
  "moderatedAt" = "updatedAt"
WHERE "status" IS NULL;

ALTER TABLE "BlogComment"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE INDEX "BlogComment_blogPostId_status_createdAt_idx"
ON "BlogComment"("blogPostId", "status", "createdAt");

CREATE INDEX "BlogComment_status_createdAt_idx"
ON "BlogComment"("status", "createdAt");
