import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
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
  attachStripePaymentSessionToOrder,
  cancelOpenOrderPayment,
  cancelOpenOrderPaymentBySession,
  createPublicOrder,
  markOrderPaidByPaymentSession,
  type CheckoutSessionResult,
  type PublicOrderCreateInput,
  type SerializedOrder,
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
