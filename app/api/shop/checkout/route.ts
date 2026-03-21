import { NextResponse } from "next/server";
import { createStripeCheckout } from "@/domain/shop";
import { isStripeConfigured } from "@/lib/stripe";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { checkoutInputSchema } from "@/domain/shop/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      throw new ApiRouteError("STRIPE_NOT_CONFIGURED", "Stripe Checkout is not configured", 503);
    }

    const { buyerEmail, buyerName, shippingAddress, shippingMethod, items } =
      await readJsonBody(request, checkoutInputSchema, {
        code: "INVALID_CHECKOUT_INPUT",
        message: "结账信息格式不正确",
      });

    let checkout;
    try {
      checkout = await createStripeCheckout({
        buyerEmail,
        buyerName: buyerName ?? null,
        shippingAddress: shippingAddress ?? null,
        shippingMethod: shippingMethod ?? null,
        items,
      });
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("not configured")) {
          throw new ApiRouteError("NOT_CONFIGURED", msg, 503);
        }
        if (msg.includes("unavailable") || msg.includes("not found")) {
          throw new ApiRouteError("NOT_FOUND", msg, 404);
        }
        if (
          msg.includes("stock") ||
          msg.includes("quantity") ||
          msg.includes("seller") ||
          msg.includes("buyerEmail") ||
          msg.includes("whole-number")
        ) {
          throw new ApiRouteError("INVALID_INPUT", msg, 400);
        }
      }
      throw err;
    }

    return NextResponse.json({ checkout });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "CHECKOUT_FAILED",
      message: "创建结账失败，请稍后重试",
      status: 500,
      logMessage: "Failed to create Stripe checkout",
    });
  }
}
