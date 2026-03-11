import { NextResponse } from "next/server";
import { syncStripePayoutAccountForUser } from "@/domain/shop";
import { createConnectErrorResponse, getAuthenticatedUserId } from "../../shared";

export const runtime = "nodejs";

export async function POST(_request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await syncStripePayoutAccountForUser(userId);
    return NextResponse.json({ account });
  } catch (error) {
    return createConnectErrorResponse(error);
  }
}
