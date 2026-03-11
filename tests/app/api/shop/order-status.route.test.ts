import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  findUniqueMock,
  updateMock,
  sendOrderStatusChangedNotificationsMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  sendOrderStatusChangedNotificationsMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock("@/domain/shop", async () => {
  const actual = await vi.importActual<typeof import("@/domain/shop")>("@/domain/shop");
  return {
    ...actual,
    sendOrderStatusChangedNotifications: sendOrderStatusChangedNotificationsMock,
  };
});

import { PUT } from "@/app/api/shop/orders/[id]/route";

const updatedOrderRecord = {
  id: "order-1",
  userId: "seller-1",
  buyerEmail: "buyer@example.com",
  buyerName: "Alice",
  totalAmount: new Prisma.Decimal("88.00"),
  currency: "JPY",
  status: "SHIPPED",
  paymentProvider: "STRIPE",
  paymentStatus: "PAID",
  paymentSessionId: "cs_test_123",
  paymentIntentId: "pi_test_123",
  paymentExpiresAt: new Date("2026-03-08T02:00:00.000Z"),
  paymentFailedAt: null,
  paymentFailureReason: null,
  shippingAddress: null,
  shippingMethod: "standard",
  createdAt: new Date("2026-03-08T00:00:00.000Z"),
  updatedAt: new Date("2026-03-08T00:00:00.000Z"),
  paidAt: new Date("2026-03-08T00:30:00.000Z"),
  shippedAt: new Date("2026-03-08T01:00:00.000Z"),
  deliveredAt: null,
  items: [],
};

describe("PUT /api/shop/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("sends a status notification when the order status changes", async () => {
    findUniqueMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      status: "PAID",
      paymentProvider: "STRIPE",
      paymentStatus: "PAID",
      paidAt: new Date("2026-03-08T00:30:00.000Z"),
      shippedAt: null,
      deliveredAt: null,
    });
    updateMock.mockResolvedValue(updatedOrderRecord);
    sendOrderStatusChangedNotificationsMock.mockResolvedValue(undefined);

    const response = await PUT(
      new Request("http://localhost/api/shop/orders/order-1", {
        method: "PUT",
        body: JSON.stringify({ status: "SHIPPED" }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(200);
    expect(sendOrderStatusChangedNotificationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "order-1",
        status: "SHIPPED",
      }),
      "PAID"
    );
  });

  it("does not fail status update when notification delivery fails", async () => {
    findUniqueMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      status: "PAID",
      paymentProvider: "STRIPE",
      paymentStatus: "PAID",
      paidAt: new Date("2026-03-08T00:30:00.000Z"),
      shippedAt: null,
      deliveredAt: null,
    });
    updateMock.mockResolvedValue(updatedOrderRecord);
    sendOrderStatusChangedNotificationsMock.mockRejectedValue(new Error("mail down"));

    const response = await PUT(
      new Request("http://localhost/api/shop/orders/order-1", {
        method: "PUT",
        body: JSON.stringify({ status: "SHIPPED" }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      order: {
        id: "order-1",
        status: "SHIPPED",
      },
    });
  });

  it("rejects manually marking Stripe awaiting-payment orders as paid", async () => {
    findUniqueMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      status: "AWAITING_PAYMENT",
      paymentProvider: "STRIPE",
      paymentStatus: "OPEN",
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
    });

    const response = await PUT(
      new Request("http://localhost/api/shop/orders/order-1", {
        method: "PUT",
        body: JSON.stringify({ status: "PAID" }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe orders must be marked as paid by webhook events",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects fulfillment status changes for fully refunded orders", async () => {
    findUniqueMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      status: "PAID",
      paymentProvider: "STRIPE",
      paymentStatus: "REFUNDED",
      paidAt: new Date("2026-03-08T00:30:00.000Z"),
      shippedAt: null,
      deliveredAt: null,
    });

    const response = await PUT(
      new Request("http://localhost/api/shop/orders/order-1", {
        method: "PUT",
        body: JSON.stringify({ status: "SHIPPED" }),
      }),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Fully refunded orders cannot change fulfillment status manually",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
