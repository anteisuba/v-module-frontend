import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

export const PAYOUT_PROVIDER_STRIPE = "STRIPE";

export const SELLER_PAYOUT_ACCOUNT_STATUS_NOT_STARTED = "NOT_STARTED";
export const SELLER_PAYOUT_ACCOUNT_STATUS_PENDING = "PENDING";
export const SELLER_PAYOUT_ACCOUNT_STATUS_RESTRICTED = "RESTRICTED";
export const SELLER_PAYOUT_ACCOUNT_STATUS_ACTIVE = "ACTIVE";
export const SELLER_PAYOUT_ACCOUNT_STATUS_DISCONNECTED = "DISCONNECTED";

export interface SerializedSellerPayoutAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  status: string;
  accountType: string;
  country: string | null;
  defaultCurrency: string | null;
  businessType: string | null;
  displayNameSnapshot: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: string[];
  requirementsEventuallyDue: string[];
  requirementsPastDue: string[];
  disabledReason: string | null;
  bankNameMasked: string | null;
  bankLast4Masked: string | null;
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
  lastSyncedAt: string | null;
  disconnectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StripeCheckoutRouting {
  payoutAccountId: string;
  connectedAccountId: string;
}

interface StripeExternalBankSummary {
  bankNameMasked: string | null;
  bankLast4Masked: string | null;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

function getConnectDefaultCountry() {
  return (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY || "JP").trim().toUpperCase();
}

function getConnectAllowedCountries() {
  const raw = process.env.STRIPE_CONNECT_COUNTRY_ALLOWLIST?.trim();
  if (!raw) {
    return null;
  }

  const values = raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  return values.length > 0 ? new Set(values) : null;
}

function assertConnectCountryAllowed(country: string) {
  const allowlist = getConnectAllowedCountries();

  if (allowlist && !allowlist.has(country)) {
    throw new Error(`Stripe Connect is not enabled for ${country}`);
  }
}

function toIsoStringOrNull(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toNullableJsonArray(value: string[] | null) {
  return value == null ? Prisma.JsonNull : value;
}

function deriveStripeAccountStatus(account: Stripe.Account | Stripe.DeletedAccount) {
  if ("deleted" in account && account.deleted) {
    return SELLER_PAYOUT_ACCOUNT_STATUS_DISCONNECTED;
  }

  const requirements = account.requirements;
  const pastDue = requirements?.past_due || [];
  const currentlyDue = requirements?.currently_due || [];
  const eventuallyDue = requirements?.eventually_due || [];
  const disabledReason = requirements?.disabled_reason || null;

  if (account.charges_enabled && account.payouts_enabled) {
    return SELLER_PAYOUT_ACCOUNT_STATUS_ACTIVE;
  }

  if (disabledReason || pastDue.length > 0) {
    return SELLER_PAYOUT_ACCOUNT_STATUS_RESTRICTED;
  }

  if (account.details_submitted || currentlyDue.length > 0 || eventuallyDue.length > 0) {
    return SELLER_PAYOUT_ACCOUNT_STATUS_PENDING;
  }

  return SELLER_PAYOUT_ACCOUNT_STATUS_NOT_STARTED;
}

function serializeSellerPayoutAccount(record: {
  id: string;
  provider: string;
  providerAccountId: string;
  status: string;
  accountType: string;
  country: string | null;
  defaultCurrency: string | null;
  businessType: string | null;
  displayNameSnapshot: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: unknown;
  requirementsEventuallyDue: unknown;
  requirementsPastDue: unknown;
  disabledReason: string | null;
  bankNameMasked: string | null;
  bankLast4Masked: string | null;
  onboardingStartedAt: Date | null;
  onboardingCompletedAt: Date | null;
  lastSyncedAt: Date | null;
  disconnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializedSellerPayoutAccount {
  return {
    id: record.id,
    provider: record.provider,
    providerAccountId: record.providerAccountId,
    status: record.status,
    accountType: record.accountType,
    country: record.country,
    defaultCurrency: record.defaultCurrency,
    businessType: record.businessType,
    displayNameSnapshot: record.displayNameSnapshot,
    detailsSubmitted: record.detailsSubmitted,
    chargesEnabled: record.chargesEnabled,
    payoutsEnabled: record.payoutsEnabled,
    requirementsCurrentlyDue: readStringArray(record.requirementsCurrentlyDue),
    requirementsEventuallyDue: readStringArray(record.requirementsEventuallyDue),
    requirementsPastDue: readStringArray(record.requirementsPastDue),
    disabledReason: record.disabledReason,
    bankNameMasked: record.bankNameMasked,
    bankLast4Masked: record.bankLast4Masked,
    onboardingStartedAt: toIsoStringOrNull(record.onboardingStartedAt),
    onboardingCompletedAt: toIsoStringOrNull(record.onboardingCompletedAt),
    lastSyncedAt: toIsoStringOrNull(record.lastSyncedAt),
    disconnectedAt: toIsoStringOrNull(record.disconnectedAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getUserForPayoutAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      slug: true,
      email: true,
      displayName: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function getStripeExternalBankSummary(
  connectedAccountId: string
): Promise<StripeExternalBankSummary> {
  try {
    const stripe = getStripeClient();
    const externalAccounts = await stripe.accounts.listExternalAccounts(
      connectedAccountId,
      {
        object: "bank_account",
        limit: 5,
      }
    );

    const bankAccounts = externalAccounts.data.filter(
      (entry): entry is Stripe.BankAccount => entry.object === "bank_account"
    );
    const primaryBankAccount =
      bankAccounts.find((entry) => entry.default_for_currency) || bankAccounts[0] || null;

    return {
      bankNameMasked: primaryBankAccount?.bank_name || null,
      bankLast4Masked: primaryBankAccount?.last4 || null,
    };
  } catch {
    return {
      bankNameMasked: null,
      bankLast4Masked: null,
    };
  }
}

function buildOnboardingReturnUrl() {
  return `${getBaseUrl()}/admin/settings/payouts?connect=return`;
}

function buildOnboardingRefreshUrl() {
  return `${getBaseUrl()}/api/payments/connect/accounts/onboarding-link`;
}

export async function getSellerPayoutAccountForUser(userId: string) {
  const record = await prisma.sellerPayoutAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PAYOUT_PROVIDER_STRIPE,
      },
    },
  });

  return record ? serializeSellerPayoutAccount(record) : null;
}

export async function getStripeCheckoutRoutingForUser(
  userId: string
): Promise<StripeCheckoutRouting | null> {
  const record = await prisma.sellerPayoutAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PAYOUT_PROVIDER_STRIPE,
      },
    },
    select: {
      id: true,
      providerAccountId: true,
      status: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });

