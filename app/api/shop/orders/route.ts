// app/api/shop/orders/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  ORDER_WITH_ITEMS_QUERY,
  serializeOrderWithItems,
} from "@/domain/shop/services";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function escapeCsvField(value: string | number | null | undefined): string {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildOrdersCsv(
  orders: ReturnType<typeof serializeOrderWithItems>[]
): string {
  const header = [
    "orderId",
    "buyerEmail",
    "buyerName",
    "status",
    "paymentProvider",
    "paymentStatus",
    "totalAmount",
    "createdAt",
    "shippingMethod",
    "items",
    "shippingAddress",
  ];

  const rows = orders.map((order) => {
    const itemSummary = order.items
      .map((item) => `${item.product?.name || item.productId} x ${item.quantity}`)
      .join(" | ");

    return [
      escapeCsvField(order.id),
      escapeCsvField(order.buyerEmail),
      escapeCsvField(order.buyerName),
      escapeCsvField(order.status),
      escapeCsvField(order.paymentProvider),
      escapeCsvField(order.paymentStatus),
      escapeCsvField(order.totalAmount),
      escapeCsvField(order.createdAt),
      escapeCsvField(order.shippingMethod),
      escapeCsvField(itemSummary),
      escapeCsvField(
        order.shippingAddress ? JSON.stringify(order.shippingAddress) : ""
      ),
    ].join(",");
  });

  return `\uFEFF${header.join(",")}\n${rows.join("\n")}`;
}

// GET: 获取订单列表（只显示当前用户的订单，作为卖家）
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status") || undefined;
  const query = searchParams.get("query")?.trim() || undefined;
  const exportFormat = searchParams.get("export") || undefined;

  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {
    userId, // 只显示当前用户的订单（作为卖家）
  };

  if (status) {
    where.status = status;
  }

  if (query) {
    where.OR = [
      {
        id: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        buyerEmail: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        buyerName: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        items: {
          some: {
            product: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
      },
    ];
  }

  try {
    const orderQuery = {
      where,
      orderBy: { createdAt: "desc" as const },
      ...ORDER_WITH_ITEMS_QUERY,
    };

    if (exportFormat === "csv") {
      const orders = await prisma.order.findMany(orderQuery);
      const serializedOrders = orders.map((order) => serializeOrderWithItems(order));
      const csv = buildOrdersCsv(serializedOrders);
      const timestamp = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="orders-${timestamp}.csv"`,
        },
      });
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        ...orderQuery,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((order) => serializeOrderWithItems(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to get orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST: 卖家订单管理不支持在该端点创建订单，公开结账请走 /api/shop/checkout
export async function POST() {
  return NextResponse.json(
    { error: "Use POST /api/shop/checkout for public checkout orders" },
    {
      status: 405,
      headers: {
        Allow: "GET",
      },
    }
  );
}
