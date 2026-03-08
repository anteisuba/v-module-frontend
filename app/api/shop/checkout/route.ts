import { NextResponse } from "next/server";
import {
  createStripeCheckout,
  type PublicOrderCreateInput,
} from "@/domain/shop";
import { isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { buyerEmail, buyerName, shippingAddress, shippingMethod, items } = body ?? {};

  if (!buyerEmail || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "buyerEmail and items (array) are required" },
      { status: 400 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe Checkout is not configured" },
      { status: 503 }
    );
  }

  try {
    const checkout = await createStripeCheckout({
      buyerEmail,
      buyerName: buyerName || null,
      shippingAddress: shippingAddress || null,
      shippingMethod: shippingMethod || null,
      items,
    } satisfies PublicOrderCreateInput);

    return NextResponse.json({ checkout });
  } catch (error) {
    console.error("Failed to create Stripe checkout:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create Stripe checkout";
    const status =
      message.includes("not configured")
        ? 503
        : message.includes("unavailable") || message.includes("not found")
        ? 404
        : message.includes("stock") ||
            message.includes("quantity") ||
            message.includes("seller") ||
            message.includes("buyerEmail") ||
            message.includes("whole-number")
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
