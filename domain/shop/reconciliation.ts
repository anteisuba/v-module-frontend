import { prisma } from "@/lib/prisma";
import { ORDER_PAYMENT_PROVIDER_STRIPE } from "./services";

export interface PaymentReconciliationAttemptRecord {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  externalSessionId: string | null;
  externalPaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  paidAt: string | null;
  failedAt: string | null;
  expiredAt: string | null;
}

export interface PaymentReconciliationRefundRecord {
  id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  reason: string | null;
  failureReason: string | null;
  externalRefundId: string | null;
  externalPaymentIntentId: string | null;
  createdAt: string;
  refundedAt: string | null;
}

export interface PaymentReconciliationDisputeRecord {
  id: string;
  status: string;
  reason: string | null;
  amount: number;
  currency: string;
  externalDisputeId: string;
  externalPaymentIntentId: string | null;
  externalChargeId: string | null;
  dueBy: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReconciliationOrderRecord {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  paymentProvider: string | null;
  paymentStatus: string | null;
  paymentSessionId: string | null;
  paymentIntentId: string | null;
  paymentExpiresAt: string | null;
  paymentFailureReason: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  paymentAttempts: PaymentReconciliationAttemptRecord[];
  refunds: PaymentReconciliationRefundRecord[];
  disputes: PaymentReconciliationDisputeRecord[];
}

export interface PaymentReconciliationSummary {
  windowStart: string;
  windowEnd: string;
  stripeOrderCount: number;
  paidOrderCount: number;
  grossCapturedAmount: number;
  refundedAmount: number;
  netCollectedAmount: number;
  openOrderCount: number;
  failedOrderCount: number;
  pendingRefundCount: number;
  anomalyCount: number;
}

export interface PaymentReconciliationEvent {
  id: string;
  kind: "PAYMENT_ATTEMPT" | "REFUND";
  orderId: string;
  buyerEmail: string;
  buyerName: string | null;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  occurredAt: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentSessionId: string | null;
  paymentIntentId: string | null;
  externalRefundId: string | null;
  reason: string | null;
  failureReason: string | null;
}

export interface PaymentReconciliationAnomaly {
  id: string;
  code: string;
  severity: "high" | "medium" | "low";
  orderId: string;
  buyerEmail: string;
  buyerName: string | null;
  title: string;
  description: string;
  suggestedAction: string;
  orderStatus: string;
  paymentStatus: string | null;
  paymentSessionId: string | null;
  paymentIntentId: string | null;
  createdAt: string;
}

export interface PaymentReconciliationReport {
  summary: PaymentReconciliationSummary;
  events: PaymentReconciliationEvent[];
  anomalies: PaymentReconciliationAnomaly[];
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

