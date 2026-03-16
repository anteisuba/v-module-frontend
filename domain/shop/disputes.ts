import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import {
  ORDER_DISPUTE_STATUS_LOST,
  ORDER_DISPUTE_STATUS_NEEDS_RESPONSE,
  ORDER_DISPUTE_STATUS_UNDER_REVIEW,
  ORDER_DISPUTE_STATUS_WARNING_NEEDS_RESPONSE,
  ORDER_DISPUTE_STATUS_WARNING_UNDER_REVIEW,
  ORDER_DISPUTE_STATUS_WON,
  ORDER_DISPUTE_STATUS_WARNING_CLOSED,
  ORDER_PAYMENT_PROVIDER_STRIPE,
} from "./services";

export interface StripeDisputeSyncResult {
  syncedDisputes: number;
  matchedDisputeOrders: number;
  unmatchedDisputes: number;
}

interface DisputeResolutionContext {
  userId: string | null;
  orderId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  chargeMetadata: Record<string, string>;
}

function sanitizeStripeObject(value: unknown): Prisma.InputJsonValue | null {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function fromStripeAmount(amount: number, currency: string) {
  if (currency.toLowerCase() === "jpy") {
    return amount;
  }

  return amount / 100;
}

function toIsoDateOrNull(value: number | null | undefined) {
  return typeof value === "number"
    ? new Date(value * 1000).toISOString()
    : null;
}

function isClosedDisputeStatus(status: string) {
  return ([
    ORDER_DISPUTE_STATUS_WARNING_CLOSED,
    ORDER_DISPUTE_STATUS_WON,
    ORDER_DISPUTE_STATUS_LOST,
  ] as string[]).includes(status);
}

export function isOpenOrderDisputeStatus(status: string) {
  return ([
    ORDER_DISPUTE_STATUS_WARNING_NEEDS_RESPONSE,
    ORDER_DISPUTE_STATUS_WARNING_UNDER_REVIEW,
    ORDER_DISPUTE_STATUS_NEEDS_RESPONSE,
    ORDER_DISPUTE_STATUS_UNDER_REVIEW,
  ] as string[]).includes(status);
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

async function resolveDisputeContext(
  stripe: Stripe,
  dispute: Stripe.Dispute
): Promise<DisputeResolutionContext> {
  const charge =
    typeof dispute.charge === "string"
      ? await stripe.charges.retrieve(dispute.charge)
      : dispute.charge;
  const chargeId = charge?.id || (typeof dispute.charge === "string" ? dispute.charge : null);
  const paymentIntentId =
    typeof charge?.payment_intent === "string"
      ? charge.payment_intent
      : charge?.payment_intent?.id || null;
  const chargeMetadata = charge?.metadata || {};

  let localOrder =
    chargeMetadata.orderId != null
      ? await resolveLocalOrderById(chargeMetadata.orderId)
      : null;

  if (!localOrder && paymentIntentId) {
    localOrder = await resolveLocalOrderByPaymentIntent(paymentIntentId);
  }

  const userId =
    localOrder?.userId ||
    (chargeMetadata.sellerId
      ? await getValidatedUserId(chargeMetadata.sellerId)
      : null);

  return {
    userId,
    orderId: localOrder?.id || null,
    paymentIntentId,
    chargeId,
    chargeMetadata,
  };
}

async function upsertStripeDispute(
  dispute: Stripe.Dispute,
  options?: {
    userId?: string | null;
    enforceUserScope?: boolean;
  }
) {
  const stripe = getStripeClient();
  const [existing, context] = await Promise.all([
    prisma.orderDispute.findUnique({
      where: {
        externalDisputeId: dispute.id,
      },
      select: {
        id: true,
        closedAt: true,
      },
    }),
    resolveDisputeContext(stripe, dispute),
  ]);

  if (
    options?.enforceUserScope &&
    options.userId &&
    context.userId &&
    context.userId !== options.userId
  ) {
    return {
      synced: false,
      matchedOrder: false,
      unmatched: false,
    };
  }

  const scopedUserId =
    context.userId ||
    (options?.enforceUserScope ? options.userId || null : null);
  const matchedOrder = context.orderId != null;
  const unmatched = !matchedOrder;
  const closedAt =
    isClosedDisputeStatus(dispute.status)
      ? existing?.closedAt || new Date()
      : null;

  await prisma.orderDispute.upsert({
    where: {
      externalDisputeId: dispute.id,
    },
    create: {
      userId: scopedUserId,
      orderId: context.orderId,
      provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      status: dispute.status,
      reason: dispute.reason || null,
      amount: fromStripeAmount(dispute.amount, dispute.currency),
      currency: dispute.currency.toUpperCase(),
      externalDisputeId: dispute.id,
      externalPaymentIntentId: context.paymentIntentId,
      externalChargeId: context.chargeId,
      dueBy:
        typeof dispute.evidence_details?.due_by === "number"
          ? new Date(dispute.evidence_details.due_by * 1000)
          : null,
      closedAt,
      metadata:
        sanitizeStripeObject({
          chargeMetadata: context.chargeMetadata,
          evidenceDetails: dispute.evidence_details || null,
          networkReasonCode: dispute.network_reason_code || null,
          warningNeedsResponse: dispute.is_charge_refundable ?? null,
          balanceTransactions: (dispute.balance_transactions || []).map((item) => item.id),
        }) ?? Prisma.JsonNull,
    },
    update: {
      userId: scopedUserId,
      orderId: context.orderId,
      status: dispute.status,
      reason: dispute.reason || null,
      amount: fromStripeAmount(dispute.amount, dispute.currency),
      currency: dispute.currency.toUpperCase(),
      externalPaymentIntentId: context.paymentIntentId,
      externalChargeId: context.chargeId,
      dueBy:
        typeof dispute.evidence_details?.due_by === "number"
          ? new Date(dispute.evidence_details.due_by * 1000)
          : null,
      closedAt,
      metadata:
        sanitizeStripeObject({
          chargeMetadata: context.chargeMetadata,
          evidenceDetails: dispute.evidence_details || null,
          networkReasonCode: dispute.network_reason_code || null,
          warningNeedsResponse: dispute.is_charge_refundable ?? null,
          balanceTransactions: (dispute.balance_transactions || []).map((item) => item.id),
          updatedAt: toIsoDateOrNull(dispute.evidence_details?.due_by),
        }) ?? Prisma.JsonNull,
    },
  });

  return {
    synced: true,
    matchedOrder,
    unmatched,
  };
}

export async function handleStripeDisputeUpdated(dispute: Stripe.Dispute) {
  return upsertStripeDispute(dispute);
}

export async function syncStripeDisputesForUser(
  userId: string,
  input?: {
    start?: string | null;
    end?: string | null;
  }
): Promise<StripeDisputeSyncResult> {
  const stripe = getStripeClient();
  const end =
    input?.end != null
      ? new Date(`${input.end}T23:59:59.999Z`)
      : new Date();
  const start =
    input?.start != null
      ? new Date(`${input.start}T00:00:00.000Z`)
      : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid dispute sync date window");
  }

  if (start.getTime() > end.getTime()) {
    throw new Error("start date cannot be after end date");
  }

  let syncedDisputes = 0;
  let matchedDisputeOrders = 0;
  let unmatchedDisputes = 0;

  for await (const dispute of stripe.disputes.list({
    created: {
      gte: Math.floor(start.getTime() / 1000),
      lte: Math.floor(end.getTime() / 1000),
    },
    limit: 100,
  })) {
    const result = await upsertStripeDispute(dispute, {
      userId,
      enforceUserScope: true,
    });

    if (!result.synced) {
      continue;
    }

    syncedDisputes += 1;
    matchedDisputeOrders += result.matchedOrder ? 1 : 0;
    unmatchedDisputes += result.unmatched ? 1 : 0;
  }

  return {
    syncedDisputes,
    matchedDisputeOrders,
    unmatchedDisputes,
  };
}

// ---------------------------------------------------------------------------
// Dispute 证据提交引导
// ---------------------------------------------------------------------------

/** 根据 dispute reason 返回证据提交建议 */
const EVIDENCE_GUIDANCE: Record<string, {
  summary: string;
  recommendedEvidence: string[];
}> = {
  fraudulent: {
    summary: "买方声称未授权此交易",
    recommendedEvidence: [
      "客户签名或身份验证记录",
      "交易时的 IP 地址和设备信息",
      "历史交易记录（证明买方此前有正常交易）",
      "发货追踪号和签收证明",
    ],
  },
  product_not_received: {
    summary: "买方声称未收到商品",
    recommendedEvidence: [
      "物流追踪号和签收证明",
      "发货确认邮件/通知",
      "物流公司的投递确认",
      "与买方的沟通记录",
    ],
  },
  product_unacceptable: {
    summary: "买方声称商品与描述不符或有质量问题",
    recommendedEvidence: [
      "商品页面截图和原始描述",
      "发货前的商品照片",
      "退换货政策说明",
      "与买方的沟通记录",
    ],
  },
  duplicate: {
    summary: "买方声称被重复收费",
    recommendedEvidence: [
      "每次收费对应的独立订单/发货记录",
      "不同交易的商品或服务差异说明",
      "已退款的证明（如已处理退款）",
    ],
  },
  subscription_canceled: {
    summary: "买方声称已取消订阅但仍被收费",
    recommendedEvidence: [
      "订阅条款和取消政策",
      "买方的取消请求记录（或无取消记录的证明）",
      "取消前的服务使用记录",
    ],
  },
  general: {
    summary: "一般性争议",
    recommendedEvidence: [
      "交易确认记录",
      "商品/服务的交付证明",
      "与买方的沟通记录",
      "退换货政策说明",
    ],
  },
};

export interface DisputeEvidenceGuidance {
  disputeId: string;
  status: string;
  reason: string | null;
  amount: string;
  currency: string;
  dueBy: string | null;
  isOpen: boolean;
  isExpired: boolean;
  guidance: {
    summary: string;
    recommendedEvidence: string[];
    submissionMethod: string;
    urgency: "high" | "medium" | "low" | "closed";
  };
}

export async function getDisputeEvidenceGuidance(
  disputeId: string,
  userId: string
): Promise<DisputeEvidenceGuidance | null> {
  const dispute = await prisma.orderDispute.findUnique({
    where: { externalDisputeId: disputeId },
    select: {
      externalDisputeId: true,
      userId: true,
      status: true,
      reason: true,
      amount: true,
      currency: true,
      dueBy: true,
    },
  });

  if (!dispute || dispute.userId !== userId) {
    return null;
  }

  const isOpen = isOpenOrderDisputeStatus(dispute.status);
  const now = new Date();
  const dueBy = dispute.dueBy;
  const isExpired = dueBy != null && dueBy < now;

  const reasonKey = dispute.reason || "general";
  const guide = EVIDENCE_GUIDANCE[reasonKey] || EVIDENCE_GUIDANCE.general;

  let urgency: DisputeEvidenceGuidance["guidance"]["urgency"];
  if (!isOpen) {
    urgency = "closed";
  } else if (isExpired) {
    urgency = "closed";
  } else if (dueBy != null) {
    const hoursLeft = (dueBy.getTime() - now.getTime()) / (1000 * 60 * 60);
    urgency = hoursLeft < 72 ? "high" : hoursLeft < 168 ? "medium" : "low";
  } else {
    urgency = "medium";
  }

  return {
    disputeId: dispute.externalDisputeId,
    status: dispute.status,
    reason: dispute.reason,
    amount: dispute.amount.toString(),
    currency: dispute.currency,
    dueBy: dueBy?.toISOString() ?? null,
    isOpen,
    isExpired,
    guidance: {
      ...guide,
      submissionMethod:
        "请通过 Stripe Express Dashboard 提交证据。前往「设置 → 支付」页面点击「打开 Stripe 面板」。",
      urgency,
    },
  };
}
