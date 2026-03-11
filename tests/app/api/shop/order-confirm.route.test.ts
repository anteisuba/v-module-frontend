import { beforeEach, describe, expect, it, vi } from "vitest";

const { confirmStripeCheckoutSessionForOrderMock } = vi.hoisted(() => ({
  confirmStripeCheckoutSessionForOrderMock: vi.fn(),
}));

vi.mock("@/domain/shop", () => ({
  confirmStripeCheckoutSessionForOrder: confirmStripeCheckoutSessionForOrderMock,
}));

import { POST } from "@/app/api/shop/orders/[id]/confirm/route";

describe("POST /api/shop/orders/[id]/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms a paid checkout session for public order access", async () => {
    confirmStripeCheckoutSessionForOrderMock.mockResolvedValue({
      id: "order-1",
      buyerEmail: "buyer@example.com",
      status: "PAID",
      paymentStatus: "PAID",
    });

    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/confirm", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          sessionId: "cs_test_paid",
        }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      order: {
        id: "order-1",
        buyerEmail: "buyer@example.com",
        status: "PAID",
        paymentStatus: "PAID",
      },
    });
    expect(confirmStripeCheckoutSessionForOrderMock).toHaveBeenCalledWith({
      orderId: "order-1",
      buyerEmail: "buyer@example.com",
      sessionId: "cs_test_paid",
    });
  });

  it("returns 400 when buyerEmail or sessionId is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/confirm", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
        }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "buyerEmail and sessionId are required",
    });
    expect(confirmStripeCheckoutSessionForOrderMock).not.toHaveBeenCalled();
  });

  it("maps missing orders to 404", async () => {
    confirmStripeCheckoutSessionForOrderMock.mockRejectedValue(
      new Error("Order not found")
    );

    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/confirm", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          sessionId: "cs_test_missing",
        }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Order not found",
    });
  });
});
