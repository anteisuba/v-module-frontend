import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createPublicOrderMock,
  attachStripePaymentSessionToOrderMock,
  cancelOpenOrderPaymentMock,
  getStripeCheckoutRoutingForUserMock,
  getStripeClientMock,
  getStripeCurrencyMock,
  getStripeIdMock,
  getStripePlatformFeeBpsMock,
  toStripeAmountMock,
  fromStripeAmountMock,
  sendOrderCreatedNotificationsMock,
  findUniqueMock,
  createSessionMock,
} = vi.hoisted(() => ({
  createPublicOrderMock: vi.fn(),
  attachStripePaymentSessionToOrderMock: vi.fn(),
  cancelOpenOrderPaymentMock: vi.fn(),
  getStripeCheckoutRoutingForUserMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  getStripeCurrencyMock: vi.fn(),
  getStripeIdMock: vi.fn(),
  getStripePlatformFeeBpsMock: vi.fn(),
  toStripeAmountMock: vi.fn(),
  fromStripeAmountMock: vi.fn(),
  sendOrderCreatedNotificationsMock: vi.fn(),
  findUniqueMock: vi.fn(),
  createSessionMock: vi.fn(),
}));

vi.mock("@/domain/shop/services", () => ({
  ORDER_PAYMENT_PROVIDER_STRIPE: "STRIPE",
  ORDER_PAYMENT_STATUS_EXPIRED: "EXPIRED",
  ORDER_PAYMENT_STATUS_FAILED: "FAILED",
  ORDER_PAYMENT_STATUS_OPEN: "OPEN",
  ORDER_PAYMENT_STATUS_PAID: "PAID",
  ORDER_PAYMENT_STATUS_PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  ORDER_PAYMENT_STATUS_REFUNDED: "REFUNDED",
  ORDER_REFUND_STATUS_CANCELED: "CANCELED",
  ORDER_REFUND_STATUS_FAILED: "FAILED",
  ORDER_REFUND_STATUS_PENDING: "PENDING",
  ORDER_REFUND_STATUS_SUCCEEDED: "SUCCEEDED",
  ORDER_WITH_ITEMS_QUERY: {},
  attachStripePaymentSessionToOrder: attachStripePaymentSessionToOrderMock,
  cancelOpenOrderPayment: cancelOpenOrderPaymentMock,
  cancelOpenOrderPaymentBySession: vi.fn(),
  createPublicOrder: createPublicOrderMock,
  getOrderWithItemsById: vi.fn(),
  markOrderPaidByPaymentSession: vi.fn(),
  serializeOrderWithItems: vi.fn(),
  syncOrderPaymentStatusFromRefunds: vi.fn(),
}));

vi.mock("@/domain/shop/payout-accounts", () => ({
  getStripeCheckoutRoutingForUser: getStripeCheckoutRoutingForUserMock,
}));

vi.mock("@/domain/shop/notifications", () => ({
  sendOrderCreatedNotifications: sendOrderCreatedNotificationsMock,
}));

vi.mock("@/lib/stripe", () => ({
  fromStripeAmount: fromStripeAmountMock,
  getStripeClient: getStripeClientMock,
  getStripeCurrency: getStripeCurrencyMock,
  getStripeId: getStripeIdMock,
  getStripePlatformFeeBps: getStripePlatformFeeBpsMock,
  toStripeAmount: toStripeAmountMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
    $transaction: vi.fn(),
    orderRefund: {
      update: vi.fn(),
    },
  },
}));

import { createStripeCheckout } from "@/domain/shop/payments";

describe("createStripeCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    findUniqueMock.mockResolvedValue({ slug: "creator" });
    getStripeCurrencyMock.mockReturnValue("jpy");
    getStripeIdMock.mockImplementation((value: string | null) => value);
    getStripePlatformFeeBpsMock.mockReturnValue(500);
    toStripeAmountMock.mockImplementation((amount: number) => amount);
    fromStripeAmountMock.mockImplementation((amount: number) => amount);
    getStripeClientMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createSessionMock,
        },
      },
    });
  });

  it("routes checkout through the seller connected account when available", async () => {
    const expectedBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    createPublicOrderMock.mockResolvedValue({
      id: "order-1",
      userId: "seller-1",
      buyerEmail: "buyer@example.com",
      totalAmount: 980,
      items: [
        {
          productId: "product-1",
          quantity: 1,
          price: 980,
          product: {
            name: "Voice pack",
          },
        },
      ],
    });
    getStripeCheckoutRoutingForUserMock.mockResolvedValue({
      payoutAccountId: "payout-1",
      connectedAccountId: "acct_test_123",
    });
    createSessionMock.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
      payment_intent: "pi_test_123",
      expires_at: 1770000000,
    });
    attachStripePaymentSessionToOrderMock.mockResolvedValue({
      id: "order-1",
    });

    const checkout = await createStripeCheckout({
      buyerEmail: "buyer@example.com",
      buyerName: null,
      shippingAddress: null,
      shippingMethod: null,
      items: [{ productId: "product-1", quantity: 1 }],
    });

    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: "order-1",
        success_url:
          `${expectedBaseUrl}/u/creator/shop/order-success/order-1?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${expectedBaseUrl}/u/creator/shop/product-1`,
        payment_intent_data: expect.objectContaining({
          transfer_data: {
            destination: "acct_test_123",
          },
          application_fee_amount: 49,
        }),
        metadata: expect.objectContaining({
          paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
          connectedAccountId: "acct_test_123",
        }),
      })
    );

    expect(attachStripePaymentSessionToOrderMock).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({
        sessionId: "cs_test_123",
        paymentIntentId: "pi_test_123",
        payoutAccountId: "payout-1",
        paymentRoutingMode: "STRIPE_CONNECT_DESTINATION",
        connectedAccountId: "acct_test_123",
        platformFeeAmount: 49,
        sellerGrossAmount: 980,
        sellerNetExpectedAmount: 931,
        applicationFeeAmount: 49,
      })
    );

    expect(checkout).toEqual({
      orderId: "order-1",
      provider: "STRIPE",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
      expiresAt: new Date(1770000000 * 1000).toISOString(),
    });
    expect(cancelOpenOrderPaymentMock).not.toHaveBeenCalled();
  });
});
