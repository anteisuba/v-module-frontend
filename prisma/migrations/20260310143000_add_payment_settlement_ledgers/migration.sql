CREATE TABLE "PaymentSettlementPayout" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalPayoutId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "payoutMethod" TEXT,
  "description" TEXT,
  "statementDescriptor" TEXT,
  "rawData" JSONB,
  "payoutCreatedAt" TIMESTAMP(3) NOT NULL,
  "arrivalDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentSettlementPayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentSettlementEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "orderId" TEXT,
  "refundId" TEXT,
  "payoutId" TEXT,
  "provider" TEXT NOT NULL,
  "externalBalanceTransactionId" TEXT NOT NULL,
  "externalSourceId" TEXT,
  "externalSourceType" TEXT,
  "type" TEXT NOT NULL,
  "reportingCategory" TEXT,
  "status" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "fee" DECIMAL(10, 2) NOT NULL,
  "net" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "description" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "availableOn" TIMESTAMP(3),
  "reconciliationStatus" TEXT NOT NULL DEFAULT 'OPEN',
  "reconciliationNote" TEXT,
  "reconciledAt" TIMESTAMP(3),
  "sourceMetadata" JSONB,
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentSettlementEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PaymentSettlementEntry"
  ADD CONSTRAINT "PaymentSettlementEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentSettlementEntry"
  ADD CONSTRAINT "PaymentSettlementEntry_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentSettlementEntry"
  ADD CONSTRAINT "PaymentSettlementEntry_refundId_fkey"
  FOREIGN KEY ("refundId") REFERENCES "OrderRefund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentSettlementEntry"
  ADD CONSTRAINT "PaymentSettlementEntry_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "PaymentSettlementPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PaymentSettlementPayout_externalPayoutId_key"
  ON "PaymentSettlementPayout"("externalPayoutId");

CREATE UNIQUE INDEX "PaymentSettlementEntry_externalBalanceTransactionId_key"
  ON "PaymentSettlementEntry"("externalBalanceTransactionId");

CREATE INDEX "PaymentSettlementPayout_provider_payoutCreatedAt_idx"
  ON "PaymentSettlementPayout"("provider", "payoutCreatedAt");

CREATE INDEX "PaymentSettlementPayout_status_arrivalDate_idx"
  ON "PaymentSettlementPayout"("status", "arrivalDate");

CREATE INDEX "PaymentSettlementEntry_userId_occurredAt_idx"
  ON "PaymentSettlementEntry"("userId", "occurredAt");

CREATE INDEX "PaymentSettlementEntry_orderId_occurredAt_idx"
  ON "PaymentSettlementEntry"("orderId", "occurredAt");

CREATE INDEX "PaymentSettlementEntry_refundId_occurredAt_idx"
  ON "PaymentSettlementEntry"("refundId", "occurredAt");

CREATE INDEX "PaymentSettlementEntry_payoutId_availableOn_idx"
  ON "PaymentSettlementEntry"("payoutId", "availableOn");

CREATE INDEX "PaymentSettlementEntry_provider_status_occurredAt_idx"
  ON "PaymentSettlementEntry"("provider", "status", "occurredAt");

CREATE INDEX "PaymentSettlementEntry_reconciliationStatus_occurredAt_idx"
  ON "PaymentSettlementEntry"("reconciliationStatus", "occurredAt");

CREATE INDEX "PaymentSettlementEntry_externalSourceId_idx"
  ON "PaymentSettlementEntry"("externalSourceId");
