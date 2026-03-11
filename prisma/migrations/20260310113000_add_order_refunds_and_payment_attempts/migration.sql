CREATE TABLE "OrderPaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "externalSessionId" TEXT,
  "externalPaymentIntentId" TEXT,
  "failureReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  CONSTRAINT "OrderPaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderRefund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'JPY',
  "reason" TEXT,
  "failureReason" TEXT,
  "externalRefundId" TEXT,
  "externalPaymentIntentId" TEXT,
  "requestedByUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "refundedAt" TIMESTAMP(3),
  CONSTRAINT "OrderRefund_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrderPaymentAttempt"
  ADD CONSTRAINT "OrderPaymentAttempt_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderRefund"
  ADD CONSTRAINT "OrderRefund_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OrderPaymentAttempt_orderId_createdAt_idx"
  ON "OrderPaymentAttempt"("orderId", "createdAt");

CREATE INDEX "OrderPaymentAttempt_provider_status_createdAt_idx"
  ON "OrderPaymentAttempt"("provider", "status", "createdAt");

CREATE INDEX "OrderPaymentAttempt_externalSessionId_idx"
  ON "OrderPaymentAttempt"("externalSessionId");

CREATE INDEX "OrderPaymentAttempt_externalPaymentIntentId_idx"
  ON "OrderPaymentAttempt"("externalPaymentIntentId");

CREATE UNIQUE INDEX "OrderRefund_externalRefundId_key"
  ON "OrderRefund"("externalRefundId");

CREATE INDEX "OrderRefund_orderId_createdAt_idx"
  ON "OrderRefund"("orderId", "createdAt");

CREATE INDEX "OrderRefund_provider_status_createdAt_idx"
  ON "OrderRefund"("provider", "status", "createdAt");

CREATE INDEX "OrderRefund_requestedByUserId_createdAt_idx"
  ON "OrderRefund"("requestedByUserId", "createdAt");

CREATE INDEX "OrderRefund_externalPaymentIntentId_idx"
  ON "OrderRefund"("externalPaymentIntentId");

INSERT INTO "OrderPaymentAttempt" (
  "id",
  "orderId",
  "provider",
  "status",
  "amount",
  "currency",
  "externalSessionId",
  "externalPaymentIntentId",
  "failureReason",
  "metadata",
  "createdAt",
  "updatedAt",
  "paidAt",
  "failedAt",
  "expiredAt"
)
SELECT
  'legacy-payment-attempt-' || o."id",
  o."id",
  o."paymentProvider",
  CASE
    WHEN o."paymentStatus" IN ('PAID', 'PARTIALLY_REFUNDED', 'REFUNDED') THEN 'PAID'
    WHEN o."paymentStatus" = 'FAILED' THEN 'FAILED'
    WHEN o."paymentStatus" = 'EXPIRED' THEN 'EXPIRED'
    ELSE 'OPEN'
  END,
  o."totalAmount",
  COALESCE(NULLIF(o."currency", ''), 'JPY'),
  o."paymentSessionId",
  o."paymentIntentId",
  o."paymentFailureReason",
  jsonb_build_object('source', 'legacy-order-fields'),
  o."createdAt",
  o."updatedAt",
  o."paidAt",
  CASE
    WHEN o."paymentStatus" = 'FAILED' THEN COALESCE(o."paymentFailedAt", o."updatedAt")
    ELSE NULL
  END,
  CASE
    WHEN o."paymentStatus" = 'EXPIRED' THEN COALESCE(o."paymentFailedAt", o."updatedAt")
    ELSE NULL
  END
FROM "Order" o
WHERE o."paymentProvider" IS NOT NULL
  AND (o."paymentSessionId" IS NOT NULL OR o."paymentIntentId" IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1
    FROM "OrderPaymentAttempt" a
    WHERE a."orderId" = o."id"
  );
