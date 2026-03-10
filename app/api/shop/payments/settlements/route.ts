import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  getPaymentSettlementReport,
  syncStripeSettlementLedger,
  syncStripeDisputesForUser,
  updatePaymentSettlementEntries,
} from "@/domain/shop";

export const runtime = "nodejs";

function getErrorStatus(message: string) {
  if (
    message.includes("Unauthorized") ||
    message.includes("Forbidden") ||
    message.includes("not found")
  ) {
    return 403;
  }

  if (
    message.includes("Please select at least one settlement entry") ||
    message.includes("Unsupported reconciliation status") ||
    message.includes("start date cannot be after end date")
  ) {
    return 400;
  }

  return 500;
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const report = await getPaymentSettlementReport(session.user.id, {
      start,
      end,
      entryLimit: 100,
    });

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load payment settlement report";

    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(message) }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    start?: string | null;
    end?: string | null;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const [settlementSync, disputeSync] = await Promise.all([
      syncStripeSettlementLedger(session.user.id, {
        start: body.start || null,
        end: body.end || null,
      }),
      syncStripeDisputesForUser(session.user.id, {
        start: body.start || null,
        end: body.end || null,
      }),
    ]);
    const report = await getPaymentSettlementReport(session.user.id, {
      start: body.start || null,
      end: body.end || null,
      entryLimit: 100,
    });

    return NextResponse.json({
      sync: {
        ...settlementSync,
        ...disputeSync,
      },
      report,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync Stripe settlement ledger";

    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(message) }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      ids?: string[];
      reconciliationStatus?: string;
      note?: string | null;
      start?: string | null;
      end?: string | null;
    };

    const updated = await updatePaymentSettlementEntries({
      userId: session.user.id,
      ids: Array.isArray(body.ids) ? body.ids : [],
      reconciliationStatus:
        (body.reconciliationStatus as
          | "OPEN"
          | "RECONCILED"
          | "IGNORED"
          | undefined) || "OPEN",
      note: body.note || null,
    });

    const report = await getPaymentSettlementReport(session.user.id, {
      start: body.start || null,
      end: body.end || null,
      entryLimit: 100,
    });

    return NextResponse.json({ updated, report });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update settlement reconciliation status";

    return NextResponse.json(
      { error: message },
      { status: getErrorStatus(message) }
    );
  }
}
