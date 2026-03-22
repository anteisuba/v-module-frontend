import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isStripeConfiguredMock,
  getStripeClientMock,
  findManyMock,
  updateMock,
  findUniqueMock,
  retrieveMock,
  listExternalAccountsMock,
} = vi.hoisted(() => ({
  isStripeConfiguredMock: vi.fn(),
  getStripeClientMock: vi.fn(),
  findManyMock: vi.fn(),
  updateMock: vi.fn(),
  findUniqueMock: vi.fn(),
  retrieveMock: vi.fn(),
  listExternalAccountsMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: isStripeConfiguredMock,
  getStripeClient: getStripeClientMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sellerPayoutAccount: {
      findMany: findManyMock,
      update: updateMock,
    },
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { checkConnectAccountHealth } from "@/domain/shop/payout-accounts";

function createLocalAccount(overrides?: Record<string, unknown>) {
  return {
    id: "spa-1",
    userId: "user-1",
    providerAccountId: "acct_test_1",
    status: "ACTIVE",
    accountType: "EXPRESS",
    country: "JP",
    defaultCurrency: "JPY",
    displayNameSnapshot: "Creator",
    onboardingCompletedAt: new Date("2026-03-10T00:00:00Z"),
    chargesEnabled: true,
    payoutsEnabled: true,
    requirementsPastDue: [],
    requirementsCurrentlyDue: [],
    ...overrides,
  };
}

function createRemoteAccount(overrides?: Record<string, unknown>) {
  return {
    id: "acct_test_1",
    charges_enabled: true,
    payouts_enabled: true,
    details_submitted: true,
    type: "express",
    country: "JP",
    default_currency: "jpy",
    business_type: "individual",
    requirements: {
      currently_due: [],
      eventually_due: [],
      past_due: [],
      disabled_reason: null,
    },
    ...overrides,
  };
}

describe("checkConnectAccountHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    getStripeClientMock.mockReturnValue({
      accounts: {
        retrieve: retrieveMock,
        listExternalAccounts: listExternalAccountsMock,
      },
    });

    findUniqueMock.mockResolvedValue({
      id: "user-1",
      displayName: "Creator",
    });

    updateMock.mockResolvedValue({});
    listExternalAccountsMock.mockResolvedValue({ data: [] });
  });

  it("returns empty result when Stripe is not configured", async () => {
    isStripeConfiguredMock.mockReturnValue(false);

    const result = await checkConnectAccountHealth();

    expect(result).toEqual({
      checked: 0,
      drifted: 0,
      resynced: 0,
      errors: 0,
      accounts: [],
    });
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns checked=0 when no accounts exist", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([]);

    const result = await checkConnectAccountHealth();

    expect(result.checked).toBe(0);
    expect(result.accounts).toEqual([]);
  });

  it("reports all accounts in sync with no drift", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([createLocalAccount()]);
    retrieveMock.mockResolvedValue(createRemoteAccount());

    const result = await checkConnectAccountHealth();

    expect(result.checked).toBe(1);
    expect(result.drifted).toBe(0);
    expect(result.accounts[0].drifted).toBe(false);
    expect(result.accounts[0].diagnostic).toEqual({
      chargesEnabled: null,
      payoutsEnabled: null,
      requirementsAttention: [],
    });
  });

  it("detects status drift between local and remote", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ status: "PENDING", chargesEnabled: false, payoutsEnabled: false }),
    ]);
    retrieveMock.mockResolvedValue(createRemoteAccount());

    const result = await checkConnectAccountHealth({ autoResync: false });

    expect(result.drifted).toBe(1);
    expect(result.resynced).toBe(0);
    expect(result.accounts[0]).toMatchObject({
      localStatus: "PENDING",
      remoteStatus: "ACTIVE",
      drifted: true,
      resynced: false,
    });
  });

  it("auto-resyncs drifted accounts when autoResync is true", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ status: "PENDING", chargesEnabled: false, payoutsEnabled: false }),
    ]);
    retrieveMock.mockResolvedValue(createRemoteAccount());

    const result = await checkConnectAccountHealth({ autoResync: true });

    expect(result.drifted).toBe(1);
    expect(result.resynced).toBe(1);
    expect(result.accounts[0].resynced).toBe(true);
    expect(updateMock).toHaveBeenCalled();
  });

  it("does not resync when autoResync is false", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ status: "PENDING", chargesEnabled: false, payoutsEnabled: false }),
    ]);
    retrieveMock.mockResolvedValue(createRemoteAccount());

    await checkConnectAccountHealth({ autoResync: false });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("records capability changes in diagnostic", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ chargesEnabled: true, payoutsEnabled: true }),
    ]);
    retrieveMock.mockResolvedValue(
      createRemoteAccount({
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: ["individual.verification.document"],
          disabled_reason: "requirements.past_due",
        },
      })
    );

    const result = await checkConnectAccountHealth({ autoResync: false });

    const diag = result.accounts[0].diagnostic;
    expect(diag?.chargesEnabled).toEqual({ local: true, remote: false });
    expect(diag?.payoutsEnabled).toEqual({ local: true, remote: false });
    expect(diag?.requirementsAttention).toContain(
      "individual.verification.document"
    );
  });

  it("includes past_due and currently_due in requirementsAttention", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([createLocalAccount()]);
    retrieveMock.mockResolvedValue(
      createRemoteAccount({
        requirements: {
          currently_due: ["individual.email"],
          eventually_due: ["company.tax_id"],
          past_due: ["individual.verification.document"],
          disabled_reason: null,
        },
      })
    );

    const result = await checkConnectAccountHealth({ autoResync: false });

    const attention = result.accounts[0].diagnostic?.requirementsAttention;
    expect(attention).toContain("individual.verification.document");
    expect(attention).toContain("individual.email");
    expect(attention).not.toContain("company.tax_id");
  });

  it("handles Stripe API errors without stopping other accounts", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ providerAccountId: "acct_ok" }),
      createLocalAccount({
        id: "spa-2",
        userId: "user-2",
        providerAccountId: "acct_fail",
      }),
    ]);
    retrieveMock
      .mockResolvedValueOnce(createRemoteAccount({ id: "acct_ok" }))
      .mockRejectedValueOnce(new Error("No such account: acct_fail"));

    const result = await checkConnectAccountHealth({ autoResync: false });

    expect(result.checked).toBe(2);
    expect(result.errors).toBe(1);

    const okEntry = result.accounts.find(
      (a) => a.providerAccountId === "acct_ok"
    );
    expect(okEntry?.error).toBeNull();

    const failEntry = result.accounts.find(
      (a) => a.providerAccountId === "acct_fail"
    );
    expect(failEntry?.error).toBe("No such account: acct_fail");
    expect(failEntry?.remoteStatus).toBe("UNKNOWN");
    expect(failEntry?.diagnostic).toBeNull();
  });

  it("logs capability changes to console.warn", async () => {
    isStripeConfiguredMock.mockReturnValue(true);
    findManyMock.mockResolvedValue([
      createLocalAccount({ chargesEnabled: true, payoutsEnabled: true }),
    ]);
    retrieveMock.mockResolvedValue(
      createRemoteAccount({
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          eventually_due: [],
          past_due: ["company.tax_id"],
          disabled_reason: "requirements.past_due",
        },
      })
    );

    await checkConnectAccountHealth({ autoResync: false });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("chargesEnabled: true→false")
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("payoutsEnabled: true→false")
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("pastDue=[company.tax_id]")
    );
  });
});
