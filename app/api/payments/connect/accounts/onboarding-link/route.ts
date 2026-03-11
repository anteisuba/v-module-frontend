import { NextResponse } from "next/server";
import { createStripePayoutOnboardingLink } from "@/domain/shop";
import { createConnectErrorResponse, getAuthenticatedUserId } from "../../shared";

export const runtime = "nodejs";

export async function GET(_request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createStripePayoutOnboardingLink(userId);
    return NextResponse.redirect(result.url);
  } catch (error) {
    return createConnectErrorResponse(error);
  }
}

export async function POST(_request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createStripePayoutOnboardingLink(userId);
    return NextResponse.json(result);
  } catch (error) {
    return createConnectErrorResponse(error);
  }
}
