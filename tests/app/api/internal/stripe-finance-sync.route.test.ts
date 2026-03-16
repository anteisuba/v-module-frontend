import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  findManyMock,
  userFindManyMock,
  getPaymentReconciliationReportMock,
  getPaymentSettlementReportMock,
  hasStripeFinanceAlertDestinationsMock,
  sendStripeFinanceAnomalyAlertsMock,
  syncStripeSettlementLedgerMock,
  syncStripeDisputesForUserMock,
  checkConnectAccountHealthMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  userFindManyMock: vi.fn(),
  getPaymentReconciliationReportMock: vi.fn(),
  getPaymentSettlementReportMock: vi.fn(),
  hasStripeFinanceAlertDestinationsMock: vi.fn(),
  sendStripeFinanceAnomalyAlertsMock: vi.fn(),
  syncStripeSettlementLedgerMock: vi.fn(),
  syncStripeDisputesForUserMock: vi.fn(),
  checkConnectAccountHealthMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: findManyMock,
    },
    user: {
      findMany: userFindManyMock,
    },
  },
}));

vi.mock("@/domain/shop", () => ({
  ORDER_PAYMENT_PROVIDER_STRIPE: "STRIPE",
  getPaymentReconciliationReport: getPaymentReconciliationReportMock,
  getPaymentSettlementReport: getPaymentSettlementReportMock,
  hasStripeFinanceAlertDestinations: hasStripeFinanceAlertDestinationsMock,
  sendStripeFinanceAnomalyAlerts: sendStripeFinanceAnomalyAlertsMock,
  syncStripeSettlementLedger: syncStripeSettlementLedgerMock,
  syncStripeDisputesForUser: syncStripeDisputesForUserMock,
  checkConnectAccountHealth: checkConnectAccountHealthMock,
}));

import {
  GET,
  POST,
} from "@/app/api/internal/cron/stripe-finance-sync/route";

