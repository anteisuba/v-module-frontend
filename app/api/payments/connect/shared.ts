import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";

export async function getAuthenticatedUserId() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

function getConnectErrorStatus(error: unknown, message: string) {
  const stripeStatusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : null;

  if (stripeStatusCode && stripeStatusCode >= 400 && stripeStatusCode < 500) {
    return stripeStatusCode;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type.startsWith("Stripe")
  ) {
    return 400;
  }

  return message === "Unauthorized"
    ? 401
    : message === "User not found" || message === "No Stripe payout account found"
      ? 404
      : message.includes("not configured")
        ? 503
        : message.includes("not enabled")
          ? 400
          : 500;
}

export function createConnectErrorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Failed to process Stripe Connect request";

  const status = getConnectErrorStatus(error, message);

  return NextResponse.json({ error: message }, { status });
}
