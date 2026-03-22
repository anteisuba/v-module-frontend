import { expect, test, type Route } from "@playwright/test";
import {
  bootstrapAdminE2E,
  createSerializedOrder,
  fulfillJson,
  mockCurrentUser,
} from "./utils/admin";

type RefundRequest = {
  amount: number;
  reason: string | null;
};

function readRequestBody(route: Route): Record<string, unknown> {
  const body = route.request().postDataJSON();
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("opens order detail from admin list and submits a partial refund", async ({
  page,
}) => {
  const refundRequests: RefundRequest[] = [];
  let currentOrder = createSerializedOrder({
    id: "order-e2e-1",
    totalAmount: 5200,
    paymentRoutingMode: "PLATFORM",
    connectedAccountId: null,
    platformFeeAmount: null,
    sellerGrossAmount: null,
    sellerNetExpectedAmount: null,
    refundableAmount: 5200,
    items: [
      {
        id: "item-1",
        orderId: "order-e2e-1",
        productId: "product-1",
        quantity: 1,
        price: 5200,
        subtotal: 5200,
        createdAt: "2026-03-10T00:00:00.000Z",
        product: {
          id: "product-1",
          name: "Spring live Blu-ray",
          images: ["/hero/2.jpeg"],
        },
      },
    ],
    paymentAttempts: [
      {
        id: "attempt-1",
        orderId: "order-e2e-1",
        provider: "STRIPE",
        status: "PAID",
        amount: 5200,
        currency: "JPY",
        connectedAccountId: null,
        externalChargeId: "ch_test_order_e2e",
        externalTransferId: null,
        applicationFeeAmount: null,
        externalSessionId: "cs_test_order_e2e",
        externalPaymentIntentId: "pi_test_order_e2e",
        failureReason: null,
        metadata: null,
        createdAt: "2026-03-10T00:00:00.000Z",
        updatedAt: "2026-03-10T00:10:00.000Z",
        paidAt: "2026-03-10T00:10:00.000Z",
        failedAt: null,
        expiredAt: null,
      },
    ],
  });

  await page.route("**/api/shop/orders?*", async (route) => {
    await fulfillJson(route, {
      orders: [currentOrder],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
      },
    });
  });

  await page.route("**/api/shop/orders/order-e2e-1/refunds", async (route) => {
    const body = readRequestBody(route) as RefundRequest;
    refundRequests.push(body);

    const refund = {
      id: "refund-1",
      orderId: "order-e2e-1",
      provider: "STRIPE",
      status: "SUCCEEDED",
      amount: body.amount,
      currency: "JPY",
      reason: body.reason,
      failureReason: null,
      externalRefundId: "re_test_order_e2e",
      externalPaymentIntentId: "pi_test_order_e2e",
      requestedByUserId: "user-1",
      metadata: null,
      createdAt: "2026-03-10T01:00:00.000Z",
      updatedAt: "2026-03-10T01:00:30.000Z",
      refundedAt: "2026-03-10T01:00:30.000Z",
    };

    currentOrder = {
      ...currentOrder,
      paymentStatus: "PARTIALLY_REFUNDED",
      refundedAmount: body.amount,
      refundableAmount: currentOrder.totalAmount - body.amount,
      refunds: [refund],
    };

    await fulfillJson(route, {
      order: currentOrder,
      refund,
    });
  });

  await page.route("**/api/shop/orders/order-e2e-1", async (route) => {
    await fulfillJson(route, {
      order: currentOrder,
    });
  });

  await page.goto("/admin/orders");

  await expect(page.getByTestId("admin-orders-page")).toBeVisible();
  await expect(
    page.getByTestId("admin-order-card-order-e2e-1")
  ).toContainText("Spring live Blu-ray");

  await page.getByTestId("admin-order-view-order-e2e-1").click();

  await expect(page).toHaveURL(/\/admin\/orders\/order-e2e-1$/, { timeout: 10_000 });
  await expect(page.getByTestId("admin-order-detail-page")).toBeVisible();
  await expect(page.getByText("平台统一收款 fallback")).toBeVisible();
  await expect(page.getByText("平台统一收款").first()).toBeVisible();

  await page.getByTestId("order-refund-amount").fill("1200");
  await page.getByTestId("order-refund-reason").fill("买家取消部分商品");
  await page.getByTestId("order-refund-submit").click();

  await expect.poll(() => refundRequests.length).toBe(1);
  expect(refundRequests[0]).toEqual({
    amount: 1200,
    reason: "买家取消部分商品",
  });

  await expect(page.getByText("部分退款").first()).toBeVisible();
  await expect(page.getByText("买家取消部分商品").first()).toBeVisible();
  await expect(
    page.getByLabel("通知").getByText("退款已提交并完成")
  ).toBeVisible();
});
