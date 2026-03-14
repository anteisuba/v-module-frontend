import { describe, expect, it } from "vitest";
import { buildPaymentReconciliationReportFromOrders } from "@/domain/shop";

describe("buildPaymentReconciliationReportFromOrders", () => {
  it("builds summary, events, and anomalies for Stripe payment activity", () => {
    const report = buildPaymentReconciliationReportFromOrders(
      [
        {
          id: "order-1",
          paymentRoutingMode: "PLATFORM",
          connectedAccountId: null,
          buyerEmail: "buyer@example.com",
          buyerName: "Alice",
          totalAmount: 5000,
          currency: "JPY",
          status: "SHIPPED",
          paymentProvider: "STRIPE",
          paymentStatus: "FAILED",
          paymentSessionId: "cs_1",
          paymentIntentId: "pi_1",
          paymentExpiresAt: "2026-03-05T00:00:00.000Z",
          paymentFailureReason: "card_declined",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-05T01:00:00.000Z",
          paidAt: null,
          paymentAttempts: [
            {
              id: "attempt-1",
              provider: "STRIPE",
              status: "FAILED",
              amount: 5000,
              currency: "JPY",
              externalSessionId: "cs_1",
              externalPaymentIntentId: "pi_1",
              failureReason: "card_declined",
              createdAt: "2026-03-01T00:00:00.000Z",
              paidAt: null,
              failedAt: "2026-03-05T00:30:00.000Z",
              expiredAt: null,
            },
          ],
          refunds: [],
          disputes: [],
        },
        {
          id: "order-2",
          paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
          connectedAccountId: "acct_connect_123",
          buyerEmail: "buyer2@example.com",
          buyerName: null,
          totalAmount: 8000,
          currency: "JPY",
          status: "PAID",
          paymentProvider: "STRIPE",
          paymentStatus: "PAID",
          paymentSessionId: "cs_2",
          paymentIntentId: "pi_2",
          paymentExpiresAt: null,
          paymentFailureReason: null,
          createdAt: "2026-03-02T00:00:00.000Z",
          updatedAt: "2026-03-06T00:00:00.000Z",
          paidAt: "2026-03-03T00:30:00.000Z",
          paymentAttempts: [
            {
              id: "attempt-2a",
              provider: "STRIPE",
              status: "PAID",
              amount: 8000,
              currency: "JPY",
              externalSessionId: "cs_2",
              externalPaymentIntentId: "pi_2",
              failureReason: null,
              createdAt: "2026-03-02T00:00:00.000Z",
              paidAt: "2026-03-03T00:30:00.000Z",
              failedAt: null,
              expiredAt: null,
            },
            {
              id: "attempt-2b",
              provider: "STRIPE",
              status: "PAID",
              amount: 8000,
              currency: "JPY",
              externalSessionId: "cs_2b",
              externalPaymentIntentId: "pi_2",
              failureReason: null,
              createdAt: "2026-03-02T01:00:00.000Z",
              paidAt: "2026-03-03T01:00:00.000Z",
              failedAt: null,
              expiredAt: null,
            },
          ],
          refunds: [
            {
              id: "refund-2",
              provider: "STRIPE",
              status: "SUCCEEDED",
              amount: 2000,
              currency: "JPY",
              reason: "partial goodwill refund",
              failureReason: null,
              externalRefundId: "re_2",
              externalPaymentIntentId: "pi_2",
              createdAt: "2026-03-04T00:00:00.000Z",
              refundedAt: "2026-03-04T00:30:00.000Z",
            },
          ],
          disputes: [
            {
              id: "dispute-2",
              status: "needs_response",
              reason: "fraudulent",
              amount: 8000,
              currency: "JPY",
              externalDisputeId: "du_2",
              externalPaymentIntentId: "pi_2",
              externalChargeId: "ch_2",
              dueBy: "2026-03-07T00:00:00.000Z",
              closedAt: null,
              createdAt: "2026-03-05T00:00:00.000Z",
              updatedAt: "2026-03-05T00:00:00.000Z",
            },
          ],
        },
      ],
      {
        start: "2026-03-01",
        end: "2026-03-10",
        eventLimit: 20,
      }
    );

    expect(report.summary.grossCapturedAmount).toBe(16000);
    expect(report.summary.refundedAmount).toBe(2000);
    expect(report.summary.netCollectedAmount).toBe(14000);
    expect(report.events).toHaveLength(4);
    expect(report.anomalies.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "FULFILLMENT_WITHOUT_PAYMENT",
        "MULTIPLE_SUCCESSFUL_PAYMENTS",
        "REFUND_STATUS_MISMATCH",
        "DISPUTE_NEEDS_RESPONSE",
      ])
    );
  });

  it("filters the report by routing mode and connected account", () => {
    const report = buildPaymentReconciliationReportFromOrders(
      [
        {
          id: "order-platform",
          paymentRoutingMode: "PLATFORM",
          connectedAccountId: null,
          buyerEmail: "platform@example.com",
          buyerName: "Platform Buyer",
          totalAmount: 3200,
          currency: "JPY",
          status: "PAID",
          paymentProvider: "STRIPE",
          paymentStatus: "PAID",
          paymentSessionId: "cs_platform",
          paymentIntentId: "pi_platform",
          paymentExpiresAt: null,
          paymentFailureReason: null,
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T01:00:00.000Z",
          paidAt: "2026-03-01T00:30:00.000Z",
          paymentAttempts: [
            {
              id: "attempt-platform",
              provider: "STRIPE",
              status: "PAID",
              amount: 3200,
              currency: "JPY",
              connectedAccountId: null,
              externalSessionId: "cs_platform",
              externalPaymentIntentId: "pi_platform",
              failureReason: null,
              createdAt: "2026-03-01T00:00:00.000Z",
              paidAt: "2026-03-01T00:30:00.000Z",
              failedAt: null,
              expiredAt: null,
            },
          ],
          refunds: [],
          disputes: [],
        },
        {
          id: "order-connect",
          paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
          connectedAccountId: "acct_connect_456",
          buyerEmail: "connect@example.com",
          buyerName: "Connect Buyer",
          totalAmount: 6400,
          currency: "JPY",
          status: "AWAITING_PAYMENT",
          paymentProvider: "STRIPE",
          paymentStatus: "PAID",
          paymentSessionId: "cs_connect",
          paymentIntentId: "pi_connect",
          paymentExpiresAt: null,
          paymentFailureReason: null,
          createdAt: "2026-03-02T00:00:00.000Z",
          updatedAt: "2026-03-02T01:00:00.000Z",
          paidAt: "2026-03-02T00:30:00.000Z",
          paymentAttempts: [
            {
              id: "attempt-connect",
              provider: "STRIPE",
              status: "PAID",
              amount: 6400,
              currency: "JPY",
              connectedAccountId: "acct_connect_456",
              externalSessionId: "cs_connect",
              externalPaymentIntentId: "pi_connect",
              failureReason: null,
              createdAt: "2026-03-02T00:00:00.000Z",
              paidAt: "2026-03-02T00:30:00.000Z",
              failedAt: null,
              expiredAt: null,
            },
          ],
          refunds: [],
          disputes: [],
        },
      ],
      {
        start: "2026-03-01",
        end: "2026-03-10",
        paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
        connectedAccountId: "acct_connect_456",
        eventLimit: 20,
      }
    );

    expect(report.summary.stripeOrderCount).toBe(1);
    expect(report.summary.grossCapturedAmount).toBe(6400);
    expect(report.events).toHaveLength(1);
    expect(report.events[0]?.orderId).toBe("order-connect");
    expect(report.events[0]?.connectedAccountId).toBe("acct_connect_456");
    expect(report.anomalies.map((item) => item.code)).toEqual([
      "AWAITING_PAYMENT_AFTER_PAID",
    ]);
  });
});
