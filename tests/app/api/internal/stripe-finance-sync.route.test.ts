import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  findManyMock,
  syncStripeSettlementLedgerMock,
  syncStripeDisputesForUserMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  syncStripeSettlementLedgerMock: vi.fn(),
  syncStripeDisputesForUserMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/domain/shop", () => ({
  ORDER_PAYMENT_PROVIDER_STRIPE: "STRIPE",
  syncStripeSettlementLedger: syncStripeSettlementLedgerMock,
  syncStripeDisputesForUser: syncStripeDisputesForUserMock,
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
    expect(payload.processedUsers).toBe(1);
  });
});
