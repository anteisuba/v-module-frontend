import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStripeClient,
  getStripeCurrency,
  getStripeId,
  toStripeAmount,
} from "@/lib/stripe";
import {
  ORDER_PAYMENT_PROVIDER_STRIPE,
  ORDER_PAYMENT_STATUS_EXPIRED,
  ORDER_PAYMENT_STATUS_FAILED,
  ORDER_PAYMENT_STATUS_OPEN,
  ORDER_PAYMENT_STATUS_PAID,
  ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED,
  ORDER_PAYMENT_STATUS_REFUNDED,
  ORDER_REFUND_STATUS_CANCELED,
  ORDER_REFUND_STATUS_FAILED,
  ORDER_REFUND_STATUS_PENDING,
  ORDER_REFUND_STATUS_SUCCEEDED,
  ORDER_WITH_ITEMS_QUERY,
  attachStripePaymentSessionToOrder,
  cancelOpenOrderPayment,
  cancelOpenOrderPaymentBySession,
  createPublicOrder,
  getOrderWithItemsById,
  markOrderPaidByPaymentSession,
  serializeOrderWithItems,
  syncOrderPaymentStatusFromRefunds,
  type CheckoutSessionResult,
  type PublicOrderCreateInput,
  type SerializedOrder,
  type SerializedOrderRefund,
} from "./services";
import { sendOrderCreatedNotifications } from "./notifications";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

function getSessionIsoExpiry(session: Stripe.Checkout.Session) {
  return session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : null;
}

function getSessionDateExpiry(session: Stripe.Checkout.Session) {
  return session.expires_at ? new Date(session.expires_at * 1000) : null;
}

async function getSellerSlug(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { slug: true },
  });

  return user?.slug || null;
}

function buildSuccessUrl(slug: string | null, orderId: string) {
  const baseUrl = getBaseUrl();

  if (!slug) {
    return `${baseUrl}/?orderId=${encodeURIComponent(orderId)}`;
  }

  return `${baseUrl}/u/${slug}/shop/order-success/${orderId}?session_id={CHECKOUT_SESSION_ID}`;
}

function buildCancelUrl(slug: string | null, productId: string | null) {
  const baseUrl = getBaseUrl();

  if (slug && productId) {
    return `${baseUrl}/u/${slug}/shop/${productId}`;
  }

  if (slug) {
    return `${baseUrl}/u/${slug}/shop`;
  }

  return baseUrl;
}

export async function createStripeCheckout(
  input: PublicOrderCreateInput
): Promise<CheckoutSessionResult> {
  const reservedOrder = await createPublicOrder(input);

  try {
    const stripe = getStripeClient();
    const currency = getStripeCurrency();
    const sellerSlug = await getSellerSlug(reservedOrder.userId);
    const firstProductId = reservedOrder.items[0]?.productId || null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "auto",
      customer_email: reservedOrder.buyerEmail,
      client_reference_id: reservedOrder.id,
      success_url: buildSuccessUrl(sellerSlug, reservedOrder.id),
      cancel_url: buildCancelUrl(sellerSlug, firstProductId),
      metadata: {
        orderId: reservedOrder.id,
        sellerId: reservedOrder.userId,
        buyerEmail: reservedOrder.buyerEmail,
        provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      },
      payment_intent_data: {
        metadata: {
          orderId: reservedOrder.id,
          sellerId: reservedOrder.userId,
          buyerEmail: reservedOrder.buyerEmail,
          provider: ORDER_PAYMENT_PROVIDER_STRIPE,
        },
      },
      line_items: reservedOrder.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: toStripeAmount(item.price, currency),
          product_data: {
            name: item.product?.name || item.productId,
          },
        },
      })),
    });

    if (!session.url) {
      throw new Error("Stripe Checkout Session did not return a redirect URL");
    }

    await attachStripePaymentSessionToOrder(reservedOrder.id, {
      sessionId: session.id,
      paymentIntentId: getStripeId(session.payment_intent),
      expiresAt: getSessionDateExpiry(session),
    });

    return {
      orderId: reservedOrder.id,
      provider: ORDER_PAYMENT_PROVIDER_STRIPE,
      checkoutUrl: session.url,
      expiresAt: getSessionIsoExpiry(session),
    };
  } catch (error) {
    try {
      await cancelOpenOrderPayment(reservedOrder.id, {
        paymentStatus: ORDER_PAYMENT_STATUS_FAILED,
        reason: "Failed to create Stripe Checkout Session",
      });
    } catch (rollbackError) {
      console.error("Failed to roll back reserved order after Stripe error:", rollbackError);
    }

    throw error;
  }
}

