"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  LanguageSelector,
  LoadingState,
} from "@/components/ui";
import {
  connectApi,
  type SellerPayoutAccountSummary,
} from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

type ActionState =
  | "idle"
  | "onboarding"
  | "sync"
  | "dashboard";

type TranslationFn = (key: string) => string;
type PayoutProgressStepState = "complete" | "current" | "todo" | "attention";

interface PayoutProgressStep {
  key: string;
  label: string;
  description: string;
  state: PayoutProgressStepState;
}

interface PayoutOnboardingProgress {
  completedCount: number;
  totalSteps: number;
  progressValue: number;
  summary: string;
  recommendedAction: string;
  counts: {
    currentlyDue: number;
    pastDue: number;
    eventuallyDue: number;
  };
  steps: PayoutProgressStep[];
}

const PAYOUT_STATUS_ORDER = [
  "NOT_STARTED",
  "PENDING",
  "RESTRICTED",
  "ACTIVE",
  "DISCONNECTED",
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPayoutStatusTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "RESTRICTED":
      return "bg-rose-100 text-rose-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "DISCONNECTED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-white/70 text-black/70";
  }
}

function getPayoutStatusProgressTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500";
    case "RESTRICTED":
      return "bg-rose-500";
    case "PENDING":
      return "bg-amber-500";
    case "DISCONNECTED":
      return "bg-slate-500";
    default:
      return "bg-black/65";
  }
}

function getPayoutProgressStepTone(state: PayoutProgressStepState) {
  switch (state) {
    case "complete":
      return {
        chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
        marker: "bg-emerald-600 text-white border-emerald-600",
      };
    case "current":
      return {
        chip: "bg-amber-100 text-amber-700 border-amber-200",
        marker: "bg-amber-500 text-white border-amber-500",
      };
    case "attention":
      return {
        chip: "bg-rose-100 text-rose-700 border-rose-200",
        marker: "bg-rose-600 text-white border-rose-600",
      };
    default:
      return {
        chip: "bg-white/70 text-black/60 border-black/10",
        marker: "bg-white text-black/55 border-black/10",
      };
  }
}