  if (
    !record ||
    record.status === SELLER_PAYOUT_ACCOUNT_STATUS_DISCONNECTED ||
    !record.chargesEnabled ||
    !record.payoutsEnabled
  ) {
    return null;
  }

  return {
    payoutAccountId: record.id,
    connectedAccountId: record.providerAccountId,
  };
}

async function updateStripePayoutAccountRecord(
  existing: {
    id: string;
    userId: string;
    accountType: string;
    country: string | null;
    defaultCurrency: string | null;
    displayNameSnapshot: string | null;
    onboardingCompletedAt: Date | null;
  },
  account: Stripe.Account | Stripe.DeletedAccount
) {
  const user = await getUserForPayoutAccount(existing.userId);
  const bankSummary =
    "deleted" in account && account.deleted
      ? {
          bankNameMasked: null,
          bankLast4Masked: null,
        }
      : await getStripeExternalBankSummary(account.id);

  return prisma.sellerPayoutAccount.update({
    where: { id: existing.id },
    data: {
      providerAccountId: account.id,
      status: deriveStripeAccountStatus(account),
      accountType:
        "deleted" in account && account.deleted
          ? existing.accountType
          : account.type?.toUpperCase() || existing.accountType,
      country:
        "deleted" in account && account.deleted
          ? existing.country
          : account.country || null,
      defaultCurrency:
        "deleted" in account && account.deleted
          ? existing.defaultCurrency
          : account.default_currency?.toUpperCase() || null,
      businessType:
        "deleted" in account && account.deleted
          ? null
          : account.business_type || null,
      displayNameSnapshot: user.displayName || existing.displayNameSnapshot,
      detailsSubmitted:
        "deleted" in account && account.deleted ? false : account.details_submitted,
      chargesEnabled:
        "deleted" in account && account.deleted ? false : account.charges_enabled,
      payoutsEnabled:
        "deleted" in account && account.deleted ? false : account.payouts_enabled,
      requirementsCurrentlyDue: toNullableJsonArray(
        "deleted" in account && account.deleted
          ? null
          : account.requirements?.currently_due || null
      ),
      requirementsEventuallyDue: toNullableJsonArray(
        "deleted" in account && account.deleted
          ? null
          : account.requirements?.eventually_due || null
      ),
      requirementsPastDue: toNullableJsonArray(
        "deleted" in account && account.deleted
          ? null
          : account.requirements?.past_due || null
      ),
      disabledReason:
        "deleted" in account && account.deleted
          ? "account_deleted"
          : account.requirements?.disabled_reason || null,
      bankNameMasked: bankSummary.bankNameMasked,
      bankLast4Masked: bankSummary.bankLast4Masked,
      onboardingCompletedAt:
        "deleted" in account && account.deleted
          ? existing.onboardingCompletedAt
          : account.charges_enabled && account.payouts_enabled
            ? existing.onboardingCompletedAt || new Date()
            : existing.onboardingCompletedAt,
      lastSyncedAt: new Date(),
      disconnectedAt:
        "deleted" in account && account.deleted ? new Date() : null,
    },
  });
}

