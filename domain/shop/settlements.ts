import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import {
  ORDER_PAYMENT_PROVIDER_STRIPE,
  ORDER_PAYMENT_STATUS_PAID,
  ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED,
  ORDER_PAYMENT_STATUS_REFUNDED,
  ORDER_REFUND_STATUS_SUCCEEDED,
} from "./services";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export const SETTLEMENT_RECONCILIATION_STATUS_OPEN = "OPEN" as const;
export const SETTLEMENT_RECONCILIATION_STATUS_RECONCILED =
  "RECONCILED" as const;
export const SETTLEMENT_RECONCILIATION_STATUS_IGNORED = "IGNORED" as const;
const SETTLEMENT_ACCOUNT_SCOPE_CONNECTED = "CONNECTED" as const;

type SettlementReconciliationStatus =
  | typeof SETTLEMENT_RECONCILIATION_STATUS_OPEN
  | typeof SETTLEMENT_RECONCILIATION_STATUS_RECONCILED
  | typeof SETTLEMENT_RECONCILIATION_STATUS_IGNORED;

interface PaymentSettlementLocalPaymentRecord {
  orderId: string;
  buyerEmail: string;
  buyerName: string | null;
  totalAmount: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentIntentId: string | null;
  paidAt: string | null;
}

interface PaymentSettlementLocalRefundRecord {
  refundId: string;
  orderId: string;
  buyerEmail: string;
  buyerName: string | null;
  amount: number;
  currency: string;
  refundStatus: string;
  externalRefundId: string | null;
  externalPaymentIntentId: string | null;
  refundedAt: string | null;
}

export interface PaymentSettlementEntryRecord {
  id: string;
  externalBalanceTransactionId: string;
  provider: string;
  stripeAccountId?: string | null;
  accountScope?: string | null;
  externalSourceId: string | null;
  externalSourceType: string | null;
  type: string;
  reportingCategory: string | null;
  status: string;
  amount: number;
  fee: number;
  net: number;
  currency: string;
  description: string | null;
  occurredAt: string;
  availableOn: string | null;
  reconciliationStatus: SettlementReconciliationStatus;
  reconciliationNote: string | null;
  reconciledAt: string | null;
  updatedAt: string;
  orderId: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
  paymentRoutingMode?: string | null;
  connectedAccountId?: string | null;
  platformFeeAmount?: number | null;
  sellerNetExpectedAmount?: number | null;
  refundId: string | null;
  refundStatus: string | null;
  payoutId: string | null;
  payoutExternalId: string | null;
  payoutStatus: string | null;
  payoutArrivalDate: string | null;
  payoutCreatedAt: string | null;
}

export interface PaymentSettlementPayoutBaseRecord {
  id: string;
  externalPayoutId: string;
  provider: string;
  stripeAccountId?: string | null;
  accountScope?: string | null;
  status: string;
  amount: number;
  currency: string;
  payoutMethod: string | null;
  description: string | null;
  statementDescriptor: string | null;
  payoutCreatedAt: string;
  arrivalDate: string | null;
  paidAt: string | null;
  updatedAt: string;
}

export interface PaymentSettlementPayoutRecord
  extends PaymentSettlementPayoutBaseRecord {
  linkedEntryCount: number;
  linkedGrossAmount: number;
  linkedFeeAmount: number;
  linkedNetAmount: number;
  unreconciledEntryCount: number;
}

export type PaymentSettlementPayoutStatusGroupKey =
  | "NOT_IN_PAYOUT"
  | "PENDING"
  | "IN_TRANSIT"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "OTHER";

export interface PaymentSettlementEntryGroup {
  key: PaymentSettlementPayoutStatusGroupKey;
  title: string;
  payoutStatus: string | null;
  entryCount: number;
  unreconciledEntryCount: number;
  netAmount: number;
  entries: PaymentSettlementEntryRecord[];
}

export interface PaymentSettlementAnomaly {
  id: string;
  code: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestedAction: string;
  orderId: string | null;
  refundId: string | null;
  entryId: string | null;
  externalReference: string | null;
  occurredAt: string;
}

export interface PaymentSettlementSummary {
  windowStart: string;
  windowEnd: string;
  grossCapturedAmount: number;
  refundedAmount: number;
  feeAmount: number;
  netAmount: number;
  availableNetAmount: number;
  pendingNetAmount: number;
  paidOutNetAmount: number;
  payoutCount: number;
  unreconciledEntryCount: number;
  unmatchedEntryCount: number;
  anomalyCount: number;
  lastSyncedAt: string | null;
}

export interface PaymentSettlementReport {
  summary: PaymentSettlementSummary;
  payouts: PaymentSettlementPayoutRecord[];
  entries: PaymentSettlementEntryRecord[];
  entryGroups: PaymentSettlementEntryGroup[];
  anomalies: PaymentSettlementAnomaly[];
}

export interface PaymentSettlementLedgerSyncResult {
  syncedEntries: number;
  syncedPayouts: number;
  matchedOrders: number;
  matchedRefunds: number;
  matchedPayoutEntries: number;
}

export interface PaymentSettlementSyncResult
  extends PaymentSettlementLedgerSyncResult {
  syncedDisputes: number;
  matchedDisputeOrders: number;
  unmatchedDisputes: number;
}

