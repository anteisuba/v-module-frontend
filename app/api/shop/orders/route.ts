// app/api/shop/orders/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { createOrder, type OrderCreateInput } from "@/domain/shop/services";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

  const skip = (page - 1) * limit;

  const where: any = {
    userId, // 只显示当前用户的订单（作为卖家）
  };

  if (status) {
    where.status = status;
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // 格式化订单数据
    const formattedOrders = orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      shippedAt: order.shippedAt ? order.shippedAt.toISOString() : null,
      deliveredAt: order.deliveredAt
        ? order.deliveredAt.toISOString()
        : null,
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
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

// POST: 创建订单
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id; // 卖家用户 ID

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { buyerEmail, buyerName, shippingAddress, shippingMethod, items } = body;

  if (!buyerEmail || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "buyerEmail and items (array) are required" },
      { status: 400 }
    );
  }

  // 验证 items 格式
  for (const item of items) {
    if (!item.productId || item.quantity === undefined || item.quantity <= 0) {
      return NextResponse.json(
        { error: "Each item must have productId and quantity > 0" },
        { status: 400 }
      );
    }
  }

  try {
    const input: OrderCreateInput = {
      userId,
      buyerEmail,
      buyerName: buyerName || null,
      shippingAddress: shippingAddress || null,
      shippingMethod: shippingMethod || null,
      items,
    };

    const result = await createOrder(input);

    // 格式化返回数据
    const formattedOrder = {
      ...result.order,
      totalAmount: Number(result.order.totalAmount),
      createdAt: result.order.createdAt.toISOString(),
      updatedAt: result.order.updatedAt.toISOString(),
      paidAt: result.order.paidAt ? result.order.paidAt.toISOString() : null,
      shippedAt: result.order.shippedAt
        ? result.order.shippedAt.toISOString()
        : null,
      deliveredAt: result.order.deliveredAt
        ? result.order.deliveredAt.toISOString()
        : null,
      items: result.items.map((item) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        createdAt: item.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Failed to create order:", error);
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("stock")
        ? 400
        : 500;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create order",
      },
      { status }
    );
  }
}
