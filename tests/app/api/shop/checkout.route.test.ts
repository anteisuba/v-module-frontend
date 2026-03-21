import { beforeEach, describe, expect, it, vi } from "vitest";

const { createStripeCheckoutMock, isStripeConfiguredMock } = vi.hoisted(() => ({
  createStripeCheckoutMock: vi.fn(),
  isStripeConfiguredMock: vi.fn(),
}));

vi.mock("@/domain/shop", () => ({
  createStripeCheckout: createStripeCheckoutMock,
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: isStripeConfiguredMock,
}));

import { POST } from "@/app/api/shop/checkout/route";

describe("POST /api/shop/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    isStripeConfiguredMock.mockReturnValue(true);
  });

  it("creates a Stripe checkout session for the public order", async () => {
    createStripeCheckoutMock.mockResolvedValue({
      orderId: "order-1",
      provider: "STRIPE",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
      expiresAt: "2026-03-08T01:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost/api/shop/checkout", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          items: [{ productId: "product-1", quantity: 1 }],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createStripeCheckoutMock).toHaveBeenCalledWith({
      buyerEmail: "buyer@example.com",
      buyerName: null,
      shippingAddress: null,
      shippingMethod: null,
      items: [{ productId: "product-1", quantity: 1 }],
    });
    expect(payload).toEqual({
      checkout: {
        orderId: "order-1",
        provider: "STRIPE",
        checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
        expiresAt: "2026-03-08T01:00:00.000Z",
      },
    });
  });

  it("returns 503 when Stripe Checkout is not configured", async () => {
    isStripeConfiguredMock.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/shop/checkout", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          items: [{ productId: "product-1", quantity: 1 }],
        }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe Checkout is not configured",
      code: "STRIPE_NOT_CONFIGURED",
    });
    expect(createStripeCheckoutMock).not.toHaveBeenCalled();
  });
});
