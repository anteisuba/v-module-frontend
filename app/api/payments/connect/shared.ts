import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";

export async function getAuthenticatedUserId() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export function createConnectErrorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Failed to process Stripe Connect request";

  const status =
    message === "Unauthorized"
      ? 401
      : message === "User not found" || message === "No Stripe payout account found"
        ? 404
        : message.includes("not configured")
          ? 503
          : message.includes("not enabled")
            ? 400
            : 500;

  return NextResponse.json({ error: message }, { status });
}