export async function handleStripeCheckoutPaid(
  session: Stripe.Checkout.Session
) {
  const result = await markOrderPaidByPaymentSession(
    session.id,
    getStripeId(session.payment_intent)
  );

  if (!result || !result.changed) {
    return result;
  }

  try {
    await sendOrderCreatedNotifications(result.order);
  } catch (notificationError) {
    console.error("Failed to send paid order notifications:", notificationError);
  }

  return result;
}

export async function confirmStripeCheckoutSessionForOrder(input: {
  orderId: string;
  buyerEmail: string;
  sessionId: string;
}): Promise<SerializedOrder> {
  const normalizedBuyerEmail = input.buyerEmail.trim().toLowerCase();
  const normalizedSessionId = input.sessionId.trim();

  if (!input.orderId.trim() || !normalizedBuyerEmail || !normalizedSessionId) {
    throw new Error("orderId, buyerEmail, and sessionId are required");
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: input.orderId },
    ...ORDER_WITH_ITEMS_QUERY,
  });

  if (
    !existingOrder ||
    existingOrder.buyerEmail.trim().toLowerCase() !== normalizedBuyerEmail
  ) {
    throw new Error("Order not found");
  }

  const serializedExistingOrder = serializeOrderWithItems(existingOrder);

  if (
    serializedExistingOrder.paymentProvider !== ORDER_PAYMENT_PROVIDER_STRIPE ||
    serializedExistingOrder.paymentStatus !== ORDER_PAYMENT_STATUS_OPEN
  ) {
    return serializedExistingOrder;
  }

  if (
    serializedExistingOrder.paymentSessionId &&
    serializedExistingOrder.paymentSessionId !== normalizedSessionId
  ) {
    throw new Error("Payment session mismatch");
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(normalizedSessionId, {
    expand: ["payment_intent"],
  });

  const sessionOrderId =
    session.client_reference_id || session.metadata?.orderId || null;

  if (sessionOrderId !== input.orderId) {
    throw new Error("Checkout session does not belong to this order");
  }

  if (session.payment_status === "paid") {
    const result = await handleStripeCheckoutPaid(session);

    if (result?.order) {
      return result.order;
    }

    const paidOrder = await getOrderWithItemsById(input.orderId);

    if (paidOrder) {
      return paidOrder;
    }
  }

  if (session.status === "expired") {
    await handleStripeCheckoutExpired(session);

    const cancelledOrder = await getOrderWithItemsById(input.orderId);

    if (cancelledOrder) {
      return cancelledOrder;
    }
  }

  return serializedExistingOrder;
}

export async function handleStripeCheckoutFailed(
  session: Stripe.Checkout.Session,
  reason = "Stripe Checkout payment failed"
) {
  return cancelOpenOrderPaymentBySession(session.id, {
    paymentStatus: ORDER_PAYMENT_STATUS_FAILED,
    reason,
  });
}

export async function handleStripeCheckoutExpired(
  session: Stripe.Checkout.Session
) {
  return cancelOpenOrderPaymentBySession(session.id, {
    paymentStatus: ORDER_PAYMENT_STATUS_EXPIRED,
    reason: "Stripe Checkout Session expired",
  });
}

export function isAwaitingStripePayment(order: SerializedOrder | null) {
  return (
    !!order &&
    order.paymentProvider === ORDER_PAYMENT_PROVIDER_STRIPE &&
    order.status === "AWAITING_PAYMENT" &&
    order.paymentStatus === "OPEN"
  );
}

export interface OrderRefundResult {
  order: SerializedOrder;
  refund: SerializedOrderRefund;
}

interface ProviderRefundResult {
  externalRefundId: string | null;
  externalPaymentIntentId: string | null;
  status: string;
  failureReason: string | null;
  refundedAt: Date | null;
  metadata: Prisma.InputJsonValue | null;
}

interface ProviderRefundHandlerInput {
  orderId: string;
  refundId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  reason: string | null;
}

function mapStripeRefundStatus(
  status: string | null
): string {
  switch (status) {
    case "succeeded":
      return ORDER_REFUND_STATUS_SUCCEEDED;
    case "failed":
      return ORDER_REFUND_STATUS_FAILED;
    case "canceled":
      return ORDER_REFUND_STATUS_CANCELED;
    default:
      return ORDER_REFUND_STATUS_PENDING;
  }
}

async function createStripeRefund(
  input: ProviderRefundHandlerInput
): Promise<ProviderRefundResult> {
  const stripe = getStripeClient();
  const refund = await stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    amount: toStripeAmount(input.amount, input.currency),
    reason: "requested_by_customer",
    metadata: {
      orderId: input.orderId,
      refundId: input.refundId,
      operatorReason: input.reason || "",
    },
  });

  return {
    externalRefundId: refund.id,
    externalPaymentIntentId:
      typeof refund.payment_intent === "string"
        ? refund.payment_intent
        : refund.payment_intent?.id || input.paymentIntentId,
    status: mapStripeRefundStatus(refund.status),
    failureReason: refund.failure_reason || null,
    refundedAt:
      refund.status === "succeeded" ? new Date(refund.created * 1000) : null,
    metadata: {
      source: "stripe",
      chargeId:
        typeof refund.charge === "string" ? refund.charge : refund.charge?.id || null,
      rawStatus: refund.status,
      pendingReason: refund.pending_reason || null,
    },
  };
}

