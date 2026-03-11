import { NextResponse } from "next/server";
import { ensureStripePayoutAccountForUser } from "@/domain/shop";
import { createConnectErrorResponse, getAuthenticatedUserId } from "../shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await ensureStripePayoutAccountForUser(userId);
    return NextResponse.json({ account });
  } catch (error) {
    return createConnectErrorResponse(error);
  }
}
