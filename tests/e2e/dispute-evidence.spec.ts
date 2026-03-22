import { expect, test } from "@playwright/test";
import {
  bootstrapAdminE2E,
  createSerializedOrder,
  fulfillJson,
  mockCurrentUser,
} from "./utils/admin";

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("opens dispute evidence form, fills text, and saves draft", async ({
  page,
}) => {
  let evidenceSubmitted = false;

  const orderWithDispute = createSerializedOrder({
    id: "order-dispute-1",
    totalAmount: 8000,
    disputes: [
      {
        id: "dispute-local-1",
        userId: "user-1",
        orderId: "order-dispute-1",
        provider: "STRIPE",
        status: "needs_response",
        reason: "fraudulent",
        amount: 8000,
        currency: "JPY",
        externalDisputeId: "dp_test_abc",
        externalPaymentIntentId: "pi_test_123",
        externalChargeId: "ch_test_123",
        connectedAccountId: null,
        externalTransferReversalId: null,
        dueBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: null,
        metadata: null,
        createdAt: "2026-03-10T00:00:00.000Z",
        updatedAt: "2026-03-10T00:00:00.000Z",
      },
    ],
  });

  // Mock order detail API
  await page.route("**/api/shop/orders/order-dispute-1", async (route) => {
    await fulfillJson(route, orderWithDispute);
  });

  // Mock evidence submission API
  await page.route("**/api/shop/disputes/dp_test_abc/evidence", async (route) => {
    evidenceSubmitted = true;
    await fulfillJson(route, {
      dispute: {
        ...orderWithDispute.disputes[0],
        status: "needs_response",
      },
      submitted: false,
    });
  });

  await page.goto("/admin/orders/order-dispute-1");
  await page.waitForSelector('[data-testid="dispute-evidence-open"]');

  // Verify dispute card shows
  await expect(page.getByText("争议待响应")).toBeVisible();
  await expect(page.getByText("dp_test_abc")).toBeVisible();

  // Open evidence form
  await page.getByTestId("dispute-evidence-open").click();
  await expect(page.getByTestId("dispute-evidence-form")).toBeVisible();

  // Fill in text evidence
  await page.getByTestId("evidence-uncategorized_text").fill("This transaction was authorized by the customer.");

  // Save draft
  await page.getByTestId("evidence-save-draft").click();

  // Verify API was called
  await page.waitForTimeout(1000);
  expect(evidenceSubmitted).toBe(true);
});