export async function ensureStripePayoutAccountForUser(userId: string) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe Checkout is not configured");
  }

  const existing = await prisma.sellerPayoutAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PAYOUT_PROVIDER_STRIPE,
      },
    },
  });

  if (existing) {
    return serializeSellerPayoutAccount(existing);
  }

  const stripe = getStripeClient();
  const user = await getUserForPayoutAccount(userId);
  const country = getConnectDefaultCountry();
  assertConnectCountryAllowed(country);

  const account = await stripe.accounts.create({
    type: "express",
    country,
    email: user.email,
    metadata: {
      userId: user.id,
      userSlug: user.slug,
      displayName: user.displayName || "",
    },
    capabilities: {
      card_payments: {
        requested: true,
      },
      transfers: {
        requested: true,
      },
    },
  });

  const record = await prisma.sellerPayoutAccount.create({
    data: {
      userId,
      provider: PAYOUT_PROVIDER_STRIPE,
      providerAccountId: account.id,
      status: deriveStripeAccountStatus(account),
      accountType: account.type?.toUpperCase() || "STRIPE_EXPRESS",
      country: account.country || null,
      defaultCurrency: account.default_currency?.toUpperCase() || null,
      businessType: account.business_type || null,
      displayNameSnapshot: user.displayName || null,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirementsCurrentlyDue: toNullableJsonArray(
        account.requirements?.currently_due || null
      ),
      requirementsEventuallyDue: toNullableJsonArray(
        account.requirements?.eventually_due || null
      ),
      requirementsPastDue: toNullableJsonArray(account.requirements?.past_due || null),
      disabledReason: account.requirements?.disabled_reason || null,
      onboardingStartedAt: new Date(),
      lastSyncedAt: new Date(),
      onboardingCompletedAt:
        account.charges_enabled && account.payouts_enabled ? new Date() : null,
    },
  });

  return serializeSellerPayoutAccount(record);
}

