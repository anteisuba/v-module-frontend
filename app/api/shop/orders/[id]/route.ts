// app/api/shop/orders/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  ORDER_PAYMENT_PROVIDER_STRIPE,
  ORDER_PAYMENT_STATUS_PAID,
  ORDER_PAYMENT_STATUS_OPEN,
  ORDER_STATUS_AWAITING_PAYMENT,
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_PAID,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_SHIPPED,
  ORDER_WITH_ITEMS_QUERY,
  sendOrderStatusChangedNotifications,
  serializeOrderWithItems,
} from "@/domain/shop";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isManualTransitionAllowed(currentStatus: string, nextStatus: string) {
  const transitions: Record<string, string[]> = {
    [ORDER_STATUS_PENDING]: [ORDER_STATUS_PAID, ORDER_STATUS_CANCELLED],
    [ORDER_STATUS_PAID]: [ORDER_STATUS_SHIPPED, ORDER_STATUS_CANCELLED],
    [ORDER_STATUS_SHIPPED]: [ORDER_STATUS_DELIVERED],
    [ORDER_STATUS_AWAITING_PAYMENT]: [],
    [ORDER_STATUS_DELIVERED]: [],
    [ORDER_STATUS_CANCELLED]: [],
  };

  if (currentStatus === nextStatus) {
    return true;
  }

  return transitions[currentStatus]?.includes(nextStatus) || false;
}

// GET: 获取订单详情（卖家会话可读；公开访客需提供 buyerEmail）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const buyerEmail = searchParams.get("buyerEmail")?.trim().toLowerCase() || null;

  if (buyerEmail) {
    const order = await prisma.order.findUnique({
      where: { id },
      ...ORDER_WITH_ITEMS_QUERY,
    });

    if (!order || order.buyerEmail.trim().toLowerCase() !== buyerEmail) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrderWithItems(order) });
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    ...ORDER_WITH_ITEMS_QUERY,
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order: serializeOrderWithItems(order) });
}

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
    select: {
      id: true,
      userId: true,
      status: true,
      paymentProvider: true,
      paymentStatus: true,
      paidAt: true,
      shippedAt: true,
      deliveredAt: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const previousStatus = existing.status;

  if (
    existing.paymentProvider === ORDER_PAYMENT_PROVIDER_STRIPE &&
    status === ORDER_STATUS_PAID
  ) {
    return NextResponse.json(
      { error: "Stripe orders must be marked as paid by webhook events" },
      { status: 400 }
    );
  }

  if (
    previousStatus !== status &&
    !isManualTransitionAllowed(previousStatus, status)
  ) {
    return NextResponse.json(
      { error: `Cannot change order status from ${previousStatus} to ${status}` },
      { status: 400 }
    );
  }

  if (
    existing.paymentProvider === ORDER_PAYMENT_PROVIDER_STRIPE &&
    existing.paymentStatus === ORDER_PAYMENT_STATUS_OPEN &&
    previousStatus === ORDER_STATUS_AWAITING_PAYMENT &&
    previousStatus !== status
  ) {
    return NextResponse.json(
      { error: "Awaiting Stripe payment orders cannot be updated manually" },
      { status: 400 }
    );
  }

  // 更新订单状态
  const updateData: any = { status };

  // 根据状态更新时间戳
  if (status === ORDER_STATUS_PAID && !existing.paidAt) {
    updateData.paidAt = new Date();
  }
  if (status === ORDER_STATUS_PAID) {
    updateData.paymentStatus = existing.paymentStatus || ORDER_PAYMENT_STATUS_PAID;
  }
  if (status === ORDER_STATUS_SHIPPED && !existing.shippedAt) {
    updateData.shippedAt = new Date();
  }
  if (status === ORDER_STATUS_DELIVERED && !existing.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    ...ORDER_WITH_ITEMS_QUERY,
  });

  const serializedOrder = serializeOrderWithItems(order);

  if (previousStatus !== status) {
    try {
      await sendOrderStatusChangedNotifications(serializedOrder, previousStatus);
    } catch (notificationError) {
      console.error("Failed to send order status notifications:", notificationError);
    }
  }

  return NextResponse.json({ order: serializedOrder });
}
