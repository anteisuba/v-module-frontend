import { NextResponse } from "next/server";
import { getSellerPayoutAccountForUser } from "@/domain/shop";
import { createConnectErrorResponse, getAuthenticatedUserId } from "../../shared";

export const runtime = "nodejs";

export async function GET(request: Request) {
  void request;
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await getSellerPayoutAccountForUser(userId);
    return NextResponse.json({ account });
  } catch (error) {
    return createConnectErrorResponse(error);
  }
}
