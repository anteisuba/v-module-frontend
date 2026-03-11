CREATE TYPE "PayoutProvider" AS ENUM ('STRIPE');

CREATE TYPE "SellerPayoutAccountStatus" AS ENUM (
  'NOT_STARTED',
  'PENDING',
  'RESTRICTED',
  'ACTIVE',
  'DISCONNECTED'
);

CREATE TYPE "PaymentRoutingMode" AS ENUM (
  'PLATFORM',
  'STRIPE_CONNECT_DESTINATION'
);

CREATE TABLE "SellerPayoutAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "PayoutProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "status" "SellerPayoutAccountStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "accountType" TEXT NOT NULL DEFAULT 'STRIPE_EXPRESS',
  "country" TEXT,
  "defaultCurrency" TEXT DEFAULT 'JPY',
  "businessType" TEXT,
  "displayNameSnapshot" TEXT,
  "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
  "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
  "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "requirementsCurrentlyDue" JSONB,
  "requirementsEventuallyDue" JSONB,
  "requirementsPastDue" JSONB,
  "disabledReason" TEXT,
  "bankNameMasked" TEXT,
  "bankLast4Masked" TEXT,
  "onboardingStartedAt" TIMESTAMP(3),
  "onboardingCompletedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "disconnectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerPayoutAccount_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
  ADD COLUMN "payoutAccountId" TEXT,
  ADD COLUMN "paymentRoutingMode" "PaymentRoutingMode" NOT NULL DEFAULT 'PLATFORM',
  ADD COLUMN "connectedAccountId" TEXT,
  ADD COLUMN "externalChargeId" TEXT,
  ADD COLUMN "externalTransferId" TEXT,
  ADD COLUMN "platformFeeAmount" DECIMAL(10, 2),
  ADD COLUMN "sellerGrossAmount" DECIMAL(10, 2),
  ADD COLUMN "sellerNetExpectedAmount" DECIMAL(10, 2);

ALTER TABLE "OrderPaymentAttempt"
  ADD COLUMN "connectedAccountId" TEXT,
  ADD COLUMN "externalChargeId" TEXT,
  ADD COLUMN "externalTransferId" TEXT,
  ADD COLUMN "applicationFeeAmount" DECIMAL(10, 2);

ALTER TABLE "OrderRefund"
  ADD COLUMN "connectedAccountId" TEXT,
  ADD COLUMN "externalChargeId" TEXT,
  ADD COLUMN "externalTransferReversalId" TEXT,
  ADD COLUMN "applicationFeeRefundedAmount" DECIMAL(10, 2);

ALTER TABLE "OrderDispute"
  ADD COLUMN "connectedAccountId" TEXT,
  ADD COLUMN "externalTransferReversalId" TEXT;

ALTER TABLE "PaymentSettlementPayout"
  ADD COLUMN "stripeAccountId" TEXT,
  ADD COLUMN "accountScope" TEXT;

ALTER TABLE "PaymentSettlementEntry"
  ADD COLUMN "stripeAccountId" TEXT,
  ADD COLUMN "accountScope" TEXT;

ALTER TABLE "SellerPayoutAccount"
  ADD CONSTRAINT "SellerPayoutAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_payoutAccountId_fkey"
  FOREIGN KEY ("payoutAccountId") REFERENCES "SellerPayoutAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SellerPayoutAccount_providerAccountId_key"
  ON "SellerPayoutAccount"("providerAccountId");

CREATE UNIQUE INDEX "SellerPayoutAccount_userId_provider_key"
  ON "SellerPayoutAccount"("userId", "provider");

CREATE INDEX "SellerPayoutAccount_userId_provider_status_idx"
  ON "SellerPayoutAccount"("userId", "provider", "status");

CREATE INDEX "SellerPayoutAccount_provider_providerAccountId_idx"
  ON "SellerPayoutAccount"("provider", "providerAccountId");

CREATE INDEX "Order_payoutAccountId_createdAt_idx"
  ON "Order"("payoutAccountId", "createdAt");

CREATE INDEX "Order_paymentRoutingMode_createdAt_idx"
  ON "Order"("paymentRoutingMode", "createdAt");

CREATE INDEX "Order_connectedAccountId_idx"
  ON "Order"("connectedAccountId");

CREATE INDEX "Order_externalChargeId_idx"
  ON "Order"("externalChargeId");

CREATE INDEX "OrderPaymentAttempt_connectedAccountId_idx"
  ON "OrderPaymentAttempt"("connectedAccountId");

CREATE INDEX "OrderPaymentAttempt_externalChargeId_idx"
  ON "OrderPaymentAttempt"("externalChargeId");

CREATE INDEX "OrderRefund_connectedAccountId_idx"
  ON "OrderRefund"("connectedAccountId");

CREATE INDEX "OrderRefund_externalChargeId_idx"
  ON "OrderRefund"("externalChargeId");

CREATE INDEX "OrderDispute_connectedAccountId_idx"
  ON "OrderDispute"("connectedAccountId");

CREATE INDEX "PaymentSettlementPayout_stripeAccountId_payoutCreatedAt_idx"
  ON "PaymentSettlementPayout"("stripeAccountId", "payoutCreatedAt");

CREATE INDEX "PaymentSettlementEntry_stripeAccountId_availableOn_idx"
  ON "PaymentSettlementEntry"("stripeAccountId", "availableOn");
