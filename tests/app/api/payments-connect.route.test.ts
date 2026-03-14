import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  getSellerPayoutAccountForUserMock,
  ensureStripePayoutAccountForUserMock,
  syncStripePayoutAccountForUserMock,
  createStripePayoutOnboardingLinkMock,
  createStripePayoutDashboardLinkMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getSellerPayoutAccountForUserMock: vi.fn(),
  ensureStripePayoutAccountForUserMock: vi.fn(),
  syncStripePayoutAccountForUserMock: vi.fn(),
  createStripePayoutOnboardingLinkMock: vi.fn(),
  createStripePayoutDashboardLinkMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop", () => ({
  getSellerPayoutAccountForUser: getSellerPayoutAccountForUserMock,
  ensureStripePayoutAccountForUser: ensureStripePayoutAccountForUserMock,
  syncStripePayoutAccountForUser: syncStripePayoutAccountForUserMock,
  createStripePayoutOnboardingLink: createStripePayoutOnboardingLinkMock,
  createStripePayoutDashboardLink: createStripePayoutDashboardLinkMock,
}));

import { GET as getMyAccount } from "@/app/api/payments/connect/accounts/me/route";
import { POST as createAccount } from "@/app/api/payments/connect/accounts/route";
import { POST as syncAccount } from "@/app/api/payments/connect/accounts/sync/route";
import {
  GET as getOnboardingLinkRedirect,
  POST as createOnboardingLink,
} from "@/app/api/payments/connect/accounts/onboarding-link/route";
import { POST as createDashboardLink } from "@/app/api/payments/connect/accounts/dashboard-link/route";

function createAccountSummary() {
  return {
    id: "payout-1",
    provider: "STRIPE",
    providerAccountId: "acct_test_123",
    status: "PENDING",
    accountType: "EXPRESS",
    country: "JP",
    defaultCurrency: "JPY",
    businessType: "individual",
    displayNameSnapshot: "Creator",
    detailsSubmitted: true,
    chargesEnabled: false,
    payoutsEnabled: false,
    requirementsCurrentlyDue: ["individual.verification.document"],
    requirementsEventuallyDue: [],
    requirementsPastDue: [],
    disabledReason: null,
    bankNameMasked: null,
    bankLast4Masked: null,
    onboardingStartedAt: "2026-03-11T00:00:00.000Z",
    onboardingCompletedAt: null,
    lastSyncedAt: "2026-03-11T00:00:00.000Z",
    disconnectedAt: null,
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  };
}

describe("payments connect routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated payout account read", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await getMyAccount(
      new Request("http://localhost/api/payments/connect/accounts/me")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the current seller payout account", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    getSellerPayoutAccountForUserMock.mockResolvedValue(createAccountSummary());

    const response = await getMyAccount(
      new Request("http://localhost/api/payments/connect/accounts/me")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      account: createAccountSummary(),
    });
    expect(getSellerPayoutAccountForUserMock).toHaveBeenCalledWith("seller-1");
  });

  it("creates a Stripe payout account for the current seller", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    ensureStripePayoutAccountForUserMock.mockResolvedValue(createAccountSummary());

    const response = await createAccount(
      new Request("http://localhost/api/payments/connect/accounts", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      account: createAccountSummary(),
    });
  });

  it("syncs the seller payout account", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    syncStripePayoutAccountForUserMock.mockResolvedValue({
      ...createAccountSummary(),
      status: "ACTIVE",
      chargesEnabled: true,
      payoutsEnabled: true,
    });

    const response = await syncAccount(
      new Request("http://localhost/api/payments/connect/accounts/sync", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      account: {
        ...createAccountSummary(),
        status: "ACTIVE",
        chargesEnabled: true,
        payoutsEnabled: true,
      },
    });
  });

  it("returns an onboarding link payload", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    createStripePayoutOnboardingLinkMock.mockResolvedValue({
      account: createAccountSummary(),
      url: "https://connect.stripe.com/setup/s/test",
      expiresAt: "2026-03-11T01:00:00.000Z",
    });

    const response = await createOnboardingLink(
      new Request("http://localhost/api/payments/connect/accounts/onboarding-link", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      account: createAccountSummary(),
      url: "https://connect.stripe.com/setup/s/test",
      expiresAt: "2026-03-11T01:00:00.000Z",
    });
  });

  it("redirects to the onboarding link for refresh flows", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    createStripePayoutOnboardingLinkMock.mockResolvedValue({
      account: createAccountSummary(),
      url: "https://connect.stripe.com/setup/s/test",
      expiresAt: "2026-03-11T01:00:00.000Z",
    });

    const response = await getOnboardingLinkRedirect(
      new Request("http://localhost/api/payments/connect/accounts/onboarding-link")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://connect.stripe.com/setup/s/test"
    );
  });

  it("returns a Stripe dashboard login link", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    createStripePayoutDashboardLinkMock.mockResolvedValue({
      account: {
        ...createAccountSummary(),
        status: "ACTIVE",
      },
      url: "https://connect.stripe.com/express/test",
    });

    const response = await createDashboardLink(
      new Request("http://localhost/api/payments/connect/accounts/dashboard-link", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      account: {
        ...createAccountSummary(),
        status: "ACTIVE",
      },
      url: "https://connect.stripe.com/express/test",
    });
  });

  it("maps missing payout account to 404", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    createStripePayoutDashboardLinkMock.mockRejectedValue(
      new Error("No Stripe payout account found")
    );

    const response = await createDashboardLink(
      new Request("http://localhost/api/payments/connect/accounts/dashboard-link", {
        method: "POST",
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No Stripe payout account found",
    });
  });

  it("surfaces Stripe validation errors as 400 responses", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    const stripeError = Object.assign(
      new Error("You cannot create Express accounts for this platform"),
      {
        type: "StripeInvalidRequestError",
        statusCode: 400,
      }
    );
    createStripePayoutOnboardingLinkMock.mockRejectedValue(stripeError);

    const response = await createOnboardingLink(
      new Request("http://localhost/api/payments/connect/accounts/onboarding-link", {
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "You cannot create Express accounts for this platform",
    });
  });
});