export async function syncStripePayoutAccountForUser(userId: string) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe Checkout is not configured");
  }

  const existing = await prisma.sellerPayoutAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PAYOUT_PROVIDER_STRIPE,
      },
    },
  });

  if (!existing) {
    return null;
  }

  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(existing.providerAccountId);
  const record = await updateStripePayoutAccountRecord(existing, account);

  return serializeSellerPayoutAccount(record);
}

export async function syncStripePayoutAccountByConnectedAccountId(
  connectedAccountId: string,
  inputAccount?: Stripe.Account | Stripe.DeletedAccount
) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe Checkout is not configured");
  }

  const existing = await prisma.sellerPayoutAccount.findUnique({
    where: {
      providerAccountId: connectedAccountId,
    },
    select: {
      id: true,
      userId: true,
      accountType: true,
      country: true,
      defaultCurrency: true,
      displayNameSnapshot: true,
      onboardingCompletedAt: true,
    },
  });

  if (!existing) {
    return null;
  }

  const account =
    inputAccount || (await getStripeClient().accounts.retrieve(connectedAccountId));
  const record = await updateStripePayoutAccountRecord(existing, account);

  return serializeSellerPayoutAccount(record);
}

export async function createStripePayoutOnboardingLink(userId: string) {
  const account = await ensureStripePayoutAccountForUser(userId);
  const stripe = getStripeClient();
  const link = await stripe.accountLinks.create({
    account: account.providerAccountId,
    refresh_url: buildOnboardingRefreshUrl(),
    return_url: buildOnboardingReturnUrl(),
    type: "account_onboarding",
  });

  return {
    account,
    url: link.url,
    expiresAt: link.expires_at ? new Date(link.expires_at * 1000).toISOString() : null,
  };
}

export async function createStripePayoutDashboardLink(userId: string) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe Checkout is not configured");
  }

  const account = await prisma.sellerPayoutAccount.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: PAYOUT_PROVIDER_STRIPE,
      },
    },
  });

  if (!account) {
    throw new Error("No Stripe payout account found");
  }

  const stripe = getStripeClient();
  const loginLink = await stripe.accounts.createLoginLink(account.providerAccountId);

  return {
    account: serializeSellerPayoutAccount(account),
    url: loginLink.url,
  };
}

// ---------------------------------------------------------------------------
// Connect 账户健康检查：对比本地状态与 Stripe 远端状态
// ---------------------------------------------------------------------------

export interface ConnectAccountHealthDiagnostic {
  chargesEnabled: { local: boolean; remote: boolean } | null;
  payoutsEnabled: { local: boolean; remote: boolean } | null;
  requirementsAttention: string[];
}

export interface ConnectAccountHealthEntry {
  providerAccountId: string;
  userId: string;
  localStatus: string;
  remoteStatus: string;
  drifted: boolean;
  resynced: boolean;
  error: string | null;
  diagnostic: ConnectAccountHealthDiagnostic | null;
}

export interface ConnectAccountHealthResult {
  checked: number;
  drifted: number;
  resynced: number;
  errors: number;
  accounts: ConnectAccountHealthEntry[];
}

/**
 * 检查所有非 DISCONNECTED 的 Connect 账户，对比 Stripe 远端状态。
 * 如果 autoResync 为 true，自动将漂移的账户同步到最新状态。
 */