interface ResolvedSettlementContext {
  userId: string | null;
  orderId: string | null;
  refundId: string | null;
  sourceType: string | null;
  sourceMetadata: Prisma.InputJsonValue | null;
}

function parseBoundaryDate(
  value: string | null | undefined,
  endOfDay = false
): Date | null {
  if (!value) {
    return null;
  }

  const normalized = endOfDay
    ? `${value}T23:59:59.999Z`
    : `${value}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveWindow(input?: { start?: string | null; end?: string | null }) {
  const end = parseBoundaryDate(input?.end || null, true) || new Date();
  const start =
    parseBoundaryDate(input?.start || null, false) ||
    new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);

  if (start.getTime() > end.getTime()) {
    throw new Error("start date cannot be after end date");
  }

  return { start, end };
}

function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function fromUnixSeconds(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function toIsoStringOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function inWindow(value: string | null | undefined, start: Date, end: Date) {
  const parsed = toDate(value);
  if (!parsed) {
    return false;
  }

  const time = parsed.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function sanitizeStripeObject(value: unknown): Prisma.InputJsonValue | null {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function fromStripeAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return amount;
  }

  return amount / 100;
}

function inferSourceType(sourceId: string | null) {
  if (!sourceId) {
    return null;
  }

  if (sourceId.startsWith("ch_")) {
    return "charge";
  }

  if (sourceId.startsWith("re_")) {
    return "refund";
  }

  if (sourceId.startsWith("po_")) {
    return "payout";
  }

  return "external";
}

function getStripeSourceId(
  value: string | Stripe.BalanceTransactionSource | null
) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function isCaptureEntry(entry: PaymentSettlementEntryRecord) {
  return (
    entry.amount > 0 &&
    entry.type !== "payout" &&
    entry.externalSourceType !== "refund"
  );
}

function isRefundEntry(entry: PaymentSettlementEntryRecord) {
  return (
    entry.externalSourceType === "refund" ||
    entry.reportingCategory === "refund" ||
    entry.type.includes("refund") ||
    entry.amount < 0
  );
}

function isVisibleEntry(
  entry: PaymentSettlementEntryRecord,
  start: Date,
  end: Date
) {
  if (inWindow(entry.occurredAt, start, end)) {
    return true;
  }

  if (inWindow(entry.availableOn, start, end)) {
    return true;
  }

  if (inWindow(entry.payoutArrivalDate, start, end)) {
    return true;
  }

  if (inWindow(entry.payoutCreatedAt, start, end)) {
    return true;
  }

  const availableOnDate = toDate(entry.availableOn);

  return (
    !entry.payoutId &&
    availableOnDate != null &&
    availableOnDate.getTime() <= end.getTime()
  );
}

function buildPayoutRecords(
  payouts: PaymentSettlementPayoutBaseRecord[],
  entries: PaymentSettlementEntryRecord[],
  start: Date,
  end: Date
) {
  return payouts
    .filter(
      (payout) =>
        inWindow(payout.payoutCreatedAt, start, end) ||
        inWindow(payout.arrivalDate, start, end)
    )
    .map<PaymentSettlementPayoutRecord>((payout) => {
      const linkedEntries = entries.filter((entry) => entry.payoutId === payout.id);

      return {
        ...payout,
        linkedEntryCount: linkedEntries.length,
        linkedGrossAmount: linkedEntries
          .filter((entry) => isCaptureEntry(entry))
          .reduce((sum, entry) => sum + entry.amount, 0),
        linkedFeeAmount: linkedEntries.reduce((sum, entry) => sum + entry.fee, 0),
        linkedNetAmount: linkedEntries.reduce((sum, entry) => sum + entry.net, 0),
        unreconciledEntryCount: linkedEntries.filter(
          (entry) =>
            entry.reconciliationStatus === SETTLEMENT_RECONCILIATION_STATUS_OPEN
        ).length,
      };
    })
    .sort(
      (left, right) =>
        new Date(right.payoutCreatedAt).getTime() -
        new Date(left.payoutCreatedAt).getTime()
    );
}

function buildSettlementAnomalies(
  entries: PaymentSettlementEntryRecord[],
  localPayments: PaymentSettlementLocalPaymentRecord[],
  localRefunds: PaymentSettlementLocalRefundRecord[]
) {
  const anomalies: PaymentSettlementAnomaly[] = [];
  const now = Date.now();
  const openThreshold = 3 * 24 * 60 * 60 * 1000;

  for (const entry of entries) {
    if (!entry.orderId && entry.externalSourceType !== "payout") {
      anomalies.push({
        id: `unmatched-entry-${entry.id}`,
        code: "STRIPE_ENTRY_UNMATCHED",
        severity: "high",
        title: "Stripe 结算流水未匹配到本地订单",
        description: "这条 Stripe balance transaction 没有关联到本地订单或退款记录。",
        suggestedAction: "检查 PaymentIntent / Refund metadata，并确认是否有漏单或外部手工操作。",
        orderId: null,
        refundId: null,
        entryId: entry.id,
        externalReference:
          entry.externalSourceId || entry.externalBalanceTransactionId,
        occurredAt: entry.occurredAt,
      });
    }

    if (
      entry.reconciliationStatus === SETTLEMENT_RECONCILIATION_STATUS_OPEN &&
      now - new Date(entry.updatedAt).getTime() > openThreshold
    ) {
      anomalies.push({
        id: `open-writeoff-${entry.id}`,
        code: "UNRECONCILED_SETTLEMENT_ENTRY",
        severity: "medium",
        title: "结算流水尚未核销",
        description: "这条结算流水已经同步超过 3 天，但仍未被确认或忽略。",
        suggestedAction: "确认到账和手续费无误后，将其标记为已核销或忽略。",
        orderId: entry.orderId,
        refundId: entry.refundId,
        entryId: entry.id,
        externalReference:
          entry.externalSourceId || entry.externalBalanceTransactionId,
        occurredAt: entry.updatedAt,
      });
    }

    if (
      entry.status === "available" &&
      !entry.payoutId &&
      entry.availableOn &&
      now - new Date(entry.availableOn).getTime() > openThreshold
    ) {
      anomalies.push({
        id: `available-no-payout-${entry.id}`,
        code: "AVAILABLE_ENTRY_WITHOUT_PAYOUT",
        severity: "medium",
        title: "可结算流水仍未进入 payout",
        description: "这条流水已经进入可结算状态，但当前还没有绑定到任何 payout。",
        suggestedAction: "去 Stripe Dashboard 检查余额、出款计划或银行账户状态。",
        orderId: entry.orderId,
        refundId: entry.refundId,
        entryId: entry.id,
        externalReference:
          entry.externalSourceId || entry.externalBalanceTransactionId,
        occurredAt: entry.availableOn,
      });
    }
  }

  for (const payment of localPayments) {
    const matchedEntry = entries.some(
      (entry) =>
        entry.orderId === payment.orderId &&
        (isCaptureEntry(entry) ||
          entry.externalSourceId === payment.paymentIntentId)
    );

    if (!matchedEntry) {
      anomalies.push({
        id: `local-payment-gap-${payment.orderId}`,
        code: "LOCAL_PAYMENT_MISSING_SETTLEMENT",
        severity: "high",
        title: "本地已收款订单缺少 Stripe 结算流水",
        description: "订单已经进入已收款状态，但在同步的 Stripe 结算流水中没有找到对应入账记录。",
        suggestedAction: "重新同步结算流水，若仍缺失请核对 PaymentIntent 是否真实成功。",
        orderId: payment.orderId,
        refundId: null,
        entryId: null,
        externalReference: payment.paymentIntentId,
        occurredAt: payment.paidAt || new Date().toISOString(),
      });
    }
  }

  for (const refund of localRefunds) {
    const matchedEntry = entries.some(
      (entry) =>
        entry.refundId === refund.refundId ||
        (refund.externalRefundId != null &&
          entry.externalSourceId === refund.externalRefundId)
    );

    if (!matchedEntry) {
      anomalies.push({
        id: `local-refund-gap-${refund.refundId}`,
        code: "LOCAL_REFUND_MISSING_SETTLEMENT",
        severity: "high",
        title: "本地退款缺少 Stripe 结算流水",
        description: "退款在本地已经成功，但 Stripe 结算流水里还没看到对应扣减记录。",
        suggestedAction: "重新同步结算流水，并核对退款是否在 Stripe 真正成功。",
        orderId: refund.orderId,
        refundId: refund.refundId,
        entryId: null,
        externalReference: refund.externalRefundId,
        occurredAt: refund.refundedAt || new Date().toISOString(),
      });
    }
  }

  const severityRank: Record<PaymentSettlementAnomaly["severity"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return anomalies.sort((left, right) => {
    const severityDiff = severityRank[right.severity] - severityRank[left.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
  });
}

function getPayoutStatusGroupKey(
  entry: PaymentSettlementEntryRecord
): PaymentSettlementPayoutStatusGroupKey {
  if (!entry.payoutId || !entry.payoutStatus) {
    return "NOT_IN_PAYOUT";
  }

  switch (entry.payoutStatus) {
    case "pending":
      return "PENDING";
    case "in_transit":
      return "IN_TRANSIT";
    case "paid":
      return "PAID";
    case "failed":
      return "FAILED";
    case "canceled":
      return "CANCELED";
    default:
      return "OTHER";
  }
}

function getPayoutStatusGroupTitle(
  key: PaymentSettlementPayoutStatusGroupKey
) {
  switch (key) {
    case "NOT_IN_PAYOUT":
      return "待进入 payout";
    case "PENDING":
      return "Payout 待处理";
    case "IN_TRANSIT":
      return "Payout 处理中";
    case "PAID":
      return "Payout 已到账";
    case "FAILED":
      return "Payout 失败";
    case "CANCELED":
      return "Payout 已取消";
    default:
      return "其他 payout 状态";
  }
}

function buildEntryGroups(entries: PaymentSettlementEntryRecord[]) {
  const groupOrder: PaymentSettlementPayoutStatusGroupKey[] = [
    "NOT_IN_PAYOUT",
    "PENDING",
    "IN_TRANSIT",
    "PAID",
    "FAILED",
    "CANCELED",
    "OTHER",
  ];

  const groups = new Map<
    PaymentSettlementPayoutStatusGroupKey,
    PaymentSettlementEntryGroup
  >();

  for (const entry of entries) {
    const key = getPayoutStatusGroupKey(entry);
    const current =
      groups.get(key) ||
      ({
        key,
        title: getPayoutStatusGroupTitle(key),
        payoutStatus: entry.payoutStatus,
        entryCount: 0,
        unreconciledEntryCount: 0,
        netAmount: 0,
        entries: [],
      } satisfies PaymentSettlementEntryGroup);

    current.entryCount += 1;
    current.netAmount += entry.net;
    if (
      entry.reconciliationStatus === SETTLEMENT_RECONCILIATION_STATUS_OPEN
    ) {
      current.unreconciledEntryCount += 1;
    }
    current.entries.push(entry);
    groups.set(key, current);
  }

  return groupOrder
    .map((key) => groups.get(key))
    .filter((group): group is PaymentSettlementEntryGroup => Boolean(group));
}

export function buildPaymentSettlementReportFromData(
  input: {
    entries: PaymentSettlementEntryRecord[];
    payouts: PaymentSettlementPayoutBaseRecord[];
    localPayments: PaymentSettlementLocalPaymentRecord[];
    localRefunds: PaymentSettlementLocalRefundRecord[];
  },
  params?: {
    start?: string | null;
    end?: string | null;
    entryLimit?: number | null;
  }
): PaymentSettlementReport {
  const { start, end } = resolveWindow(params);
  const visibleEntries = input.entries
    .filter((entry) => isVisibleEntry(entry, start, end))
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  const entryLimit = params?.entryLimit == null ? 100 : Math.max(0, params.entryLimit);
  const payoutRecords = buildPayoutRecords(input.payouts, input.entries, start, end);
  const limitedEntries = visibleEntries.slice(0, entryLimit);
  const entryGroups = buildEntryGroups(limitedEntries);
  const anomalies = buildSettlementAnomalies(
    visibleEntries,
    input.localPayments.filter((payment) => inWindow(payment.paidAt, start, end)),
    input.localRefunds.filter((refund) => inWindow(refund.refundedAt, start, end))
  );

  const lastSyncedAt =
    [
      ...input.entries.map((entry) => entry.updatedAt),
      ...input.payouts.map((payout) => payout.updatedAt),
    ].sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ||
    null;

  return {
    summary: {
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      grossCapturedAmount: visibleEntries
        .filter((entry) => isCaptureEntry(entry))
        .reduce((sum, entry) => sum + entry.amount, 0),
      refundedAmount: visibleEntries
        .filter((entry) => isRefundEntry(entry))
        .reduce((sum, entry) => sum + Math.abs(entry.amount), 0),
      feeAmount: visibleEntries.reduce((sum, entry) => sum + entry.fee, 0),
      netAmount: visibleEntries
        .filter((entry) => entry.externalSourceType !== "payout")
        .reduce((sum, entry) => sum + entry.net, 0),
      availableNetAmount: visibleEntries
        .filter((entry) => entry.status === "available" && !entry.payoutId)
        .reduce((sum, entry) => sum + entry.net, 0),
      pendingNetAmount: visibleEntries
        .filter((entry) => entry.status === "pending" && !entry.payoutId)
        .reduce((sum, entry) => sum + entry.net, 0),
      paidOutNetAmount: payoutRecords.reduce(
        (sum, payout) => sum + payout.linkedNetAmount,
        0
      ),
      payoutCount: payoutRecords.length,
      unreconciledEntryCount: visibleEntries.filter(
        (entry) =>
          entry.reconciliationStatus === SETTLEMENT_RECONCILIATION_STATUS_OPEN
      ).length,
      unmatchedEntryCount: visibleEntries.filter(
        (entry) => !entry.orderId && entry.externalSourceType !== "payout"
      ).length,
      anomalyCount: anomalies.length,
      lastSyncedAt,
    },
    payouts: payoutRecords,
    entries: limitedEntries,
    entryGroups,
    anomalies,
  };
}

async function getValidatedUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user?.id || null;
}

async function resolveLocalOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
    },
  });
}

async function resolveLocalOrderByPaymentIntent(paymentIntentId: string) {
  return prisma.order.findUnique({
    where: { paymentIntentId },
    select: {
      id: true,
      userId: true,
    },
  });
}

async function resolveLocalRefundById(refundId: string) {
  return prisma.orderRefund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      orderId: true,
      order: {
        select: {
          userId: true,
        },
      },
    },
  });
}

async function resolveLocalRefundByExternalRefundId(externalRefundId: string) {
  return prisma.orderRefund.findUnique({
    where: { externalRefundId },
    select: {
      id: true,
      orderId: true,
      order: {
        select: {
          userId: true,
        },
      },
    },
  });
}

async function resolveChargeContext(
  stripe: Stripe,
  sourceId: string
): Promise<ResolvedSettlementContext> {
  const charge = await stripe.charges.retrieve(sourceId);
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id || null;

  let localOrder =
    charge.metadata.orderId != null
      ? await resolveLocalOrderById(charge.metadata.orderId)
      : null;

  if (!localOrder && paymentIntentId) {
    localOrder = await resolveLocalOrderByPaymentIntent(paymentIntentId);
  }

  const validatedUserId =
    localOrder?.userId ||
    (charge.metadata.sellerId
      ? await getValidatedUserId(charge.metadata.sellerId)
      : null);

  return {
    userId: validatedUserId,
    orderId: localOrder?.id || null,
    refundId: null,
    sourceType: "charge",
    sourceMetadata: sanitizeStripeObject({
      chargeId: charge.id,
      paymentIntentId,
      metadata: charge.metadata,
    }),
  };
}

async function resolveRefundContext(
  stripe: Stripe,
  sourceId: string
): Promise<ResolvedSettlementContext> {
  const refund = await stripe.refunds.retrieve(sourceId);

  let localRefund =
    refund.metadata?.refundId != null
      ? await resolveLocalRefundById(refund.metadata.refundId)
      : null;

  if (!localRefund) {
    localRefund = await resolveLocalRefundByExternalRefundId(refund.id);
  }

  let localOrder = null;
  if (localRefund?.orderId) {
    localOrder = await resolveLocalOrderById(localRefund.orderId);
  } else if (refund.metadata?.orderId) {
    localOrder = await resolveLocalOrderById(refund.metadata.orderId);
  }

  if (!localOrder) {
    const chargeId =
      typeof refund.charge === "string"
        ? refund.charge
        : refund.charge?.id || null;

    if (chargeId) {
      const chargeContext = await resolveChargeContext(stripe, chargeId);

      return {
        userId: chargeContext.userId,
        orderId: chargeContext.orderId,
        refundId: localRefund?.id || null,
        sourceType: "refund",
        sourceMetadata: sanitizeStripeObject({
          refundId: refund.id,
          metadata: refund.metadata,
          chargeId,
          upstream: chargeContext.sourceMetadata,
        }),
      };
    }
  }

  return {
    userId: localRefund?.order.userId || localOrder?.userId || null,
    orderId: localRefund?.orderId || localOrder?.id || null,
    refundId: localRefund?.id || null,
    sourceType: "refund",
    sourceMetadata: sanitizeStripeObject({
      refundId: refund.id,
      metadata: refund.metadata,
      chargeId:
        typeof refund.charge === "string"
          ? refund.charge
          : refund.charge?.id || null,
    }),
  };
}

async function resolveSettlementContext(
  stripe: Stripe,
  sourceId: string | null
) {
  if (!sourceId) {
    return {
      userId: null,
      orderId: null,
      refundId: null,
      sourceType: null,
      sourceMetadata: null,
    } satisfies ResolvedSettlementContext;
  }

  if (sourceId.startsWith("ch_")) {
    return resolveChargeContext(stripe, sourceId);
  }

  if (sourceId.startsWith("re_")) {
    return resolveRefundContext(stripe, sourceId);
  }

  if (sourceId.startsWith("po_")) {
    return {
      userId: null,
      orderId: null,
      refundId: null,
      sourceType: "payout",
      sourceMetadata: sanitizeStripeObject({
        payoutId: sourceId,
      }),
    } satisfies ResolvedSettlementContext;
  }

  return {
    userId: null,
    orderId: null,
    refundId: null,
    sourceType: inferSourceType(sourceId),
    sourceMetadata: sanitizeStripeObject({
      sourceId,
    }),
  } satisfies ResolvedSettlementContext;
}

async function upsertSettlementPayout(
  payout: Stripe.Payout,
  options?: {
    stripeAccountId?: string | null;
    accountScope?: string | null;
  }
) {
  const accountData = options
    ? {
        stripeAccountId: options.stripeAccountId ?? null,
        accountScope: options.accountScope ?? null,
      }
    : {};

  return prisma.paymentSettlementPayout.upsert({
    where: {
      externalPayoutId: payout.id,
    },
    create: {
      ...accountData,
      provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      externalPayoutId: payout.id,
      status: payout.status,
      amount: fromStripeAmount(payout.amount, payout.currency),
      currency: payout.currency.toUpperCase(),
      payoutMethod: payout.method || null,
      description: payout.description || null,
      statementDescriptor: payout.statement_descriptor || null,
      rawData: sanitizeStripeObject(payout) ?? Prisma.JsonNull,
      payoutCreatedAt: new Date(payout.created * 1000),
      arrivalDate: fromUnixSeconds(payout.arrival_date),
      paidAt:
        payout.status === "paid" ? fromUnixSeconds(payout.arrival_date) : null,
    },
    update: {
      ...accountData,
      status: payout.status,
      amount: fromStripeAmount(payout.amount, payout.currency),
      currency: payout.currency.toUpperCase(),
      payoutMethod: payout.method || null,
      description: payout.description || null,
      statementDescriptor: payout.statement_descriptor || null,
      rawData: sanitizeStripeObject(payout) ?? Prisma.JsonNull,
      payoutCreatedAt: new Date(payout.created * 1000),
      arrivalDate: fromUnixSeconds(payout.arrival_date),
      paidAt:
        payout.status === "paid" ? fromUnixSeconds(payout.arrival_date) : null,
    },
    select: {
      id: true,
      externalPayoutId: true,
    },
  });
}

export async function syncStripeSettlementPayoutByConnectedAccountId(
  connectedAccountId: string,
  payout: Stripe.Payout
) {
  return upsertSettlementPayout(payout, {
    stripeAccountId: connectedAccountId,
    accountScope: SETTLEMENT_ACCOUNT_SCOPE_CONNECTED,
  });
}

async function upsertSettlementEntry(input: {
  userId: string;
  stripe: Stripe;
  transaction: Stripe.BalanceTransaction;
  payoutId?: string | null;
  contextCache: Map<string, ResolvedSettlementContext>;
}) {
  const sourceId = getStripeSourceId(input.transaction.source);
  const cachedContext = sourceId ? input.contextCache.get(sourceId) : null;
  const resolvedContext =
    cachedContext ||
    (await resolveSettlementContext(input.stripe, sourceId));

  if (sourceId && !cachedContext) {
    input.contextCache.set(sourceId, resolvedContext);
  }

  if (resolvedContext.userId && resolvedContext.userId !== input.userId) {
    return {
      skipped: true,
      matchedOrder: false,
      matchedRefund: false,
      matchedPayout: false,
      externalBalanceTransactionId: input.transaction.id,
    };
  }

  // Current admin sessions are seller-scoped; if Stripe cannot identify a local
  // seller from metadata, keep the entry attached to the syncing seller so it
  // still surfaces for write-off review.
  const effectiveUserId = resolvedContext.userId || input.userId;
  const occurredAt = new Date(input.transaction.created * 1000);
  const availableOn = fromUnixSeconds(input.transaction.available_on);

  const relationData = {
    user: {
      connect: {
        id: effectiveUserId,
      },
    },
    ...(resolvedContext.orderId
      ? {
          order: {
            connect: {
              id: resolvedContext.orderId,
            },
          },
        }
      : {}),
    ...(resolvedContext.refundId
      ? {
          refund: {
            connect: {
              id: resolvedContext.refundId,
            },
          },
        }
      : {}),
    ...(input.payoutId !== undefined
      ? input.payoutId
        ? {
            payout: {
              connect: {
                id: input.payoutId,
              },
            },
          }
        : {
            payout: {
              disconnect: true,
            },
          }
      : {}),
  };

  await prisma.paymentSettlementEntry.upsert({
    where: {
      externalBalanceTransactionId: input.transaction.id,
    },
    create: {
      provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      externalBalanceTransactionId: input.transaction.id,
      externalSourceId: sourceId,
      externalSourceType:
        resolvedContext.sourceType || inferSourceType(sourceId),
      type: input.transaction.type,
      reportingCategory: input.transaction.reporting_category || null,
      status: input.transaction.status,
      amount: fromStripeAmount(
        input.transaction.amount,
        input.transaction.currency
      ),
      fee: fromStripeAmount(input.transaction.fee, input.transaction.currency),
      net: fromStripeAmount(input.transaction.net, input.transaction.currency),
      currency: input.transaction.currency.toUpperCase(),
      description: input.transaction.description || null,
      occurredAt,
      availableOn,
      sourceMetadata:
        resolvedContext.sourceMetadata == null
          ? Prisma.JsonNull
          : resolvedContext.sourceMetadata,
      rawData: sanitizeStripeObject(input.transaction) ?? Prisma.JsonNull,
      ...relationData,
    },
    update: {
      externalSourceId: sourceId,
      externalSourceType:
        resolvedContext.sourceType || inferSourceType(sourceId),
      type: input.transaction.type,
      reportingCategory: input.transaction.reporting_category || null,
      status: input.transaction.status,
      amount: fromStripeAmount(
        input.transaction.amount,
        input.transaction.currency
      ),
      fee: fromStripeAmount(input.transaction.fee, input.transaction.currency),
      net: fromStripeAmount(input.transaction.net, input.transaction.currency),
      currency: input.transaction.currency.toUpperCase(),
      description: input.transaction.description || null,
      occurredAt,
      availableOn,
      sourceMetadata:
        resolvedContext.sourceMetadata == null
          ? Prisma.JsonNull
          : resolvedContext.sourceMetadata,
      rawData: sanitizeStripeObject(input.transaction) ?? Prisma.JsonNull,
      ...relationData,
    },
  });

  return {
    skipped: false,
    matchedOrder: resolvedContext.orderId != null,
    matchedRefund: resolvedContext.refundId != null,
    matchedPayout: input.payoutId != null,
    externalBalanceTransactionId: input.transaction.id,
  };
}

export async function syncStripeSettlementLedger(
  userId: string,
  input?: {
    start?: string | null;
    end?: string | null;
  }
): Promise<PaymentSettlementLedgerSyncResult> {
  const stripe = getStripeClient();
  const { start, end } = resolveWindow(input);
  const contextCache = new Map<string, ResolvedSettlementContext>();
  const payoutMap = new Map<string, string>();
  const syncedEntries = new Set<string>();
  let syncedPayouts = 0;
  let matchedOrders = 0;
  let matchedRefunds = 0;
  let matchedPayoutEntries = 0;

  for await (const payout of stripe.payouts.list({
    created: {
      gte: toUnixSeconds(start),
      lte: toUnixSeconds(end),
    },
    limit: 100,
  })) {
    const localPayout = await upsertSettlementPayout(payout);
    payoutMap.set(payout.id, localPayout.id);
    syncedPayouts += 1;

    for await (const transaction of stripe.balanceTransactions.list({
      payout: payout.id,
      limit: 100,
    })) {
      const result = await upsertSettlementEntry({
        userId,
        stripe,
        transaction,
        payoutId: localPayout.id,
        contextCache,
      });

      if (result.skipped) {
        continue;
      }

      syncedEntries.add(result.externalBalanceTransactionId);
      matchedOrders += result.matchedOrder ? 1 : 0;
      matchedRefunds += result.matchedRefund ? 1 : 0;
      matchedPayoutEntries += result.matchedPayout ? 1 : 0;
    }
  }

  for await (const transaction of stripe.balanceTransactions.list({
    created: {
      gte: toUnixSeconds(start),
      lte: toUnixSeconds(end),
    },
    limit: 100,
  })) {
    const sourceId = getStripeSourceId(transaction.source);
    const payoutId =
      sourceId && sourceId.startsWith("po_")
        ? payoutMap.get(sourceId) || null
        : undefined;

    const result = await upsertSettlementEntry({
      userId,
      stripe,
      transaction,
      payoutId,
      contextCache,
    });

    if (result.skipped) {
      continue;
    }

    syncedEntries.add(result.externalBalanceTransactionId);
    matchedOrders += result.matchedOrder ? 1 : 0;
    matchedRefunds += result.matchedRefund ? 1 : 0;
    matchedPayoutEntries += result.matchedPayout ? 1 : 0;
  }

  return {
    syncedEntries: syncedEntries.size,
    syncedPayouts,
    matchedOrders,
    matchedRefunds,
    matchedPayoutEntries,
  };
}

export async function updatePaymentSettlementEntries(input: {
  userId: string;
  ids: string[];
  reconciliationStatus: SettlementReconciliationStatus;
  note?: string | null;
}) {
  if (input.ids.length === 0) {
    throw new Error("Please select at least one settlement entry");
  }

  if (
    ![
      SETTLEMENT_RECONCILIATION_STATUS_OPEN,
      SETTLEMENT_RECONCILIATION_STATUS_RECONCILED,
      SETTLEMENT_RECONCILIATION_STATUS_IGNORED,
    ].includes(input.reconciliationStatus)
  ) {
    throw new Error("Unsupported reconciliation status");
  }

  const matchedEntries = await prisma.paymentSettlementEntry.findMany({
    where: {
      id: {
        in: input.ids,
      },
      userId: input.userId,
    },
    select: {
      id: true,
    },
  });

  if (matchedEntries.length !== input.ids.length) {
    throw new Error("Some settlement entries were not found");
  }

  const reconciledAt =
    input.reconciliationStatus === SETTLEMENT_RECONCILIATION_STATUS_OPEN
      ? null
      : new Date();

  await prisma.paymentSettlementEntry.updateMany({
    where: {
      id: {
        in: input.ids,
      },
      userId: input.userId,
    },
    data: {
      reconciliationStatus: input.reconciliationStatus,
      reconciliationNote: input.note?.trim() || null,
      reconciledAt,
    },
  });

  return {
    updatedCount: input.ids.length,
  };
}

export async function getPaymentSettlementReport(
  userId: string,
  input?: {
    start?: string | null;
    end?: string | null;
    entryLimit?: number | null;
  }
) {
  const [entries, payouts, localPayments, localRefunds] = await Promise.all([
    prisma.paymentSettlementEntry.findMany({
      where: {
        userId,
        provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      },
      orderBy: {
        occurredAt: "desc",
      },
      select: {
        id: true,
        externalBalanceTransactionId: true,
        provider: true,
        stripeAccountId: true,
        accountScope: true,
        externalSourceId: true,
        externalSourceType: true,
        type: true,
        reportingCategory: true,
        status: true,
        amount: true,
        fee: true,
        net: true,
        currency: true,
        description: true,
        occurredAt: true,
        availableOn: true,
        reconciliationStatus: true,
        reconciliationNote: true,
        reconciledAt: true,
        updatedAt: true,
        orderId: true,
        refundId: true,
        order: {
          select: {
            buyerEmail: true,
            buyerName: true,
            status: true,
            paymentStatus: true,
            paymentRoutingMode: true,
            connectedAccountId: true,
            platformFeeAmount: true,
            sellerNetExpectedAmount: true,
          },
        },
        refund: {
          select: {
            status: true,
          },
        },
        payoutId: true,
        payout: {
          select: {
            externalPayoutId: true,
            stripeAccountId: true,
            accountScope: true,
            status: true,
            arrivalDate: true,
            payoutCreatedAt: true,
          },
        },
      },
    }),
    prisma.paymentSettlementPayout.findMany({
      where: {
        entries: {
          some: {
            userId,
            provider: ORDER_PAYMENT_PROVIDER_STRIPE,
          },
        },
      },
      orderBy: {
        payoutCreatedAt: "desc",
      },
      select: {
        id: true,
        externalPayoutId: true,
        provider: true,
        stripeAccountId: true,
        accountScope: true,
        status: true,
        amount: true,
        currency: true,
        payoutMethod: true,
        description: true,
        statementDescriptor: true,
        payoutCreatedAt: true,
        arrivalDate: true,
        paidAt: true,
        updatedAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        userId,
        paymentProvider: ORDER_PAYMENT_PROVIDER_STRIPE,
        paymentStatus: {
          in: [
            ORDER_PAYMENT_STATUS_PAID,
            ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED,
            ORDER_PAYMENT_STATUS_REFUNDED,
          ],
        },
      },
      select: {
        id: true,
        buyerEmail: true,
        buyerName: true,
        totalAmount: true,
        currency: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        paidAt: true,
      },
    }),
    prisma.orderRefund.findMany({
      where: {
        provider: ORDER_PAYMENT_PROVIDER_STRIPE,
        status: ORDER_REFUND_STATUS_SUCCEEDED,
        order: {
          userId,
        },
      },
      select: {
        id: true,
        orderId: true,
        amount: true,
        currency: true,
        status: true,
        externalRefundId: true,
        externalPaymentIntentId: true,
        refundedAt: true,
        order: {
          select: {
            buyerEmail: true,
            buyerName: true,
          },
        },
      },
    }),
  ]);

  return buildPaymentSettlementReportFromData(
    {
      entries: entries.map((entry) => ({
        id: entry.id,
        externalBalanceTransactionId: entry.externalBalanceTransactionId,
        provider: entry.provider,
        stripeAccountId: entry.stripeAccountId,
        accountScope: entry.accountScope,
        externalSourceId: entry.externalSourceId,
        externalSourceType: entry.externalSourceType,
        type: entry.type,
        reportingCategory: entry.reportingCategory,
        status: entry.status,
        amount: Number(entry.amount),
        fee: Number(entry.fee),
        net: Number(entry.net),
        currency: entry.currency,
        description: entry.description,
        occurredAt: entry.occurredAt.toISOString(),
        availableOn: toIsoStringOrNull(entry.availableOn),
        reconciliationStatus:
          entry.reconciliationStatus as SettlementReconciliationStatus,
        reconciliationNote: entry.reconciliationNote,
        reconciledAt: toIsoStringOrNull(entry.reconciledAt),
        updatedAt: entry.updatedAt.toISOString(),
        orderId: entry.orderId,
        buyerEmail: entry.order?.buyerEmail || null,
        buyerName: entry.order?.buyerName || null,
        orderStatus: entry.order?.status || null,
        paymentStatus: entry.order?.paymentStatus || null,
        paymentRoutingMode: entry.order?.paymentRoutingMode || null,
        connectedAccountId: entry.order?.connectedAccountId || null,
        platformFeeAmount:
          entry.order?.platformFeeAmount == null
            ? null
            : Number(entry.order.platformFeeAmount),
        sellerNetExpectedAmount:
          entry.order?.sellerNetExpectedAmount == null
            ? null
            : Number(entry.order.sellerNetExpectedAmount),
        refundId: entry.refundId,
        refundStatus: entry.refund?.status || null,
        payoutId: entry.payoutId,
        payoutExternalId: entry.payout?.externalPayoutId || null,
        payoutStatus: entry.payout?.status || null,
        payoutArrivalDate: toIsoStringOrNull(entry.payout?.arrivalDate),
        payoutCreatedAt: toIsoStringOrNull(entry.payout?.payoutCreatedAt),
      })),
      payouts: payouts.map((payout) => ({
        id: payout.id,
        externalPayoutId: payout.externalPayoutId,
        provider: payout.provider,
        stripeAccountId: payout.stripeAccountId,
        accountScope: payout.accountScope,
        status: payout.status,
        amount: Number(payout.amount),
        currency: payout.currency,
        payoutMethod: payout.payoutMethod,
        description: payout.description,
        statementDescriptor: payout.statementDescriptor,
        payoutCreatedAt: payout.payoutCreatedAt.toISOString(),
        arrivalDate: toIsoStringOrNull(payout.arrivalDate),
        paidAt: toIsoStringOrNull(payout.paidAt),
        updatedAt: payout.updatedAt.toISOString(),
      })),
      localPayments: localPayments.map((payment) => ({
        orderId: payment.id,
        buyerEmail: payment.buyerEmail,
        buyerName: payment.buyerName,
        totalAmount: Number(payment.totalAmount),
        currency: payment.currency,
        orderStatus: payment.status,
        paymentStatus: payment.paymentStatus,
        paymentIntentId: payment.paymentIntentId,
        paidAt: toIsoStringOrNull(payment.paidAt),
      })),
      localRefunds: localRefunds.map((refund) => ({
        refundId: refund.id,
        orderId: refund.orderId,
        buyerEmail: refund.order.buyerEmail,
        buyerName: refund.order.buyerName,
        amount: Number(refund.amount),
        currency: refund.currency,
        refundStatus: refund.status,
        externalRefundId: refund.externalRefundId,
        externalPaymentIntentId: refund.externalPaymentIntentId,
        refundedAt: toIsoStringOrNull(refund.refundedAt),
      })),
    },
    input
  );
}
