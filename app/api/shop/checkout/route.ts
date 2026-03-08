import { NextResponse } from "next/server";
import {
  createPublicOrder,
  sendOrderCreatedNotifications,
  type PublicOrderCreateInput,
} from "@/domain/shop";

export const runtime = "nodejs";

// POST: 公开结账创建订单（访客可用）
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

  try {
    const order = await createPublicOrder({
      buyerEmail,
      buyerName: buyerName || null,
      shippingAddress: shippingAddress || null,
      shippingMethod: shippingMethod || null,
      items,
    } satisfies PublicOrderCreateInput);

    try {
      await sendOrderCreatedNotifications(order);
    } catch (notificationError) {
      console.error("Failed to send order creation notifications:", notificationError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Failed to create checkout order:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create checkout order";
    const status =
      message.includes("unavailable") || message.includes("not found")
        ? 404
        : message.includes("stock") ||
            message.includes("quantity") ||
            message.includes("seller") ||
            message.includes("buyerEmail")
          ? 400
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
