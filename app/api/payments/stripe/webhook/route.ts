import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
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

    if (!isCheckoutSession(event.data.object)) {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;

    switch (event.type) {
      case "checkout.session.completed":
        if (session.payment_status === "paid") {
          await handleStripeCheckoutPaid(session);
        }
        break;
      case "checkout.session.async_payment_succeeded":
        await handleStripeCheckoutPaid(session);
        break;
      case "checkout.session.async_payment_failed":
        await handleStripeCheckoutFailed(session);
        break;
      case "checkout.session.expired":
        await handleStripeCheckoutExpired(session);
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
