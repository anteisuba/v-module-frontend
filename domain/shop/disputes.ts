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
