// app/api/shop/orders/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { serializeOrderWithItems } from "@/domain/shop/services";
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
