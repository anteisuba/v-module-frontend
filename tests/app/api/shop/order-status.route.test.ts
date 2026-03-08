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
  status: "SHIPPED",
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
});
