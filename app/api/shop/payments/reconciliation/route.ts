import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  buildPaymentAnomaliesCsv,
  buildPaymentEventsCsv,
  getPaymentReconciliationReport,
} from "@/domain/shop";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const exportType = searchParams.get("export");

  try {
    const report = await getPaymentReconciliationReport(session.user.id, {
      start,
      end,
      eventLimit: exportType ? Number.MAX_SAFE_INTEGER : 50,
    });

    if (exportType === "events") {
      const csv = buildPaymentEventsCsv(report.events);
      const timestamp = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="stripe-payment-events-${timestamp}.csv"`,
        },
      });
    }

    if (exportType === "anomalies") {
      const csv = buildPaymentAnomaliesCsv(report.anomalies);
      const timestamp = new Date().toISOString().slice(0, 10);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="stripe-payment-anomalies-${timestamp}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to build payment reconciliation report";
    const status =
      message.includes("start date cannot be after end date") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