const refundHandlers: Record<
  string,
  (input: ProviderRefundHandlerInput) => Promise<ProviderRefundResult>
> = {
  [ORDER_PAYMENT_PROVIDER_STRIPE]: createStripeRefund,
};

export async function createOrderRefund(input: {
  orderId: string;
  requestedByUserId: string;
  amount?: number | null;
  reason?: string | null;
}): Promise<OrderRefundResult> {
  const prepared = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      ...ORDER_WITH_ITEMS_QUERY,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.userId !== input.requestedByUserId) {
      throw new Error("Forbidden");
    }

    if (!order.paymentProvider || !refundHandlers[order.paymentProvider]) {
      throw new Error("Refunds are not supported for this payment provider yet");
    }

    if (!order.paymentIntentId) {
      throw new Error("This order does not have a refundable payment intent");
    }

    if (
      order.paymentStatus !== ORDER_PAYMENT_STATUS_PAID &&
      order.paymentStatus !== ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED &&
      order.paymentStatus !== ORDER_PAYMENT_STATUS_REFUNDED
    ) {
      throw new Error("Only paid orders can be refunded");
    }

    const serializedOrder = serializeOrderWithItems(order);
    const normalizedAmount = Number(
      input.amount == null ? serializedOrder.refundableAmount : input.amount
    );

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error("Refund amount must be greater than 0");
    }

    if (normalizedAmount > serializedOrder.refundableAmount + 0.000001) {
      throw new Error("Refund amount exceeds refundable balance");
    }

    const normalizedReason = input.reason?.trim() || null;

    const refund = await tx.orderRefund.create({
      data: {
        orderId: order.id,
        provider: order.paymentProvider,
        status: ORDER_REFUND_STATUS_PENDING,
        amount: normalizedAmount,
        currency: order.currency,
        reason: normalizedReason,
        externalPaymentIntentId: order.paymentIntentId,
        requestedByUserId: input.requestedByUserId,
        metadata: {
          source: "admin-manual-refund",
        },
      },
    });

    return {
      orderId: order.id,
      refundId: refund.id,
      paymentProvider: order.paymentProvider,
      paymentIntentId: order.paymentIntentId,
      amount: normalizedAmount,
      currency: order.currency,
      reason: normalizedReason,
    };
  });

  const handler = refundHandlers[prepared.paymentProvider];

  try {
    const providerResult = await handler({
      orderId: prepared.orderId,
      refundId: prepared.refundId,
      paymentIntentId: prepared.paymentIntentId,
      amount: prepared.amount,
      currency: prepared.currency,
      reason: prepared.reason,
    });

    return prisma.$transaction(async (tx) => {
      const refund = await tx.orderRefund.update({
        where: { id: prepared.refundId },
        data: {
          status: providerResult.status,
          externalRefundId: providerResult.externalRefundId,
          externalPaymentIntentId: providerResult.externalPaymentIntentId,
          failureReason: providerResult.failureReason,
          refundedAt: providerResult.refundedAt,
          metadata:
            providerResult.metadata == null
              ? Prisma.JsonNull
              : providerResult.metadata,
        },
      });

      await syncOrderPaymentStatusFromRefunds(tx, prepared.orderId);

      const updatedOrder = await tx.order.findUnique({
        where: { id: prepared.orderId },
        ...ORDER_WITH_ITEMS_QUERY,
      });

      if (!updatedOrder) {
        throw new Error("Failed to load order after refund");
      }

      return {
        order: serializeOrderWithItems(updatedOrder),
        refund: {
          id: refund.id,
          orderId: refund.orderId,
          provider: refund.provider,
          status: refund.status,
          amount: Number(refund.amount),
          currency: refund.currency,
          reason: refund.reason,
          failureReason: refund.failureReason,
          externalRefundId: refund.externalRefundId,
          externalPaymentIntentId: refund.externalPaymentIntentId,
          requestedByUserId: refund.requestedByUserId,
          metadata: refund.metadata ?? null,
          createdAt: refund.createdAt.toISOString(),
          updatedAt: refund.updatedAt.toISOString(),
          refundedAt: refund.refundedAt?.toISOString() || null,
        },
      };
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create refund";

    await prisma.orderRefund.update({
      where: { id: prepared.refundId },
      data: {
        status: ORDER_REFUND_STATUS_FAILED,
        failureReason: message,
      },
    });

    throw error;
  }
}
