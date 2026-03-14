import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, getPaymentReconciliationReportMock } =
  vi.hoisted(() => ({
    getServerSessionMock: vi.fn(),
    getPaymentReconciliationReportMock: vi.fn(),
  }));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop", () => ({
  getPaymentReconciliationReport: getPaymentReconciliationReportMock,
  buildPaymentEventsCsv: vi.fn((events) => `events:${events.length}`),
  buildPaymentAnomaliesCsv: vi.fn((anomalies) => `anomalies:${anomalies.length}`),
}));

import { GET } from "@/app/api/shop/payments/reconciliation/route";

describe("GET /api/shop/payments/reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the seller session is missing", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/shop/payments/reconciliation")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the reconciliation report as JSON", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
    getPaymentReconciliationReportMock.mockResolvedValue({
      summary: {
        anomalyCount: 1,
      },
      events: [{ id: "event-1" }],
      anomalies: [{ id: "anomaly-1" }],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shop/payments/reconciliation?start=2026-03-01&end=2026-03-10"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getPaymentReconciliationReportMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
      eventLimit: 50,
    });
    expect(payload.summary.anomalyCount).toBe(1);
  });

  it("passes routing mode and connected account filters to the report builder", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
    getPaymentReconciliationReportMock.mockResolvedValue({
      summary: {
        anomalyCount: 0,
      },
      events: [],
      anomalies: [],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shop/payments/reconciliation?paymentRoutingMode=STRIPE_CONNECT_DESTINATION&connectedAccountId=%20acct_test_123%20"
      )
    );

    expect(response.status).toBe(200);
    expect(getPaymentReconciliationReportMock).toHaveBeenCalledWith("seller-1", {
      start: null,
      end: null,
      eventLimit: 50,
      paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
      connectedAccountId: "acct_test_123",
    });
  });

  it("returns events CSV when export=events is requested", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
    getPaymentReconciliationReportMock.mockResolvedValue({
      summary: {
        anomalyCount: 0,
      },
      events: [{ id: "event-1" }, { id: "event-2" }],
      anomalies: [],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shop/payments/reconciliation?export=events"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("events:2");
    expect(response.headers.get("Content-Type")).toContain("text/csv");
  });

  it("returns 400 for unsupported routing mode filters", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shop/payments/reconciliation?paymentRoutingMode=INVALID_MODE"
      )
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid payment routing mode",
    });
    expect(getPaymentReconciliationReportMock).not.toHaveBeenCalled();
  });
});
