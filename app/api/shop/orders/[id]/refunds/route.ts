import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { createOrderRefund } from "@/domain/shop";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { amount?: number | null; reason?: string | null } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const result = await createOrderRefund({
      orderId: id,
      requestedByUserId: session.user.id,
      amount: body.amount == null ? null : Number(body.amount),
      reason: body.reason || null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create refund";

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : message.includes("not found")
            ? 404
            : message.includes("refundable") ||
                message.includes("Only paid orders can be refunded") ||
                message.includes("not supported") ||
                message.includes("amount") ||
                message.includes("payment intent")
              ? 400
              : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