  return {
    start,
    end,
  };
}

function toDate(value: string) {
  return new Date(value);
}

function inWindow(value: string, start: Date, end: Date) {
  const date = toDate(value);
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function getAttemptOccurredAt(attempt: PaymentReconciliationAttemptRecord) {
  if (attempt.status === "PAID" && attempt.paidAt) {
    return attempt.paidAt;
  }

  if (attempt.status === "FAILED" && attempt.failedAt) {
    return attempt.failedAt;
  }

  if (attempt.status === "EXPIRED" && attempt.expiredAt) {
    return attempt.expiredAt;
  }

  return attempt.createdAt;
}

function getRefundOccurredAt(refund: PaymentReconciliationRefundRecord) {
  return refund.refundedAt || refund.createdAt;
}

function getSuccessfulRefundAmount(order: PaymentReconciliationOrderRecord) {
  return order.refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + refund.amount, 0);
}

function getPendingRefundAmount(order: PaymentReconciliationOrderRecord) {
  return order.refunds
    .filter((refund) => refund.status === "PENDING")
    .reduce((sum, refund) => sum + refund.amount, 0);
}

function buildEvents(
  orders: PaymentReconciliationOrderRecord[],
  start: Date,
  end: Date
) {
  const events: PaymentReconciliationEvent[] = [];

  for (const order of orders) {
    for (const attempt of order.paymentAttempts) {
      const occurredAt = getAttemptOccurredAt(attempt);
      if (!inWindow(occurredAt, start, end)) {
        continue;
      }

      events.push({
        id: `payment-${attempt.id}`,
        kind: "PAYMENT_ATTEMPT",
        orderId: order.id,
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        provider: attempt.provider,
        status: attempt.status,
        amount: attempt.amount,
        currency: attempt.currency,
        occurredAt,
        createdAt: attempt.createdAt,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        paymentSessionId: attempt.externalSessionId || order.paymentSessionId,
        paymentIntentId:
          attempt.externalPaymentIntentId || order.paymentIntentId,
        externalRefundId: null,
        reason: null,
        failureReason: attempt.failureReason,
      });
    }

    for (const refund of order.refunds) {
      const occurredAt = getRefundOccurredAt(refund);
      if (!inWindow(occurredAt, start, end)) {
        continue;
      }

      events.push({
        id: `refund-${refund.id}`,
        kind: "REFUND",
        orderId: order.id,
        buyerEmail: order.buyerEmail,
        buyerName: order.buyerName,
        provider: refund.provider,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        occurredAt,
        createdAt: refund.createdAt,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        paymentSessionId: order.paymentSessionId,
        paymentIntentId:
          refund.externalPaymentIntentId || order.paymentIntentId,
        externalRefundId: refund.externalRefundId,
        reason: refund.reason,
        failureReason: refund.failureReason,
      });
    }
  }

  return events.sort(
    (left, right) =>
      toDate(right.occurredAt).getTime() - toDate(left.occurredAt).getTime()
  );
}

function pushAnomaly(
  anomalies: PaymentReconciliationAnomaly[],
  order: PaymentReconciliationOrderRecord,
  anomaly: Omit<PaymentReconciliationAnomaly, "orderId" | "buyerEmail" | "buyerName" | "paymentSessionId" | "paymentIntentId" | "createdAt">
) {
  anomalies.push({
    ...anomaly,
    orderId: order.id,
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName,
    paymentSessionId: order.paymentSessionId,
    paymentIntentId: order.paymentIntentId,
    createdAt: order.updatedAt,
  });
}

function buildAnomalies(orders: PaymentReconciliationOrderRecord[]) {
  const anomalies: PaymentReconciliationAnomaly[] = [];
  const now = new Date();

  for (const order of orders) {
    const paidAttempts = order.paymentAttempts.filter(
      (attempt) => attempt.status === "PAID"
    );
    const successfulRefundAmount = getSuccessfulRefundAmount(order);
    const hasSuccessfulRefund = successfulRefundAmount > 0;
    const pendingRefundAmount = getPendingRefundAmount(order);
    const openDispute = order.disputes.find((dispute) =>
      [
        "warning_needs_response",
        "warning_under_review",
        "needs_response",
        "under_review",
      ].includes(dispute.status)
    );
    const lostDispute = order.disputes.find((dispute) => dispute.status === "lost");

    if (
      ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
        order.paymentStatus || ""
      ) &&
      !order.paymentIntentId
    ) {
      pushAnomaly(anomalies, order, {
        id: `missing-payment-intent-${order.id}`,
        code: "MISSING_PAYMENT_INTENT",
        severity: "high",
        title: "已收款订单缺少 PaymentIntent",
        description: "订单支付状态已进入成功态，但没有记录可对账的 PaymentIntent。",
        suggestedAction: "检查历史迁移或 webhook 写入，补齐 PaymentIntent 后再继续退款/对账。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (
      order.paymentStatus === "OPEN" &&
      order.paymentExpiresAt &&
      toDate(order.paymentExpiresAt).getTime() < now.getTime() &&
      order.status !== "CANCELLED"
    ) {
      pushAnomaly(anomalies, order, {
        id: `expired-open-${order.id}`,
        code: "EXPIRED_CHECKOUT_STILL_OPEN",
        severity: "medium",
        title: "支付会话已过期但订单仍未关闭",
        description: "Stripe Checkout 已过期，订单仍保持 OPEN / 未取消状态。",
        suggestedAction: "检查 webhook 是否漏收，并手动取消该订单或同步 Stripe 结果。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (
      ["PAID", "SHIPPED", "DELIVERED"].includes(order.status) &&
      ["OPEN", "FAILED", "EXPIRED"].includes(order.paymentStatus || "")
    ) {
      pushAnomaly(anomalies, order, {
        id: `fulfillment-without-payment-${order.id}`,
        code: "FULFILLMENT_WITHOUT_PAYMENT",
        severity: "high",
        title: "履约状态领先于支付状态",
        description: "订单已经进入履约流程，但支付侧仍是未成功状态。",
        suggestedAction: "暂停履约，核对 Stripe 支付事件和订单状态，必要时回滚发货状态。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (
      order.status === "AWAITING_PAYMENT" &&
      ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
        order.paymentStatus || ""
      )
    ) {
      pushAnomaly(anomalies, order, {
        id: `awaiting-after-paid-${order.id}`,
        code: "AWAITING_PAYMENT_AFTER_PAID",
        severity: "high",
        title: "订单仍停留在等待支付",
        description: "支付已经成功，但订单状态没有推进到已支付。",
        suggestedAction: "检查 webhook 回写逻辑，并手动修正订单状态。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (successfulRefundAmount - order.totalAmount > 0.000001) {
      pushAnomaly(anomalies, order, {
        id: `refund-over-total-${order.id}`,
        code: "REFUND_EXCEEDS_ORDER_TOTAL",
        severity: "high",
        title: "退款金额超过订单总额",
        description: `成功退款 ${successfulRefundAmount.toFixed(2)} 已超过订单总额 ${order.totalAmount.toFixed(2)}。`,
        suggestedAction: "立即核对 Stripe 退款记录和本地金额，确认是否发生重复退款。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (
      hasSuccessfulRefund &&
      !["PARTIALLY_REFUNDED", "REFUNDED"].includes(order.paymentStatus || "")
    ) {
      pushAnomaly(anomalies, order, {
        id: `refund-status-mismatch-${order.id}`,
        code: "REFUND_STATUS_MISMATCH",
        severity: "medium",
        title: "退款记录与订单支付状态不一致",
        description: "订单已存在成功退款，但 paymentStatus 仍未反映退款结果。",
        suggestedAction: "检查退款回写逻辑，并同步订单 paymentStatus。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (paidAttempts.length > 1) {
      pushAnomaly(anomalies, order, {
        id: `multiple-paid-attempts-${order.id}`,
        code: "MULTIPLE_SUCCESSFUL_PAYMENTS",
        severity: "medium",
        title: "同一订单存在多次成功支付",
        description: `订单记录了 ${paidAttempts.length} 次成功支付尝试。`,
        suggestedAction: "核对是否重复扣款，必要时尽快发起退款。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (order.paymentStatus === "REFUNDED" && order.status !== "CANCELLED") {
      pushAnomaly(anomalies, order, {
        id: `refunded-not-cancelled-${order.id}`,
        code: "REFUNDED_ORDER_NOT_CANCELLED",
        severity: "low",
        title: "全额退款订单未关闭",
        description: "支付已经全额退款，但订单履约状态没有回到取消态。",
        suggestedAction: "确认未发货后将订单关闭，避免误履约。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (pendingRefundAmount > order.totalAmount + 0.000001) {
      pushAnomaly(anomalies, order, {
        id: `pending-refund-over-total-${order.id}`,
        code: "PENDING_REFUND_EXCEEDS_TOTAL",
        severity: "medium",
        title: "待处理退款金额过高",
        description: "待处理退款金额已经超过订单总额，存在重复退款风险。",
        suggestedAction: "检查后台退款操作是否重复提交，并核对 Stripe 退款队列。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (openDispute) {
      pushAnomaly(anomalies, order, {
        id: `open-dispute-${openDispute.id}`,
        code: "DISPUTE_NEEDS_RESPONSE",
        severity: "high",
        title: "订单存在待处理争议",
        description: `Stripe dispute 当前状态为 ${openDispute.status}。`,
        suggestedAction: "立即在 Stripe Dashboard 补充证据，并暂停继续履约或退款操作。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }

    if (lostDispute) {
      pushAnomaly(anomalies, order, {
        id: `lost-dispute-${lostDispute.id}`,
        code: "CHARGEBACK_LOST",
        severity: "high",
        title: "订单争议已败诉",
        description: "Stripe dispute 已进入 lost，订单资金可能已经被撤回。",
        suggestedAction: "核对结算流水、库存和售后记录，必要时冻结后续发货或二次退款。",
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      });
    }
  }

  const severityRank: Record<PaymentReconciliationAnomaly["severity"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return anomalies.sort((left, right) => {
    const severityDiff = severityRank[right.severity] - severityRank[left.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return toDate(right.createdAt).getTime() - toDate(left.createdAt).getTime();
  });
}

export function buildPaymentReconciliationReportFromOrders(
  orders: PaymentReconciliationOrderRecord[],
  input?: {
    start?: string | null;
    end?: string | null;
    eventLimit?: number | null;
  }
): PaymentReconciliationReport {
  const { start, end } = resolveWindow(input);
  const events = buildEvents(orders, start, end);
  const anomalies = buildAnomalies(orders);
  const eventLimit =
    input?.eventLimit == null ? 50 : Math.max(0, input.eventLimit);
  const visibleEvents = events.slice(0, eventLimit);

  const successfulPaymentsInWindow = events.filter(
    (event) => event.kind === "PAYMENT_ATTEMPT" && event.status === "PAID"
  );
  const successfulRefundsInWindow = events.filter(
    (event) => event.kind === "REFUND" && event.status === "SUCCEEDED"
  );

  return {
    summary: {
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      stripeOrderCount: orders.length,
      paidOrderCount: orders.filter((order) =>
        ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
          order.paymentStatus || ""
        )
      ).length,
      grossCapturedAmount: successfulPaymentsInWindow.reduce(
        (sum, event) => sum + event.amount,
        0
      ),
      refundedAmount: successfulRefundsInWindow.reduce(
        (sum, event) => sum + event.amount,
        0
      ),
      netCollectedAmount:
        successfulPaymentsInWindow.reduce((sum, event) => sum + event.amount, 0) -
        successfulRefundsInWindow.reduce((sum, event) => sum + event.amount, 0),
      openOrderCount: orders.filter((order) => order.paymentStatus === "OPEN").length,
      failedOrderCount: orders.filter((order) =>
        ["FAILED", "EXPIRED"].includes(order.paymentStatus || "")
      ).length,
      pendingRefundCount: orders.reduce(
        (sum, order) =>
          sum +
          order.refunds.filter((refund) => refund.status === "PENDING").length,
        0
      ),
      anomalyCount: anomalies.length,
    },
    events: visibleEvents,
    anomalies,
  };
}

function serializeOrdersForReconciliation(
  records: Array<{
    id: string;
    buyerEmail: string;
    buyerName: string | null;
    totalAmount: { toString(): string };
    currency: string;
    status: string;
    paymentProvider: string | null;
    paymentStatus: string | null;
    paymentSessionId: string | null;
    paymentIntentId: string | null;
    paymentExpiresAt: Date | null;
    paymentFailureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    paidAt: Date | null;
    paymentAttempts: Array<{
      id: string;
      provider: string;
      status: string;
      amount: { toString(): string };
      currency: string;
      externalSessionId: string | null;
      externalPaymentIntentId: string | null;
      failureReason: string | null;
      createdAt: Date;
      paidAt: Date | null;
      failedAt: Date | null;
      expiredAt: Date | null;
    }>;
    refunds: Array<{
      id: string;
      provider: string;
      status: string;
      amount: { toString(): string };
      currency: string;
      reason: string | null;
      failureReason: string | null;
      externalRefundId: string | null;
      externalPaymentIntentId: string | null;
      createdAt: Date;
      refundedAt: Date | null;
    }>;
    disputes: Array<{
      id: string;
      status: string;
      reason: string | null;
      amount: { toString(): string };
      currency: string;
      externalDisputeId: string;
      externalPaymentIntentId: string | null;
      externalChargeId: string | null;
      dueBy: Date | null;
      closedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }>
): PaymentReconciliationOrderRecord[] {
  return records.map((order) => ({
    id: order.id,
    buyerEmail: order.buyerEmail,
    buyerName: order.buyerName,
    totalAmount: Number(order.totalAmount.toString()),
    currency: order.currency,
    status: order.status,
    paymentProvider: order.paymentProvider,
    paymentStatus: order.paymentStatus,
    paymentSessionId: order.paymentSessionId,
    paymentIntentId: order.paymentIntentId,
    paymentExpiresAt: order.paymentExpiresAt?.toISOString() || null,
    paymentFailureReason: order.paymentFailureReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt?.toISOString() || null,
    paymentAttempts: order.paymentAttempts.map((attempt) => ({
      id: attempt.id,
      provider: attempt.provider,
      status: attempt.status,
      amount: Number(attempt.amount.toString()),
      currency: attempt.currency,
      externalSessionId: attempt.externalSessionId,
      externalPaymentIntentId: attempt.externalPaymentIntentId,
      failureReason: attempt.failureReason,
      createdAt: attempt.createdAt.toISOString(),
      paidAt: attempt.paidAt?.toISOString() || null,
      failedAt: attempt.failedAt?.toISOString() || null,
      expiredAt: attempt.expiredAt?.toISOString() || null,
    })),
    refunds: order.refunds.map((refund) => ({
      id: refund.id,
      provider: refund.provider,
      status: refund.status,
      amount: Number(refund.amount.toString()),
      currency: refund.currency,
      reason: refund.reason,
      failureReason: refund.failureReason,
      externalRefundId: refund.externalRefundId,
      externalPaymentIntentId: refund.externalPaymentIntentId,
      createdAt: refund.createdAt.toISOString(),
      refundedAt: refund.refundedAt?.toISOString() || null,
    })),
    disputes: order.disputes.map((dispute) => ({
      id: dispute.id,
      status: dispute.status,
      reason: dispute.reason,
      amount: Number(dispute.amount.toString()),
      currency: dispute.currency,
      externalDisputeId: dispute.externalDisputeId,
      externalPaymentIntentId: dispute.externalPaymentIntentId,
      externalChargeId: dispute.externalChargeId,
      dueBy: dispute.dueBy?.toISOString() || null,
      closedAt: dispute.closedAt?.toISOString() || null,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
    })),
  }));
}

export async function getPaymentReconciliationReport(
  userId: string,
  input?: {
    start?: string | null;
    end?: string | null;
    eventLimit?: number | null;
  }
) {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      paymentProvider: ORDER_PAYMENT_PROVIDER_STRIPE,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      buyerEmail: true,
      buyerName: true,
      totalAmount: true,
      currency: true,
      status: true,
      paymentProvider: true,
      paymentStatus: true,
      paymentSessionId: true,
      paymentIntentId: true,
      paymentExpiresAt: true,
      paymentFailureReason: true,
      createdAt: true,
      updatedAt: true,
      paidAt: true,
      paymentAttempts: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          externalSessionId: true,
          externalPaymentIntentId: true,
          failureReason: true,
          createdAt: true,
          paidAt: true,
          failedAt: true,
          expiredAt: true,
        },
      },
      refunds: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          provider: true,
          status: true,
          amount: true,
          currency: true,
          reason: true,
          failureReason: true,
          externalRefundId: true,
          externalPaymentIntentId: true,
          createdAt: true,
          refundedAt: true,
        },
      },
      disputes: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          reason: true,
          amount: true,
          currency: true,
          externalDisputeId: true,
          externalPaymentIntentId: true,
          externalChargeId: true,
          dueBy: true,
          closedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return buildPaymentReconciliationReportFromOrders(
    serializeOrdersForReconciliation(orders),
    input
  );
}

function escapeCsvField(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildPaymentEventsCsv(events: PaymentReconciliationEvent[]) {
  const header = [
    "kind",
    "orderId",
    "buyerEmail",
    "provider",
    "status",
    "amount",
    "currency",
    "occurredAt",
    "paymentSessionId",
    "paymentIntentId",
    "externalRefundId",
    "reason",
    "failureReason",
    "orderStatus",
    "paymentStatus",
  ];

  const rows = events.map((event) =>
    [
      escapeCsvField(event.kind),
      escapeCsvField(event.orderId),
      escapeCsvField(event.buyerEmail),
      escapeCsvField(event.provider),
      escapeCsvField(event.status),
      escapeCsvField(event.amount),
      escapeCsvField(event.currency),
      escapeCsvField(event.occurredAt),
      escapeCsvField(event.paymentSessionId),
      escapeCsvField(event.paymentIntentId),
      escapeCsvField(event.externalRefundId),
      escapeCsvField(event.reason),
      escapeCsvField(event.failureReason),
      escapeCsvField(event.orderStatus),
      escapeCsvField(event.paymentStatus),
    ].join(",")
  );

  return `\uFEFF${header.join(",")}\n${rows.join("\n")}`;
}

export function buildPaymentAnomaliesCsv(
  anomalies: PaymentReconciliationAnomaly[]
) {
  const header = [
    "severity",
    "code",
    "orderId",
    "buyerEmail",
    "title",
    "description",
    "suggestedAction",
    "orderStatus",
    "paymentStatus",
    "paymentSessionId",
    "paymentIntentId",
    "createdAt",
  ];

  const rows = anomalies.map((anomaly) =>
    [
      escapeCsvField(anomaly.severity),
      escapeCsvField(anomaly.code),
      escapeCsvField(anomaly.orderId),
      escapeCsvField(anomaly.buyerEmail),
      escapeCsvField(anomaly.title),
      escapeCsvField(anomaly.description),
      escapeCsvField(anomaly.suggestedAction),
      escapeCsvField(anomaly.orderStatus),
      escapeCsvField(anomaly.paymentStatus),
      escapeCsvField(anomaly.paymentSessionId),
      escapeCsvField(anomaly.paymentIntentId),
      escapeCsvField(anomaly.createdAt),
    ].join(",")
  );

  return `\uFEFF${header.join(",")}\n${rows.join("\n")}`;
}
