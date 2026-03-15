import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStripeConnectPayoutEvent } from "@/tests/helpers/stripe";

const { paymentSettlementPayoutUpsertMock, getStripeClientMock } = vi.hoisted(
  () => ({
    paymentSettlementPayoutUpsertMock: vi.fn(),
    getStripeClientMock: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paymentSettlementPayout: {
      upsert: paymentSettlementPayoutUpsertMock,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
}));

import { syncStripeSettlementPayoutByConnectedAccountId } from "@/domain/shop/settlements";

describe("syncStripeSettlementPayoutByConnectedAccountId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the connected account scope on payout snapshots", async () => {
    paymentSettlementPayoutUpsertMock.mockResolvedValue({
      id: "settlement-payout-1",
      externalPayoutId: "po_test_123",
    });

    const payout = createStripeConnectPayoutEvent({
      type: "payout.paid",
    }).data.object;

    await syncStripeSettlementPayoutByConnectedAccountId(
      "acct_connect_123",
      payout as never
    );

    expect(paymentSettlementPayoutUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          externalPayoutId: "po_test_123",
        },
        create: expect.objectContaining({
          stripeAccountId: "acct_connect_123",
          accountScope: "CONNECTED",
          status: "paid",
        }),
        update: expect.objectContaining({
          stripeAccountId: "acct_connect_123",
          accountScope: "CONNECTED",
          status: "paid",
        }),
      })
    );
  });
});