function buildPayoutOnboardingProgress(
  account: SellerPayoutAccountSummary | null,
  t: TranslationFn
): PayoutOnboardingProgress {
  const hasAccount = Boolean(account);
  const isDisconnected = account?.status === "DISCONNECTED";
  const currentlyDueCount = account?.requirementsCurrentlyDue.length ?? 0;
  const pastDueCount = account?.requirementsPastDue.length ?? 0;
  const eventuallyDueCount = account?.requirementsEventuallyDue.length ?? 0;
  const detailsReady = Boolean(
    account?.detailsSubmitted || account?.onboardingCompletedAt
  );
  const chargesReady = Boolean(account?.chargesEnabled);
  const payoutsReady = Boolean(account?.payoutsEnabled);
  const totalSteps = 4;
  const completedCount = [
    hasAccount,
    detailsReady,
    chargesReady,
    payoutsReady,
  ].filter(Boolean).length;

  let summary = t("admin.payouts.progress.summary.notStarted");
  let recommendedAction = t("admin.payouts.actions.startOnboarding");

  if (isDisconnected) {
    summary = t("admin.payouts.progress.summary.disconnected");
    recommendedAction = t("admin.payouts.actions.startOnboarding");
  } else if (pastDueCount > 0) {
    summary = t("admin.payouts.progress.summary.pastDue");
    recommendedAction = t("admin.payouts.actions.continueOnboarding");
  } else if (!hasAccount) {
    summary = t("admin.payouts.progress.summary.notStarted");
    recommendedAction = t("admin.payouts.actions.startOnboarding");
  } else if (!detailsReady || currentlyDueCount > 0) {
    summary = t("admin.payouts.progress.summary.details");
    recommendedAction = t("admin.payouts.actions.continueOnboarding");
  } else if (!chargesReady) {
    summary = t("admin.payouts.progress.summary.review");
    recommendedAction = t("admin.payouts.actions.sync");
  } else if (!payoutsReady) {
    summary = t("admin.payouts.progress.summary.payouts");
    recommendedAction = t("admin.payouts.actions.sync");
  } else {
    summary = t("admin.payouts.progress.summary.active");
    recommendedAction = t("admin.payouts.actions.openDashboard");
  }

  const steps: PayoutProgressStep[] = [
    {
      key: "account",
      label: t("admin.payouts.progress.steps.account.label"),
      description: isDisconnected
        ? t("admin.payouts.progress.steps.account.attention")
        : hasAccount
          ? t("admin.payouts.progress.steps.account.done")
          : t("admin.payouts.progress.steps.account.todo"),
      state: isDisconnected ? "attention" : hasAccount ? "complete" : "current",
    },
    {
      key: "details",
      label: t("admin.payouts.progress.steps.details.label"),
      description: !hasAccount || isDisconnected
        ? t("admin.payouts.progress.steps.details.todo")
        : pastDueCount > 0
          ? t("admin.payouts.progress.steps.details.attention")
          : detailsReady && currentlyDueCount === 0
            ? t("admin.payouts.progress.steps.details.done")
            : t("admin.payouts.progress.steps.details.current"),
      state: !hasAccount || isDisconnected
        ? "todo"
        : pastDueCount > 0
          ? "attention"
          : detailsReady && currentlyDueCount === 0
            ? "complete"
            : "current",
    },
    {
      key: "charges",
      label: t("admin.payouts.progress.steps.charges.label"),
      description: !hasAccount || isDisconnected || !detailsReady
        ? t("admin.payouts.progress.steps.charges.todo")
        : pastDueCount > 0
          ? t("admin.payouts.progress.steps.charges.attention")
          : chargesReady
            ? t("admin.payouts.progress.steps.charges.done")
            : t("admin.payouts.progress.steps.charges.current"),
      state: !hasAccount || isDisconnected || !detailsReady
        ? "todo"
        : pastDueCount > 0
          ? "attention"
          : chargesReady
            ? "complete"
            : "current",
    },
    {
      key: "payouts",
      label: t("admin.payouts.progress.steps.payouts.label"),
      description: !hasAccount || isDisconnected || !chargesReady
        ? t("admin.payouts.progress.steps.payouts.todo")
        : pastDueCount > 0
          ? t("admin.payouts.progress.steps.payouts.attention")
          : payoutsReady
            ? t("admin.payouts.progress.steps.payouts.done")
            : t("admin.payouts.progress.steps.payouts.current"),
      state: !hasAccount || isDisconnected || !chargesReady
        ? "todo"
        : pastDueCount > 0
          ? "attention"
          : payoutsReady
            ? "complete"
            : "current",
    },
  ];

  return {
    completedCount,
    totalSteps,
    progressValue: Math.round((completedCount / totalSteps) * 100),
    summary,
    recommendedAction,
    counts: {
      currentlyDue: currentlyDueCount,
      pastDue: pastDueCount,
      eventuallyDue: eventuallyDueCount,
    },
    steps,
  };
}

function AdminPayoutSettingsPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [account, setAccount] = useState<SellerPayoutAccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const shouldSync = searchParams.get("connect") === "return";
        const nextAccount = shouldSync
          ? await connectApi.syncPayoutAccount()
          : await connectApi.getMyPayoutAccount();

        if (!active) {
          return;
        }

        setAccount(nextAccount);

        if (shouldSync) {
          setSuccessMessage(t("admin.payouts.messages.returned"));
          router.replace("/admin/settings/payouts");
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : t("admin.payouts.errors.loadFailed")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router, searchParams, t]);

  const statusTone = useMemo(
    () => getPayoutStatusTone(account?.status),
    [account?.status]
  );
  const onboardingProgress = useMemo(
    () => buildPayoutOnboardingProgress(account, t),
    [account, t]
  );

  async function handleStartOrContinueOnboarding() {
    try {
      setActionState("onboarding");
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await connectApi.createOnboardingLink();
      window.location.assign(result.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("admin.payouts.errors.loadFailed")
      );
    } finally {
      setActionState("idle");
    }
  }

  async function handleOpenDashboard() {
    try {
      setActionState("dashboard");
      setErrorMessage(null);

      const result = await connectApi.createDashboardLink();
      window.location.assign(result.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("admin.payouts.errors.loadFailed")
      );
    } finally {
      setActionState("idle");
    }
  }

  async function handleSync() {
    try {
      setActionState("sync");
      setErrorMessage(null);

      const nextAccount = await connectApi.syncPayoutAccount();
      setAccount(nextAccount);
      setSuccessMessage(t("admin.payouts.messages.synced"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("admin.payouts.errors.loadFailed")
      );
    } finally {
      setActionState("idle");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingState message={t("common.loading")} />
      </main>
    );
  }

  const requirementsCurrentlyDue = account?.requirementsCurrentlyDue || [];
  const requirementsPastDue = account?.requirementsPastDue || [];
  const requirementsEventuallyDue = account?.requirementsEventuallyDue || [];

  return (
    <main
      data-testid="admin-payout-settings-page"
      className="relative min-h-screen overflow-hidden bg-stone-100 text-black"
    >
      <div className="fixed bottom-6 right-6 z-[100]">
        <LanguageSelector position="bottom-right" />
      </div>

      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/78" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.08),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="mb-6 rounded-lg border border-black/15 bg-white/70 px-4 py-2 text-sm text-black/70 transition hover:bg-white"
        >
          {t("admin.payouts.backToDashboard")}
        </button>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">
              {t("admin.payouts.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("admin.payouts.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">
              {t("admin.payouts.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              loading={actionState === "sync"}
              onClick={handleSync}
              disabled={!account}
              data-testid="payout-sync"
            >
              {t("admin.payouts.actions.sync")}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={actionState === "onboarding"}
              onClick={handleStartOrContinueOnboarding}
              data-testid="payout-onboarding"
            >
              {account
                ? t("admin.payouts.actions.continueOnboarding")
                : t("admin.payouts.actions.startOnboarding")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={actionState === "dashboard"}
              onClick={handleOpenDashboard}
              disabled={!account}
              data-testid="payout-dashboard"
            >
              {t("admin.payouts.actions.openDashboard")}
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-4">
            <Alert type="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
          </div>
        ) : null}
        {successMessage ? (
          <div className="mb-4">
            <Alert
              type="success"
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          </div>
        ) : null}

        <section
          data-testid="payout-guide"
          className="mb-5 rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[0.95fr_1.05fr_1fr]">
            <div>
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.guide")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-black/65">
                {t("admin.payouts.guide.overview")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-black/85">
                {t("admin.payouts.guide.flowTitle")}
              </h3>
              <ol className="mt-3 space-y-3 text-sm leading-6 text-black/65">
                {[
                  t("admin.payouts.guide.flowSteps.start"),
                  t("admin.payouts.guide.flowSteps.sync"),
                  t("admin.payouts.guide.flowSteps.manage"),
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-stone-100 text-xs font-semibold text-black/70">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-black/85">
                {t("admin.payouts.guide.statusTitle")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-black/65">
                {PAYOUT_STATUS_ORDER.map((status) => (
                  <li
                    key={status}
                    className="rounded-2xl border border-black/10 bg-stone-50/70 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${getPayoutStatusTone(
                          status
                        )}`}
                      >
                        {t(`admin.payouts.status.${status}`)}
                      </span>
                      <span>{t(`admin.payouts.guide.statusHelp.${status}`)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          data-testid="payout-progress"
          className="mb-5 rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold">
                  {t("admin.payouts.sections.progress")}
                </h2>
                <div className="mt-4 flex items-end gap-3">
                  <span
                    data-testid="payout-progress-count"
                    className="text-3xl font-semibold tracking-tight"
                  >
                    {`${onboardingProgress.completedCount} / ${onboardingProgress.totalSteps}`}
                  </span>
                  <span className="pb-1 text-xs uppercase tracking-[0.26em] text-black/40">
                    {t("admin.payouts.progress.completed")}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ${getPayoutStatusProgressTone(
                      account?.status
                    )}`}
                    style={{ width: `${onboardingProgress.progressValue}%` }}
                  />
                </div>
                <p
                  data-testid="payout-progress-summary"
                  className="mt-4 text-sm leading-6 text-black/70"
                >
                  {onboardingProgress.summary}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-black/45">
                  {t("admin.payouts.progress.recommendedAction")}
                </p>
                <p className="mt-1 text-sm text-black/70">
                  {onboardingProgress.recommendedAction}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: t("admin.payouts.progress.counts.currentlyDue"),
                    value: onboardingProgress.counts.currentlyDue,
                  },
                  {
                    label: t("admin.payouts.progress.counts.pastDue"),
                    value: onboardingProgress.counts.pastDue,
                  },
                  {
                    label: t("admin.payouts.progress.counts.eventuallyDue"),
                    value: onboardingProgress.counts.eventuallyDue,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[132px] rounded-3xl border border-black/10 bg-stone-50/75 p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {onboardingProgress.steps.map((step, index) => {
                const tone = getPayoutProgressStepTone(step.state);

                return (
                  <li
                    key={step.key}
                    className="rounded-3xl border border-black/10 bg-stone-50/75 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${tone.marker}`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-black/85">
                            {step.label}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.chip}`}
                          >
                            {t(`admin.payouts.progress.state.${step.state}`)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-black/65">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.account")}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}
                data-testid="payout-status-badge"
              >
                {t(`admin.payouts.status.${account?.status || "NOT_STARTED"}`)}
              </span>
            </div>

            {!account ? (
              <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-black/[0.03] p-8 text-sm leading-6 text-black/65">
                <p>{t("admin.payouts.emptyState")}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                      {t("admin.payouts.fields.providerAccountId")}
                    </div>
                    <div className="mt-2 break-all text-sm font-medium">
                      {account.providerAccountId}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                      {t("admin.payouts.fields.country")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {account.country || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                      {t("admin.payouts.fields.defaultCurrency")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {account.defaultCurrency || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                      {t("admin.payouts.fields.lastSyncedAt")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {formatDate(account.lastSyncedAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      label: t("admin.payouts.fields.detailsSubmitted"),
                      value: account.detailsSubmitted,
                    },
                    {
                      label: t("admin.payouts.fields.chargesEnabled"),
                      value: account.chargesEnabled,
                    },
                    {
                      label: t("admin.payouts.fields.payoutsEnabled"),
                      value: account.payoutsEnabled,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-black/10 bg-white/75 p-4"
                    >
                      <div className="text-[11px] uppercase tracking-[0.24em] text-black/40">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-medium">
                        {item.value
                          ? t("admin.payouts.flags.ready")
                          : t("admin.payouts.flags.notReady")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-black/10 bg-white/75 p-5">
                  <div className="text-sm font-semibold">
                    {t("admin.payouts.fields.bankAccount")}
                  </div>
                  <p className="mt-2 text-sm text-black/65">
                    {account.bankNameMasked || account.bankLast4Masked
                      ? `${account.bankNameMasked || "Stripe"} •••• ${account.bankLast4Masked || "—"}`
                      : t("admin.payouts.fields.bankUnavailable")}
                  </p>
                </div>
              </>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.nextSteps")}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-black/65">
                <p>
                  {account?.chargesEnabled && account?.payoutsEnabled
                    ? t("admin.payouts.hints.active")
                    : t("admin.payouts.hints.pending")}
                </p>
                {account?.disabledReason ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
                    {t("admin.payouts.fields.disabledReason")}: {account.disabledReason}
                  </p>
                ) : null}
              </div>
            </div>

            {[
              {
                title: t("admin.payouts.sections.currentlyDue"),
                items: requirementsCurrentlyDue,
              },
              {
                title: t("admin.payouts.sections.pastDue"),
                items: requirementsPastDue,
              },
              {
                title: t("admin.payouts.sections.eventuallyDue"),
                items: requirementsEventuallyDue,
              },
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] backdrop-blur-xl"
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.items.length === 0 ? (
                  <p className="mt-3 text-sm text-black/55">
                    {t("admin.payouts.fields.none")}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-black/70">
                    {section.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-2xl border border-black/10 bg-stone-50/70 px-4 py-3"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AdminPayoutSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState message="加载中..." />
        </div>
      }
    >
      <AdminPayoutSettingsPageContent />
    </Suspense>
  );
}
