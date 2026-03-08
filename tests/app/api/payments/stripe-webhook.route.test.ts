import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  constructEventMock,
  getStripeClientMock,
  getStripeWebhookSecretMock,
  handleStripeCheckoutPaidMock,
  handleStripeCheckoutFailedMock,
  handleStripeCheckoutExpiredMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  getStripeWebhookSecretMock: vi.fn(),
  handleStripeCheckoutPaidMock: vi.fn(),
  handleStripeCheckoutFailedMock: vi.fn(),
  handleStripeCheckoutExpiredMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
  getStripeWebhookSecret: getStripeWebhookSecretMock,
}));

vi.mock("@/domain/shop", () => ({
  handleStripeCheckoutPaid: handleStripeCheckoutPaidMock,
  handleStripeCheckoutFailed: handleStripeCheckoutFailedMock,
  handleStripeCheckoutExpired: handleStripeCheckoutExpiredMock,
}));

import { POST } from "@/app/api/payments/stripe/webhook/route";

describe("POST /api/payments/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    getStripeWebhookSecretMock.mockReturnValue("whsec_test");
    getStripeClientMock.mockReturnValue({
      webhooks: {
        constructEvent: constructEventMock,
      },
    });
  });

  it("marks a paid checkout session as paid", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          object: "checkout.session",
          id: "cs_test_123",
          payment_status: "paid",
          payment_intent: "pi_123",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/payments/stripe/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
        },
        body: "payload",
      })
    );

    expect(response.status).toBe(200);
    expect(handleStripeCheckoutPaidMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cs_test_123",
      })
    );
  });

  it("releases inventory when a checkout session expires", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.expired",
      data: {
        object: {
          object: "checkout.session",
          id: "cs_test_expired",
          payment_status: "unpaid",
          payment_intent: null,
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/payments/stripe/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig_test",
        },
        body: "payload",
      })
    );

    expect(response.status).toBe(200);
    expect(handleStripeCheckoutExpiredMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cs_test_expired",
      })
    );
    expect(handleStripeCheckoutPaidMock).not.toHaveBeenCalled();
  });
});
