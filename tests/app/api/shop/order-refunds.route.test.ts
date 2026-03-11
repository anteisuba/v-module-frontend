import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, createOrderRefundMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  createOrderRefundMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop", () => ({
  createOrderRefund: createOrderRefundMock,
}));

import { POST } from "@/app/api/shop/orders/[id]/refunds/route";

describe("POST /api/shop/orders/[id]/refunds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the seller session is missing", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/refunds", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createOrderRefundMock).not.toHaveBeenCalled();
  });

  it("returns the updated order and refund when refund creation succeeds", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
    createOrderRefundMock.mockResolvedValue({
      order: {
        id: "order-1",
        refundableAmount: 0,
      },
      refund: {
        id: "refund-1",
        status: "SUCCEEDED",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/refunds", {
        method: "POST",
        body: JSON.stringify({
          amount: 1200,
          reason: "customer requested cancellation",
        }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createOrderRefundMock).toHaveBeenCalledWith({
      orderId: "order-1",
      requestedByUserId: "seller-1",
      amount: 1200,
      reason: "customer requested cancellation",
    });
    expect(payload).toMatchObject({
      order: {
        id: "order-1",
      },
      refund: {
        id: "refund-1",
        status: "SUCCEEDED",
      },
    });
  });

  it("maps refundable balance errors to 400", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
    createOrderRefundMock.mockRejectedValue(
      new Error("Refund amount exceeds refundable balance")
    );

    const response = await POST(
      new Request("http://localhost/api/shop/orders/order-1/refunds", {
        method: "POST",
        body: JSON.stringify({
          amount: 9999,
        }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Refund amount exceeds refundable balance",
    });
  });
});