export async function checkConnectAccountHealth(options?: {
  autoResync?: boolean;
}): Promise<ConnectAccountHealthResult> {
  const autoResync = options?.autoResync ?? true;

  if (!isStripeConfigured()) {
    return { checked: 0, drifted: 0, resynced: 0, errors: 0, accounts: [] };
  }

  const accounts = await prisma.sellerPayoutAccount.findMany({
    where: {
      provider: PAYOUT_PROVIDER_STRIPE,
      status: { not: SELLER_PAYOUT_ACCOUNT_STATUS_DISCONNECTED },
    },
    select: {
      id: true,
      userId: true,
      providerAccountId: true,
      status: true,
      accountType: true,
      country: true,
      defaultCurrency: true,
      displayNameSnapshot: true,
      onboardingCompletedAt: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      requirementsPastDue: true,
      requirementsCurrentlyDue: true,
    },
  });

  const stripe = getStripeClient();
  const entries: ConnectAccountHealthEntry[] = [];
  let drifted = 0;
  let resynced = 0;
  let errors = 0;

  for (const local of accounts) {
    try {
      const remote = await stripe.accounts.retrieve(local.providerAccountId);
      const remoteStatus = deriveStripeAccountStatus(remote);
      const hasDrift = local.status !== remoteStatus;
      const isDeleted = "deleted" in remote && remote.deleted;

      // Build diagnostic detail
      const remoteChargesEnabled = isDeleted ? false : remote.charges_enabled;
      const remotePayoutsEnabled = isDeleted ? false : remote.payouts_enabled;
      const remotePastDue = isDeleted ? [] : (remote.requirements?.past_due || []);
      const remoteCurrentlyDue = isDeleted ? [] : (remote.requirements?.currently_due || []);
      const requirementsAttention = [...remotePastDue, ...remoteCurrentlyDue];

      const chargesChanged = local.chargesEnabled !== remoteChargesEnabled;
      const payoutsChanged = local.payoutsEnabled !== remotePayoutsEnabled;

      const diagnostic: ConnectAccountHealthDiagnostic = {
        chargesEnabled: chargesChanged
          ? { local: local.chargesEnabled, remote: remoteChargesEnabled }
          : null,
        payoutsEnabled: payoutsChanged
          ? { local: local.payoutsEnabled, remote: remotePayoutsEnabled }
          : null,
        requirementsAttention,
      };

      // Diagnostic logging
      if (chargesChanged) {
        console.warn(
          `[connect-health] capability change: account=${local.providerAccountId} ` +
            `chargesEnabled: ${local.chargesEnabled}→${remoteChargesEnabled}`
        );
      }
      if (payoutsChanged) {
        console.warn(
          `[connect-health] capability change: account=${local.providerAccountId} ` +
            `payoutsEnabled: ${local.payoutsEnabled}→${remotePayoutsEnabled}`
        );
      }
      if (remotePastDue.length > 0) {
        console.warn(
          `[connect-health] requirements attention: account=${local.providerAccountId} ` +
            `pastDue=[${remotePastDue.join(", ")}]`
        );
      }

      let didResync = false;

      if (hasDrift) {
        drifted += 1;
        console.warn(
          `[connect-health] drift detected: account=${local.providerAccountId} ` +
            `local=${local.status} remote=${remoteStatus}`
        );

        if (autoResync) {
          await updateStripePayoutAccountRecord(local, remote);
          didResync = true;
          resynced += 1;
          console.log(
            `[connect-health] resynced: account=${local.providerAccountId} → ${remoteStatus}`
          );
        }
      }

      entries.push({
        providerAccountId: local.providerAccountId,
        userId: local.userId,
        localStatus: local.status,
        remoteStatus,
        drifted: hasDrift,
        resynced: didResync,
        error: null,
        diagnostic,
      });
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[connect-health] failed to check account=${local.providerAccountId}: ${message}`
      );
      entries.push({
        providerAccountId: local.providerAccountId,
        userId: local.userId,
        localStatus: local.status,
        remoteStatus: "UNKNOWN",
        drifted: false,
        resynced: false,
        error: message,
        diagnostic: null,
      });
    }
  }

  if (drifted > 0 || errors > 0) {
    console.warn(
      `[connect-health] summary: checked=${accounts.length} drifted=${drifted} resynced=${resynced} errors=${errors}`
    );
  } else {
    console.log(
      `[connect-health] all ${accounts.length} account(s) in sync`
    );
  }

  return { checked: accounts.length, drifted, resynced, errors, accounts: entries };
}
