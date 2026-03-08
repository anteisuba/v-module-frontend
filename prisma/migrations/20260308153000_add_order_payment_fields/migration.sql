ALTER TABLE "Order"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'JPY',
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentStatus" TEXT,
ADD COLUMN "paymentSessionId" TEXT,
ADD COLUMN "paymentIntentId" TEXT,
ADD COLUMN "paymentExpiresAt" TIMESTAMP(3),
ADD COLUMN "paymentFailedAt" TIMESTAMP(3),
ADD COLUMN "paymentFailureReason" TEXT;

CREATE UNIQUE INDEX "Order_paymentSessionId_key" ON "Order"("paymentSessionId");
CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "Order"("paymentIntentId");
CREATE INDEX "Order_paymentStatus_createdAt_idx" ON "Order"("paymentStatus", "createdAt");
CREATE INDEX "Order_paymentProvider_createdAt_idx" ON "Order"("paymentProvider", "createdAt");
