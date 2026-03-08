import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, findManyMock, countMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import { GET } from "@/app/api/shop/orders/route";

const orderRecord = {
  id: "order-1",
  userId: "seller-1",
  buyerEmail: "buyer@example.com",
  buyerName: "Alice",
  totalAmount: new Prisma.Decimal("120.00"),
  status: "PAID",
  shippingAddress: { city: "Tokyo" },
  shippingMethod: "Express",
  createdAt: new Date("2026-03-08T00:00:00.000Z"),
  updatedAt: new Date("2026-03-08T00:00:00.000Z"),
  paidAt: new Date("2026-03-08T01:00:00.000Z"),
  shippedAt: null,
  deliveredAt: null,
  items: [
    {
      id: "item-1",
      orderId: "order-1",
      productId: "product-1",
      price: new Prisma.Decimal("120.00"),
      quantity: 1,
      subtotal: new Prisma.Decimal("120.00"),
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      product: {
        id: "product-1",
        name: "Album",
        images: ["cover.jpg"],
      },
    },
  ],
};

describe("GET /api/shop/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("applies seller status and query filters to the orders query", async () => {
    findManyMock.mockResolvedValue([orderRecord]);
    countMock.mockResolvedValue(1);

    const response = await GET(
      new Request(
        "http://localhost/api/shop/orders?page=1&limit=50&status=PAID&query=alice"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 50,
        where: expect.objectContaining({
          userId: "seller-1",
          status: "PAID",
          OR: expect.arrayContaining([
            {
              buyerEmail: {
                contains: "alice",
                mode: "insensitive",
              },
            },
            {
              buyerName: {
                contains: "alice",
                mode: "insensitive",
              },
            },
          ]),
        }),
      })
    );
    expect(countMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "seller-1",
          status: "PAID",
        }),
      })
    );
    expect(payload.orders).toHaveLength(1);
  });

  it("returns CSV export for the current seller filters", async () => {
    findManyMock.mockResolvedValue([orderRecord]);

    const response = await GET(
      new Request(
        "http://localhost/api/shop/orders?status=PAID&query=buyer&export=csv"
      )
    );
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("orders-");
    expect(body).toContain("orderId,buyerEmail,buyerName,status,totalAmount");
    expect(body).toContain("order-1");
    expect(body).toContain("buyer@example.com");
    expect(body).toContain("Album x 1");
    expect(countMock).not.toHaveBeenCalled();
  });
});
