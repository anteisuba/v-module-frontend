import { expect, test } from "@playwright/test";
import {
  bootstrapAdminE2E,
  fulfillJson,
  mockCurrentUser,
} from "./utils/admin";

function createPayoutAccountSummary(overrides?: Record<string, unknown>) {
  return {
    id: "payout-1",
    provider: "STRIPE",
    providerAccountId: "acct_test_123",
    status: "ACTIVE",
    accountType: "EXPRESS",
    country: "JP",
    defaultCurrency: "JPY",
    businessType: "individual",
    displayNameSnapshot: "Creator",
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    requirementsCurrentlyDue: [],
    requirementsEventuallyDue: [],
    requirementsPastDue: [],
    disabledReason: null,
    bankNameMasked: "MUFG",
    bankLast4Masked: "4242",
    onboardingStartedAt: "2026-03-11T00:00:00.000Z",
    onboardingCompletedAt: "2026-03-11T00:10:00.000Z",
    lastSyncedAt: "2026-03-11T00:10:00.000Z",
    disconnectedAt: null,
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:10:00.000Z",
    ...overrides,
  };
}

test.beforeEach(async ({ context, page }) => {
  await bootstrapAdminE2E(context, page);
  await mockCurrentUser(page);
});

test("syncs payout account state when returning from Stripe onboarding", async ({
  page,
}) => {
  let syncCalls = 0;

  await page.route("**/api/payments/connect/accounts/sync", async (route) => {
    syncCalls += 1;
    await fulfillJson(route, {
      account: createPayoutAccountSummary(),
    });
  });

  await page.route("**/api/payments/connect/accounts/me", async (route) => {
    await fulfillJson(route, {
      account: createPayoutAccountSummary(),
    });
  });

  await page.goto("/admin/settings/payouts?connect=return");

  await expect(page.getByTestId("admin-payout-settings-page")).toBeVisible();
  await expect.poll(() => syncCalls).toBe(1);
  await expect(page.getByText("已从 Stripe 返回，当前状态已重新同步。")).toBeVisible();
  await expect(page.getByTestId("payout-status-badge")).toHaveText("已启用");
});
