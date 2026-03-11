import { NextResponse } from "next/server";
import { confirmStripeCheckoutSessionForOrder } from "@/domain/shop";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { buyerEmail?: string; sessionId?: string } | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const buyerEmail = body?.buyerEmail?.trim() || "";
  const sessionId = body?.sessionId?.trim() || "";

  if (!buyerEmail || !sessionId) {
    return NextResponse.json(
      { error: "buyerEmail and sessionId are required" },
      { status: 400 }
    );
  }

  try {
    const order = await confirmStripeCheckoutSessionForOrder({
      orderId: id,
      buyerEmail,
      sessionId,
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm Stripe checkout session";

    const status =
      message === "Order not found"
        ? 404
        : message.includes("required") ||
            message.includes("mismatch") ||
            message.includes("does not belong")
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
