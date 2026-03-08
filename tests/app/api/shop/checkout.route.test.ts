import { beforeEach, describe, expect, it, vi } from "vitest";

const { createPublicOrderMock, sendOrderCreatedNotificationsMock } = vi.hoisted(() => ({
  createPublicOrderMock: vi.fn(),
  sendOrderCreatedNotificationsMock: vi.fn(),
}));

vi.mock("@/domain/shop", () => ({
  createPublicOrder: createPublicOrderMock,
  sendOrderCreatedNotifications: sendOrderCreatedNotificationsMock,
}));

import { POST } from "@/app/api/shop/checkout/route";

describe("POST /api/shop/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates the order and sends notifications", async () => {
    createPublicOrderMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      buyerEmail: "buyer@example.com",
      buyerName: "Alice",
      totalAmount: 88,
      status: "PENDING",
      shippingAddress: null,
      shippingMethod: "standard",
      createdAt: "2026-03-08T00:00:00.000Z",
      updatedAt: "2026-03-08T00:00:00.000Z",
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      items: [],
    });
    sendOrderCreatedNotificationsMock.mockResolvedValue(undefined);

    const response = await POST(
      new Request("http://localhost/api/shop/checkout", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          items: [{ productId: "product-1", quantity: 1 }],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(createPublicOrderMock).toHaveBeenCalledWith({
      buyerEmail: "buyer@example.com",
      buyerName: null,
      shippingAddress: null,
      shippingMethod: null,
      items: [{ productId: "product-1", quantity: 1 }],
    });
    expect(sendOrderCreatedNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("does not fail checkout when notifications cannot be sent", async () => {
    createPublicOrderMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      buyerEmail: "buyer@example.com",
      buyerName: null,
      totalAmount: 88,
      status: "PENDING",
      shippingAddress: null,
      shippingMethod: null,
      createdAt: "2026-03-08T00:00:00.000Z",
      updatedAt: "2026-03-08T00:00:00.000Z",
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
      items: [],
    });
    sendOrderCreatedNotificationsMock.mockRejectedValue(new Error("mail down"));

    const response = await POST(
      new Request("http://localhost/api/shop/checkout", {
        method: "POST",
        body: JSON.stringify({
          buyerEmail: "buyer@example.com",
          items: [{ productId: "product-1", quantity: 1 }],
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      order: {
        id: "order-1",
      },
    });
  });
});
