import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { syncStripePayoutAccountByConnectedAccountId } from "@/domain/shop";
import {
  getStripeClient,
  getStripeConnectWebhookSecret,
} from "@/lib/stripe";

export const runtime = "nodejs";

function isAccountObject(
  object: Stripe.Event.Data.Object
): object is Stripe.Account | Stripe.DeletedAccount {
  return (
    typeof object === "object" &&
    object !== null &&
    "object" in object &&
    object.object === "account"
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
      getStripeConnectWebhookSecret()
    );

    switch (event.type) {
      case "account.updated":
        if (isAccountObject(event.data.object)) {
          await syncStripePayoutAccountByConnectedAccountId(
            event.data.object.id,
            event.data.object
          );
        }
        break;
      case "account.external_account.created":
      case "account.external_account.updated":
      case "account.external_account.deleted":
        if (event.account) {
          await syncStripePayoutAccountByConnectedAccountId(event.account);
        }
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Stripe Connect webhook:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Stripe Connect webhook",
      },
      { status: 400 }
    );
  }
}
