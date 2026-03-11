import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  getPaymentSettlementReportMock,
  syncStripeSettlementLedgerMock,
  syncStripeDisputesForUserMock,
  updatePaymentSettlementEntriesMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getPaymentSettlementReportMock: vi.fn(),
  syncStripeSettlementLedgerMock: vi.fn(),
  syncStripeDisputesForUserMock: vi.fn(),
  updatePaymentSettlementEntriesMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop", () => ({
  getPaymentSettlementReport: getPaymentSettlementReportMock,
  syncStripeSettlementLedger: syncStripeSettlementLedgerMock,
  syncStripeDisputesForUser: syncStripeDisputesForUserMock,
  updatePaymentSettlementEntries: updatePaymentSettlementEntriesMock,
}));

import {
  GET,
  PATCH,
  POST,
} from "@/app/api/shop/payments/settlements/route";

describe("shop payment settlements route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the seller session is missing", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/shop/payments/settlements")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the settlement report as JSON", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "seller-1" },
    });
    getPaymentSettlementReportMock.mockResolvedValue({
      summary: { anomalyCount: 2 },
      payouts: [],
      entries: [],
      anomalies: [],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/shop/payments/settlements?start=2026-03-01&end=2026-03-10"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getPaymentSettlementReportMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
      entryLimit: 100,
    });
    expect(payload.summary.anomalyCount).toBe(2);
  });

  it("syncs Stripe settlement data on POST", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "seller-1" },
    });
    syncStripeSettlementLedgerMock.mockResolvedValue({
      syncedEntries: 4,
      syncedPayouts: 1,
      matchedOrders: 3,
      matchedRefunds: 1,
      matchedPayoutEntries: 2,
    });
    syncStripeDisputesForUserMock.mockResolvedValue({
      syncedDisputes: 2,
      matchedDisputeOrders: 1,
      unmatchedDisputes: 1,
    });
    getPaymentSettlementReportMock.mockResolvedValue({
      summary: { anomalyCount: 0 },
      payouts: [],
      entries: [],
      anomalies: [],
    });

    const response = await POST(
      new Request("http://localhost/api/shop/payments/settlements", {
        method: "POST",
        body: JSON.stringify({
          start: "2026-03-01",
          end: "2026-03-10",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(syncStripeSettlementLedgerMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
    });
    expect(syncStripeDisputesForUserMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
    });
    expect(payload.sync.syncedEntries).toBe(4);
    expect(payload.sync.syncedDisputes).toBe(2);
  });

  it("updates settlement write-off state on PATCH", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "seller-1" },
    });
    updatePaymentSettlementEntriesMock.mockResolvedValue({
      updatedCount: 2,
    });
    getPaymentSettlementReportMock.mockResolvedValue({
      summary: { anomalyCount: 0 },
      payouts: [],
      entries: [],
      anomalies: [],
    });

    const response = await PATCH(
      new Request("http://localhost/api/shop/payments/settlements", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["entry-1", "entry-2"],
          reconciliationStatus: "RECONCILED",
          note: "checked",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updatePaymentSettlementEntriesMock).toHaveBeenCalledWith({
      userId: "seller-1",
      ids: ["entry-1", "entry-2"],
      reconciliationStatus: "RECONCILED",
      note: "checked",
    });
    expect(payload.updated.updatedCount).toBe(2);
  });
});
