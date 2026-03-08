import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, findUniqueMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: findUniqueMock,
    },
  },
}));

import { GET } from "@/app/api/shop/orders/[id]/route";

const baseOrderRecord = {
  id: "order-1",
  userId: "seller-1",
  buyerEmail: "buyer@example.com",
  buyerName: "Alice",
  totalAmount: new Prisma.Decimal("88.00"),
  currency: "JPY",
  status: "PENDING",
  paymentProvider: null,
  paymentStatus: null,
  paymentSessionId: null,
  paymentIntentId: null,
  paymentExpiresAt: null,
  paymentFailedAt: null,
  paymentFailureReason: null,
  shippingAddress: { city: "Tokyo" },
  shippingMethod: "standard",
  createdAt: new Date("2026-03-08T00:00:00.000Z"),
  updatedAt: new Date("2026-03-08T00:00:00.000Z"),
  paidAt: null,
  shippedAt: null,
  deliveredAt: null,
  items: [
    {
      id: "item-1",
      orderId: "order-1",
      productId: "product-1",
      price: new Prisma.Decimal("88.00"),
      quantity: 1,
      subtotal: new Prisma.Decimal("88.00"),
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      product: {
        id: "product-1",
        name: "Album",
        images: ["cover.jpg"],
      },
    },
  ],
};

describe("GET /api/shop/orders/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the order for public lookup when buyer email matches", async () => {
    findUniqueMock.mockResolvedValue(baseOrderRecord);

    const response = await GET(
      new Request(
        "http://localhost/api/shop/orders/order-1?buyerEmail=buyer%40example.com"
      ),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.order).toMatchObject({
      id: "order-1",
      buyerEmail: "buyer@example.com",
      totalAmount: 88,
      items: [
        {
          productId: "product-1",
          subtotal: 88,
        },
      ],
    });
    expect(getServerSessionMock).not.toHaveBeenCalled();
  });

  it("returns 401 when seller auth is missing and no buyer email is provided", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/shop/orders/order-1"),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the public buyer email does not match", async () => {
    findUniqueMock.mockResolvedValue(baseOrderRecord);

    const response = await GET(
      new Request(
        "http://localhost/api/shop/orders/order-1?buyerEmail=wrong%40example.com"
      ),
      {
        params: Promise.resolve({ id: "order-1" }),
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Order not found" });
  });
});
