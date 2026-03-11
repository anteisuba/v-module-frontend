import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  constructEventMock,
  getStripeClientMock,
  getStripeConnectWebhookSecretMock,
  syncStripePayoutAccountByConnectedAccountIdMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  getStripeConnectWebhookSecretMock: vi.fn(),
  syncStripePayoutAccountByConnectedAccountIdMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
  getStripeConnectWebhookSecret: getStripeConnectWebhookSecretMock,
}));

vi.mock("@/domain/shop", () => ({
  syncStripePayoutAccountByConnectedAccountId:
    syncStripePayoutAccountByConnectedAccountIdMock,
}));

import { POST } from "@/app/api/payments/stripe/connect/webhook/route";

describe("POST /api/payments/stripe/connect/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    getStripeConnectWebhookSecretMock.mockReturnValue("whsec_connect_test");
    getStripeClientMock.mockReturnValue({
      webhooks: {
        constructEvent: constructEventMock,
      },
    });
  });

  it("syncs seller payout state on account.updated", async () => {
    constructEventMock.mockReturnValue({
      type: "account.updated",
      data: {
        object: {
          object: "account",
          id: "acct_test_123",
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: [],
            disabled_reason: null,
          },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/payments/stripe/connect/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
        },
        body: "payload",
      })
    );

    expect(response.status).toBe(200);
    expect(syncStripePayoutAccountByConnectedAccountIdMock).toHaveBeenCalledWith(
      "acct_test_123",
      expect.objectContaining({
        id: "acct_test_123",
      })
    );
  });

  it("refreshes bank summary on external account updates", async () => {
    constructEventMock.mockReturnValue({
      type: "account.external_account.updated",
      account: "acct_test_456",
      data: {
        object: {
          object: "bank_account",
          id: "ba_test_123",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/payments/stripe/connect/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
        },
        body: "payload",
      })
    );

    expect(response.status).toBe(200);
    expect(syncStripePayoutAccountByConnectedAccountIdMock).toHaveBeenCalledWith(
      "acct_test_456"
    );
  });

  it("returns 400 when the signature is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/payments/stripe/connect/webhook", {
        method: "POST",
        body: "payload",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing Stripe signature",
    });
  });
});
