import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  handleStripeDisputeUpdated,
  handleStripeCheckoutExpired,
  handleStripeCheckoutFailed,
  handleStripeCheckoutPaid,
} from "@/domain/shop";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

function isCheckoutSession(
  object: Stripe.Event.Data.Object
): object is Stripe.Checkout.Session {
  return (
    typeof object === "object" &&
    object !== null &&
    "object" in object &&
    object.object === "checkout.session"
  );
}

function isDisputeObject(
  object: Stripe.Event.Data.Object
): object is Stripe.Dispute {
  return (
    typeof object === "object" &&
    object !== null &&
    "object" in object &&
    object.object === "dispute"
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const payload = await request.text();

  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );

    switch (event.type) {
      case "checkout.session.completed":
        if (
          isCheckoutSession(event.data.object) &&
          event.data.object.payment_status === "paid"
        ) {
          await handleStripeCheckoutPaid(event.data.object);
        }
        break;
      case "checkout.session.async_payment_succeeded":
        if (isCheckoutSession(event.data.object)) {
          await handleStripeCheckoutPaid(event.data.object);
        }
        break;
      case "checkout.session.async_payment_failed":
        if (isCheckoutSession(event.data.object)) {
          await handleStripeCheckoutFailed(event.data.object);
        }
        break;
      case "checkout.session.expired":
        if (isCheckoutSession(event.data.object)) {
          await handleStripeCheckoutExpired(event.data.object);
        }
        break;
      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed":
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.funds_reinstated":
        if (isDisputeObject(event.data.object)) {
          await handleStripeDisputeUpdated(event.data.object);
        }
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Stripe webhook:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process Stripe webhook",
      },
      { status: 400 }
    );
  }
}
