import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeConnectAccountEvent,
  createStripeConnectPayoutEvent,
} from "@/tests/helpers/stripe";

const {
  constructEventMock,
  getStripeClientMock,
  getStripeConnectWebhookSecretMock,
  syncStripePayoutAccountByConnectedAccountIdMock,
  syncStripeSettlementPayoutByConnectedAccountIdMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  getStripeConnectWebhookSecretMock: vi.fn(),
  syncStripePayoutAccountByConnectedAccountIdMock: vi.fn(),
  syncStripeSettlementPayoutByConnectedAccountIdMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
  getStripeConnectWebhookSecret: getStripeConnectWebhookSecretMock,
}));

vi.mock("@/domain/shop", () => ({
  syncStripePayoutAccountByConnectedAccountId:
    syncStripePayoutAccountByConnectedAccountIdMock,
  syncStripeSettlementPayoutByConnectedAccountId:
    syncStripeSettlementPayoutByConnectedAccountIdMock,
}));

import { POST } from "@/app/api/payments/stripe/connect/webhook/route";

function createWebhookRequest() {
  return new Request("http://localhost/api/payments/stripe/connect/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": "sig_test",
    },
    body: "payload",
  });
}

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
    constructEventMock.mockReturnValue(createStripeConnectAccountEvent());

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith(
      "payload",
      "sig_test",
      "whsec_connect_test"
    );
    expect(syncStripePayoutAccountByConnectedAccountIdMock).toHaveBeenCalledWith(
      "acct_test_123",
      expect.objectContaining({
        id: "acct_test_123",
      })
    );
    expect(
      syncStripeSettlementPayoutByConnectedAccountIdMock
    ).not.toHaveBeenCalled();
  });

  it.each([
    "account.external_account.created",
    "account.external_account.updated",
    "account.external_account.deleted",
  ] as const)("refreshes bank summary on %s", async (type) => {
    constructEventMock.mockReturnValue(createStripeConnectAccountEvent({ type }));

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith(
      "payload",
      "sig_test",
      "whsec_connect_test"
    );
    expect(syncStripePayoutAccountByConnectedAccountIdMock).toHaveBeenCalledWith(
      "acct_test_456"
    );
    expect(
      syncStripeSettlementPayoutByConnectedAccountIdMock
    ).not.toHaveBeenCalled();
  });

  it.each([
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
    "payout.canceled",
  ] as const)("syncs settlement payout snapshots on %s", async (type) => {
    constructEventMock.mockReturnValue(createStripeConnectPayoutEvent({ type }));

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith(
      "payload",
      "sig_test",
      "whsec_connect_test"
    );
    expect(
      syncStripeSettlementPayoutByConnectedAccountIdMock
    ).toHaveBeenCalledWith(
      "acct_test_789",
      expect.objectContaining({
        object: "payout",
        id: "po_test_123",
      })
    );
    expect(syncStripePayoutAccountByConnectedAccountIdMock).not.toHaveBeenCalled();
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
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("returns 400 when connect signature verification fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No signatures found matching the expected signature for payload",
    });
    expect(syncStripePayoutAccountByConnectedAccountIdMock).not.toHaveBeenCalled();
    expect(
      syncStripeSettlementPayoutByConnectedAccountIdMock
    ).not.toHaveBeenCalled();
  });

  it("ignores unrelated connect events without syncing payout accounts", async () => {
    constructEventMock.mockReturnValue({
      type: "account.application.authorized",
      data: {
        object: {
          object: "application",
          id: "ca_test_123",
        },
      },
    });

    const response = await POST(createWebhookRequest());

    expect(response.status).toBe(200);
    expect(syncStripePayoutAccountByConnectedAccountIdMock).not.toHaveBeenCalled();
    expect(
      syncStripeSettlementPayoutByConnectedAccountIdMock
    ).not.toHaveBeenCalled();
  });
});
