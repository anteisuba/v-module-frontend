CREATE TABLE "OrderDispute" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "orderId" TEXT,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "externalDisputeId" TEXT NOT NULL,
  "externalPaymentIntentId" TEXT,
  "externalChargeId" TEXT,
  "dueBy" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderDispute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderDispute"
  ADD CONSTRAINT "OrderDispute_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderDispute"
  ADD CONSTRAINT "OrderDispute_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "OrderDispute_externalDisputeId_key"
  ON "OrderDispute"("externalDisputeId");

CREATE INDEX "OrderDispute_userId_status_updatedAt_idx"
  ON "OrderDispute"("userId", "status", "updatedAt");

CREATE INDEX "OrderDispute_orderId_updatedAt_idx"
  ON "OrderDispute"("orderId", "updatedAt");

CREATE INDEX "OrderDispute_provider_status_updatedAt_idx"
  ON "OrderDispute"("provider", "status", "updatedAt");

CREATE INDEX "OrderDispute_externalPaymentIntentId_idx"
  ON "OrderDispute"("externalPaymentIntentId");

CREATE INDEX "OrderDispute_externalChargeId_idx"
  ON "OrderDispute"("externalChargeId");
