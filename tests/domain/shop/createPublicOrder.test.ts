import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

import { createPublicOrder } from "@/domain/shop/services";

describe("createPublicOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates duplicate items and creates a serialized order", async () => {
    const tx = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "product-1",
            userId: "seller-1",
            name: "Album",
            stock: 10,
            price: new Prisma.Decimal("20.00"),
          },
        ]),
        update: vi.fn().mockResolvedValue(undefined),
      },
      order: {
        create: vi.fn().mockResolvedValue({ id: "order-1" }),
        findUnique: vi.fn().mockResolvedValue({
          id: "order-1",
          userId: "seller-1",
          buyerEmail: "buyer@example.com",
          buyerName: "Alice",
          totalAmount: new Prisma.Decimal("60.00"),
          status: "PENDING",
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
              price: new Prisma.Decimal("20.00"),
              quantity: 3,
              subtotal: new Prisma.Decimal("60.00"),
              createdAt: new Date("2026-03-08T00:00:00.000Z"),
              product: {
                id: "product-1",
                name: "Album",
                images: ["cover.jpg"],
              },
            },
          ],
        }),
      },
      orderItem: {
        create: vi.fn().mockResolvedValue(undefined),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    const order = await createPublicOrder({
      buyerEmail: " buyer@example.com ",
      buyerName: " Alice ",
      shippingAddress: { city: "Tokyo" },
      shippingMethod: " standard ",
      items: [
        { productId: "product-1", quantity: 1 },
        { productId: "product-1", quantity: 2 },
      ],
    });

    expect(tx.order.create).toHaveBeenCalledWith({
      data: {
        userId: "seller-1",
        buyerEmail: "buyer@example.com",
        buyerName: "Alice",
        totalAmount: 60,
        status: "PENDING",
        shippingAddress: { city: "Tokyo" },
        shippingMethod: "standard",
      },
    });
    expect(tx.orderItem.create).toHaveBeenCalledTimes(1);
    expect(tx.orderItem.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        productId: "product-1",
        price: 20,
        quantity: 3,
        subtotal: 60,
      },
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: {
        stock: {
          decrement: 3,
        },
      },
    });
    expect(order).toMatchObject({
      id: "order-1",
      buyerEmail: "buyer@example.com",
      buyerName: "Alice",
      totalAmount: 60,
      shippingMethod: "standard",
      items: [
        {
          productId: "product-1",
          quantity: 3,
          subtotal: 60,
          product: {
            name: "Album",
            images: ["cover.jpg"],
          },
        },
      ],
    });
  });

  it("rejects checkout when products belong to different sellers", async () => {
    const tx = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "product-1",
            userId: "seller-1",
            name: "Album",
            stock: 5,
            price: new Prisma.Decimal("20.00"),
          },
          {
            id: "product-2",
            userId: "seller-2",
            name: "Poster",
            stock: 5,
            price: new Prisma.Decimal("10.00"),
          },
        ]),
      },
      order: {
        create: vi.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      createPublicOrder({
        buyerEmail: "buyer@example.com",
        items: [
          { productId: "product-1", quantity: 1 },
          { productId: "product-2", quantity: 1 },
        ],
      })
    ).rejects.toThrow("Public checkout only supports products from one seller");
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});
