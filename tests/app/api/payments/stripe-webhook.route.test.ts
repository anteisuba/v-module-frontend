import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeCheckoutSessionEvent,
  createStripeDisputeEvent,
} from "@/tests/helpers/stripe";

const {
  constructEventMock,
  getStripeClientMock,
  getStripeWebhookSecretMock,
  handleStripeCheckoutPaidMock,
  handleStripeCheckoutFailedMock,
  handleStripeCheckoutExpiredMock,
  handleStripeDisputeUpdatedMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  getStripeWebhookSecretMock: vi.fn(),
  handleStripeCheckoutPaidMock: vi.fn(),
  handleStripeCheckoutFailedMock: vi.fn(),
  handleStripeCheckoutExpiredMock: vi.fn(),
  handleStripeDisputeUpdatedMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
  getStripeWebhookSecret: getStripeWebhookSecretMock,
}));

vi.mock("@/domain/shop", () => ({
  handleStripeCheckoutPaid: handleStripeCheckoutPaidMock,
  handleStripeCheckoutFailed: handleStripeCheckoutFailedMock,
  handleStripeCheckoutExpired: handleStripeCheckoutExpiredMock,
  handleStripeDisputeUpdated: handleStripeDisputeUpdatedMock,
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
    constructEventMock.mockReturnValue(createStripeCheckoutSessionEvent());

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
    constructEventMock.mockReturnValue(
      createStripeCheckoutSessionEvent({
        type: "checkout.session.expired",
        session: {
          id: "cs_test_expired",
        },
      })
    );

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

  it("records dispute events without treating them as checkout sessions", async () => {
    constructEventMock.mockReturnValue(createStripeDisputeEvent());

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
    expect(handleStripeDisputeUpdatedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "du_test_123",
      })
    );
    expect(handleStripeCheckoutPaidMock).not.toHaveBeenCalled();
  });

  it("confirms async payment success with the paid handler", async () => {
    constructEventMock.mockReturnValue(
      createStripeCheckoutSessionEvent({
        type: "checkout.session.async_payment_succeeded",
        session: {
          id: "cs_async_paid",
        },
      })
    );

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
        id: "cs_async_paid",
      })
    );
  });

  it("records async payment failure with the failed handler", async () => {
    constructEventMock.mockReturnValue(
      createStripeCheckoutSessionEvent({
        type: "checkout.session.async_payment_failed",
        session: {
          id: "cs_async_failed",
        },
      })
    );

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
    expect(handleStripeCheckoutFailedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cs_async_failed",
      })
    );
  });

  it("returns 400 when the Stripe signature is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/payments/stripe/webhook", {
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
