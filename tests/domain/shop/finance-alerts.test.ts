import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  hasEmailDeliveryConfiguredMock,
  sendEmailMessageMock,
  sendSlackWebhookMessageMock,
} = vi.hoisted(() => ({
  hasEmailDeliveryConfiguredMock: vi.fn(),
  sendEmailMessageMock: vi.fn(),
  sendSlackWebhookMessageMock: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  hasEmailDeliveryConfigured: hasEmailDeliveryConfiguredMock,
  sendEmailMessage: sendEmailMessageMock,
}));

vi.mock("@/lib/slack", () => ({
  sendSlackWebhookMessage: sendSlackWebhookMessageMock,
}));

import {
  hasStripeFinanceAlertDestinations,
  sendStripeFinanceAnomalyAlerts,
} from "@/domain/shop";

describe("finance alerts", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const originalSlackWebhookUrl = process.env.FINANCE_ALERT_SLACK_WEBHOOK_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "https://vt.example.com";
    process.env.FINANCE_ALERT_SLACK_WEBHOOK_URL =
      "https://hooks.slack.com/services/test";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    process.env.FINANCE_ALERT_SLACK_WEBHOOK_URL = originalSlackWebhookUrl;
  });

  it("sends seller email alerts and a Slack summary when anomalies exist", async () => {
    hasEmailDeliveryConfiguredMock.mockReturnValue(true);

    const result = await sendStripeFinanceAnomalyAlerts({
      start: "2026-03-01",
      end: "2026-03-10",
      sellers: [
        {
          userId: "seller-1",
          email: "seller-1@example.com",
          displayName: "Seller One",
          slug: "seller-one",
          paymentAnomalies: [
            {
              id: "payment-anomaly-1",
              code: "FULFILLMENT_WITHOUT_PAYMENT",
              severity: "high",
              orderId: "order-1",
              buyerEmail: "buyer@example.com",
              buyerName: "Buyer",
              title: "履约状态领先于支付状态",
              description: "订单已经进入履约流程，但支付侧仍是未成功状态。",
              suggestedAction: "暂停履约。",
              orderStatus: "SHIPPED",
              paymentStatus: "FAILED",
              paymentSessionId: "cs_1",
              paymentIntentId: "pi_1",
              createdAt: "2026-03-05T00:00:00.000Z",
            },
          ],
          settlementAnomalies: [
            {
              id: "settlement-anomaly-1",
              code: "STRIPE_ENTRY_UNMATCHED",
              severity: "high",
              title: "Stripe 结算流水未匹配到本地订单",
              description: "这条 Stripe balance transaction 没有关联到本地订单或退款记录。",
              suggestedAction: "检查 PaymentIntent metadata。",
              orderId: null,
              refundId: null,
              entryId: "entry-1",
              externalReference: "txn_1",
              occurredAt: "2026-03-05T00:00:00.000Z",
            },
          ],
        },
        {
          userId: "seller-2",
          email: "seller-2@example.com",
          displayName: "Seller Two",
          slug: "seller-two",
          paymentAnomalies: [],
          settlementAnomalies: [],
        },
      ],
    });

    expect(hasStripeFinanceAlertDestinations()).toBe(true);
    expect(sendEmailMessageMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "seller-1@example.com",
        subject: expect.stringContaining("1 条支付异常 / 1 条结算异常"),
      })
    );
    expect(sendSlackWebhookMessageMock).toHaveBeenCalledTimes(1);
    expect(sendSlackWebhookMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        webhookUrl: "https://hooks.slack.com/services/test",
        text: expect.stringContaining("Seller One"),
      })
    );
    expect(result).toMatchObject({
      enabled: true,
      alertedUserCount: 1,
      paymentAnomalyCount: 1,
      settlementAnomalyCount: 1,
      sellerEmailsSent: 1,
      slackSent: true,
      errors: [],
    });
  });

  it("skips sending when no destinations are configured", async () => {
    hasEmailDeliveryConfiguredMock.mockReturnValue(false);
    process.env.FINANCE_ALERT_SLACK_WEBHOOK_URL = "";

    const result = await sendStripeFinanceAnomalyAlerts({
      start: "2026-03-01",
      end: "2026-03-10",
      sellers: [
        {
          userId: "seller-1",
          email: "seller-1@example.com",
          displayName: "Seller One",
          slug: "seller-one",
          paymentAnomalies: [
            {
              id: "payment-anomaly-1",
              code: "FULFILLMENT_WITHOUT_PAYMENT",
              severity: "high",
              orderId: "order-1",
              buyerEmail: "buyer@example.com",
              buyerName: "Buyer",
              title: "履约状态领先于支付状态",
              description: "订单已经进入履约流程，但支付侧仍是未成功状态。",
              suggestedAction: "暂停履约。",
              orderStatus: "SHIPPED",
              paymentStatus: "FAILED",
              paymentSessionId: "cs_1",
              paymentIntentId: "pi_1",
              createdAt: "2026-03-05T00:00:00.000Z",
            },
          ],
          settlementAnomalies: [],
        },
      ],
    });

    expect(hasStripeFinanceAlertDestinations()).toBe(false);
    expect(sendEmailMessageMock).not.toHaveBeenCalled();
    expect(sendSlackWebhookMessageMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      enabled: false,
      alertedUserCount: 1,
      paymentAnomalyCount: 1,
      settlementAnomalyCount: 0,
      sellerEmailsSent: 0,
      slackSent: false,
      errors: [],
    });
  });
});
