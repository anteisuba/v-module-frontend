ALTER TABLE "MediaAsset"
ADD COLUMN IF NOT EXISTS "usageContexts" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "MediaAsset_usageContexts_idx"
ON "MediaAsset" USING GIN ("usageContexts");
