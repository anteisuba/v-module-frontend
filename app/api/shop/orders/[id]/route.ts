// app/api/shop/orders/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PUT: 更新订单状态
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { status } = body;

  if (!status) {
    return NextResponse.json(
      { error: "status is required" },
      { status: 400 }
    );
  }

  // 验证订单属于当前用户
  const existing = await prisma.order.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 更新订单状态
  const updateData: any = { status };

  // 根据状态更新时间戳
  if (status === "PAID" && !existing.paidAt) {
    updateData.paidAt = new Date();
  }
  if (status === "SHIPPED" && !existing.shippedAt) {
    updateData.shippedAt = new Date();
  }
  if (status === "DELIVERED" && !existing.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ order });
}