describe("stripe finance cron route", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    hasStripeFinanceAlertDestinationsMock.mockReturnValue(false);
    checkConnectAccountHealthMock.mockResolvedValue({
      checked: 0,
      drifted: 0,
      resynced: 0,
      errors: 0,
    });
    sendStripeFinanceAnomalyAlertsMock.mockResolvedValue({
      enabled: false,
      alertedUserCount: 0,
      paymentAnomalyCount: 0,
      settlementAnomalyCount: 0,
      sellerEmailsSent: 0,
      slackSent: false,
      errors: [],
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("returns 401 without the cron secret", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/cron/stripe-finance-sync")
    );

    expect(response.status).toBe(401);
  });

  it("syncs all stripe sellers on GET", async () => {
    findManyMock.mockResolvedValue([{ userId: "seller-1" }, { userId: "seller-2" }]);
    userFindManyMock.mockResolvedValue([
      {
        id: "seller-1",
        email: "seller-1@example.com",
        displayName: "Seller 1",
        slug: "seller-1",
      },
      {
        id: "seller-2",
        email: "seller-2@example.com",
        displayName: "Seller 2",
        slug: "seller-2",
      },
    ]);
    syncStripeSettlementLedgerMock.mockResolvedValue({
      syncedEntries: 3,
      syncedPayouts: 1,
      matchedOrders: 2,
      matchedRefunds: 1,
      matchedPayoutEntries: 1,
    });
    syncStripeDisputesForUserMock.mockResolvedValue({
      syncedDisputes: 1,
      matchedDisputeOrders: 1,
      unmatchedDisputes: 0,
    });

    const response = await GET(
      new Request("http://localhost/api/internal/cron/stripe-finance-sync", {
        headers: {
          authorization: "Bearer cron-secret",
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalled();
    expect(syncStripeSettlementLedgerMock).toHaveBeenCalledTimes(2);
    expect(syncStripeDisputesForUserMock).toHaveBeenCalledTimes(2);
    expect(sendStripeFinanceAnomalyAlertsMock).not.toHaveBeenCalled();
    expect(payload.processedUsers).toBe(2);
    expect(payload.totals.syncedEntries).toBe(6);
    expect(payload.totals.syncedDisputes).toBe(2);
  });

  it("allows targeting a single seller on POST", async () => {
    syncStripeSettlementLedgerMock.mockResolvedValue({
      syncedEntries: 2,
      syncedPayouts: 1,
      matchedOrders: 1,
      matchedRefunds: 0,
      matchedPayoutEntries: 1,
    });
    syncStripeDisputesForUserMock.mockResolvedValue({
      syncedDisputes: 1,
      matchedDisputeOrders: 0,
      unmatchedDisputes: 1,
    });
    userFindManyMock.mockResolvedValue([
      {
        id: "seller-1",
        email: "seller-1@example.com",
        displayName: "Seller 1",
        slug: "seller-1",
      },
    ]);

    const response = await POST(
      new Request(
        "http://localhost/api/internal/cron/stripe-finance-sync?userId=seller-1&start=2026-03-01&end=2026-03-10",
        {
          method: "POST",
          headers: {
            authorization: "Bearer cron-secret",
          },
        }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).not.toHaveBeenCalled();
    expect(syncStripeSettlementLedgerMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
    });
    expect(syncStripeDisputesForUserMock).toHaveBeenCalledWith("seller-1", {
      start: "2026-03-01",
      end: "2026-03-10",
    });
    expect(sendStripeFinanceAnomalyAlertsMock).not.toHaveBeenCalled();
    expect(payload.processedUsers).toBe(1);
  });

  it("dispatches finance alerts when destinations are configured", async () => {
    findManyMock.mockResolvedValue([{ userId: "seller-1" }]);
    userFindManyMock.mockResolvedValue([
      {
        id: "seller-1",
        email: "seller-1@example.com",
        displayName: "Seller 1",
        slug: "seller-1",
      },
    ]);
    hasStripeFinanceAlertDestinationsMock.mockReturnValue(true);
    syncStripeSettlementLedgerMock.mockResolvedValue({
      syncedEntries: 1,
      syncedPayouts: 1,
      matchedOrders: 1,
      matchedRefunds: 0,
      matchedPayoutEntries: 1,
    });
    syncStripeDisputesForUserMock.mockResolvedValue({
      syncedDisputes: 0,
      matchedDisputeOrders: 0,
      unmatchedDisputes: 0,
    });
    getPaymentReconciliationReportMock.mockResolvedValue({
      summary: { anomalyCount: 1 },
      events: [],
      anomalies: [
        {
          id: "payment-anomaly-1",
          code: "FULFILLMENT_WITHOUT_PAYMENT",
        },
      ],
    });
    getPaymentSettlementReportMock.mockResolvedValue({
      summary: { anomalyCount: 1 },
      payouts: [],
      entries: [],
      entryGroups: [],
      anomalies: [
        {
          id: "settlement-anomaly-1",
          code: "STRIPE_ENTRY_UNMATCHED",
        },
      ],
    });
    sendStripeFinanceAnomalyAlertsMock.mockResolvedValue({
      enabled: true,
      alertedUserCount: 1,
      paymentAnomalyCount: 1,
      settlementAnomalyCount: 1,
      sellerEmailsSent: 1,
      slackSent: true,
      errors: [],
    });

    const response = await GET(
      new Request("http://localhost/api/internal/cron/stripe-finance-sync", {
        headers: {
          authorization: "Bearer cron-secret",
        },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getPaymentReconciliationReportMock).toHaveBeenCalledWith("seller-1", {
      start: expect.any(String),
      end: expect.any(String),
      eventLimit: 20,
    });
    expect(getPaymentSettlementReportMock).toHaveBeenCalledWith("seller-1", {
      start: expect.any(String),
      end: expect.any(String),
      entryLimit: 20,
    });
    expect(sendStripeFinanceAnomalyAlertsMock).toHaveBeenCalledWith({
      start: expect.any(String),
      end: expect.any(String),
      sellers: [
        expect.objectContaining({
          userId: "seller-1",
          email: "seller-1@example.com",
          paymentAnomalies: expect.arrayContaining([
            expect.objectContaining({
              id: "payment-anomaly-1",
            }),
          ]),
          settlementAnomalies: expect.arrayContaining([
            expect.objectContaining({
              id: "settlement-anomaly-1",
            }),
          ]),
        }),
      ],
    });
    expect(payload.alerts.enabled).toBe(true);
    expect(payload.users[0].alerts).toEqual({
      paymentAnomalyCount: 1,
      settlementAnomalyCount: 1,
    });
  });
});
