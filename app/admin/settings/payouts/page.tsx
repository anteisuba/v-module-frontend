"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Button,
  LanguageSelector,
  LoadingState,
  getToneStyle,
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
type PayoutAlertAction = Exclude<ActionState, "idle">;
type PayoutAlertTone = "critical" | "warning" | "info";

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

interface PayoutStatusAlert {
  key: string;
  title: string;
  description: string;
  details: string[];
  action: PayoutAlertAction;
  tone: PayoutAlertTone;
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

function getPayoutStatusToneKey(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "RESTRICTED":
      return "danger" as const;
    case "PENDING":
      return "warning" as const;
    case "DISCONNECTED":
      return "neutral" as const;
    default:
      return "muted" as const;
  }
}

function getPayoutProgressBarColor(status: string | null | undefined): string {
  switch (status) {
    case "ACTIVE":
      return "#6b8a5e";
    case "RESTRICTED":
      return "#9a4b3d";
    case "PENDING":
      return "#b8863a";
    case "DISCONNECTED":
      return "var(--editorial-muted)";
    default:
      return "var(--editorial-muted)";
  }
}

function getPayoutProgressStepTone(state: PayoutProgressStepState) {
  const toneKey = state === "complete" ? "success"
    : state === "current" ? "warning"
    : state === "attention" ? "danger"
    : "neutral";
  const ts = getToneStyle(toneKey);
  // For markers, use a more saturated version (the text color as background)
  const markerBg = toneKey === "neutral" ? "var(--editorial-surface)" : ts.text;
  const markerText = toneKey === "neutral" ? "var(--editorial-muted)" : "#fff";
  return {
    chip: { borderColor: ts.border, background: ts.bg, color: ts.text },
    marker: { borderColor: markerBg, background: markerBg, color: markerText },
  };
}

function getPayoutAlertToneStyles(tone: PayoutAlertTone) {
  const toneKey = tone === "critical" ? "danger" : tone === "warning" ? "warning" : "info";
  const ts = getToneStyle(toneKey);
  return {
    shell: { borderColor: ts.border, background: ts.bg },
    badge: { borderColor: ts.border, background: ts.bg, color: ts.text },
  };
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

function buildPayoutStatusAlerts(
  account: SellerPayoutAccountSummary | null,
  t: TranslationFn
): PayoutStatusAlert[] {
  if (!account) {
    return [];
  }

  const alerts: PayoutStatusAlert[] = [];
  const currentlyDueCount = account.requirementsCurrentlyDue.length;
  const pastDueCount = account.requirementsPastDue.length;
  const detailsReady = Boolean(
    account.detailsSubmitted || account.onboardingCompletedAt
  );

  if (account.status === "DISCONNECTED") {
    alerts.push({
      key: "disconnected",
      title: t("admin.payouts.alerts.disconnected.title"),
      description: t("admin.payouts.alerts.disconnected.description"),
      details: [
        account.disconnectedAt
          ? `${t("admin.payouts.fields.disconnectedAt")}: ${formatDate(
              account.disconnectedAt
            )}`
          : t("admin.payouts.alerts.disconnected.detail"),
      ],
      action: "onboarding",
      tone: "critical",
    });

    return alerts;
  }

  if (
    account.status === "RESTRICTED" ||
    pastDueCount > 0 ||
    account.disabledReason
  ) {
    alerts.push({
      key: "restricted",
      title: t("admin.payouts.alerts.restricted.title"),
      description: t("admin.payouts.alerts.restricted.description"),
      details: [
        `${t("admin.payouts.progress.counts.pastDue")}: ${pastDueCount}`,
        ...(account.disabledReason
          ? [`${t("admin.payouts.fields.disabledReason")}: ${account.disabledReason}`]
          : []),
        t("admin.payouts.alerts.restricted.detail"),
      ],
      action: "onboarding",
      tone: "critical",
    });

    return alerts;
  }

  if (currentlyDueCount > 0) {
    alerts.push({
      key: "currentlyDue",
      title: t("admin.payouts.alerts.currentlyDue.title"),
      description: t("admin.payouts.alerts.currentlyDue.description"),
      details: [
        `${t("admin.payouts.progress.counts.currentlyDue")}: ${currentlyDueCount}`,
        t("admin.payouts.alerts.currentlyDue.detail"),
      ],
      action: "onboarding",
      tone: "warning",
    });
  }

  if (detailsReady && !account.chargesEnabled && currentlyDueCount === 0) {
    alerts.push({
      key: "chargesReview",
      title: t("admin.payouts.alerts.chargesReview.title"),
      description: t("admin.payouts.alerts.chargesReview.description"),
      details: [t("admin.payouts.alerts.chargesReview.detail")],
      action: "sync",
      tone: "info",
    });
  }

  if (account.chargesEnabled && !account.payoutsEnabled) {
    alerts.push({
      key: "payoutsPending",
      title: t("admin.payouts.alerts.payoutsPending.title"),
      description: t("admin.payouts.alerts.payoutsPending.description"),
      details: [
        account.bankNameMasked || account.bankLast4Masked
          ? `${t("admin.payouts.fields.bankAccount")}: ${
              account.bankNameMasked || "Stripe"
            } •••• ${account.bankLast4Masked || "—"}`
          : t("admin.payouts.fields.bankUnavailable"),
        t("admin.payouts.alerts.payoutsPending.detail"),
      ],
      action: "dashboard",
      tone: "warning",
    });
  }

  return alerts;
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

  const statusToneKey = useMemo(
    () => getPayoutStatusToneKey(account?.status),
    [account?.status]
  );
  const onboardingProgress = useMemo(
    () => buildPayoutOnboardingProgress(account, t),
    [account, t]
  );
  const statusAlerts = useMemo(
    () => buildPayoutStatusAlerts(account, t),
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

  function getActionLabel(action: PayoutAlertAction) {
    if (action === "onboarding") {
      return account?.status === "DISCONNECTED" || !account
        ? t("admin.payouts.actions.startOnboarding")
        : t("admin.payouts.actions.continueOnboarding");
    }

    if (action === "dashboard") {
      return t("admin.payouts.actions.openDashboard");
    }

    return t("admin.payouts.actions.sync");
  }

  async function handleAlertAction(action: PayoutAlertAction) {
    if (action === "onboarding") {
      await handleStartOrContinueOnboarding();
      return;
    }

    if (action === "dashboard") {
      await handleOpenDashboard();
      return;
    }

    await handleSync();
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
      className="relative min-h-screen overflow-hidden bg-stone-100 text-[color:var(--editorial-text)]"
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
          className="mb-6 rounded-lg border border-black/15 bg-white/70 px-4 py-2 text-sm text-[color:var(--editorial-muted)] transition hover:bg-white"
        >
          {t("admin.payouts.backToDashboard")}
        </button>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--editorial-muted)]">
              {t("admin.payouts.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {t("admin.payouts.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--editorial-muted)]">
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

        {statusAlerts.length > 0 ? (
          <section
            data-testid="payout-alerts"
            className="mb-5 rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("admin.payouts.sections.alerts")}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--editorial-muted)]">
                  {t("admin.payouts.alerts.intro")}
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {statusAlerts.map((alert) => {
                  const alertTone = getPayoutAlertToneStyles(alert.tone);

                  return (
                    <div
                      key={alert.key}
                      data-testid={`payout-alert-${alert.key}`}
                      className="rounded-3xl border p-5"
                      style={alertTone.shell}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                          style={alertTone.badge}
                        >
                          {t(`admin.payouts.alerts.tone.${alert.tone}`)}
                        </span>
                        <h3 className="text-sm font-semibold text-[color:var(--editorial-text)]">
                          {alert.title}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--editorial-muted)]">
                        {alert.description}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
                        {alert.details.map((detail) => (
                          <li
                            key={detail}
                            className="rounded-2xl border border-black/10 bg-white/65 px-4 py-3"
                          >
                            {detail}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          loading={actionState === alert.action}
                          onClick={() => {
                            void handleAlertAction(alert.action);
                          }}
                          data-testid={`payout-alert-action-${alert.key}`}
                        >
                          {getActionLabel(alert.action)}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section
          data-testid="payout-guide"
          className="mb-5 rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[0.95fr_1.05fr_1fr]">
            <div>
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.guide")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--editorial-muted)]">
                {t("admin.payouts.guide.overview")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[color:var(--editorial-text)]">
                {t("admin.payouts.guide.flowTitle")}
              </h3>
              <ol className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--editorial-muted)]">
                {[
                  t("admin.payouts.guide.flowSteps.start"),
                  t("admin.payouts.guide.flowSteps.sync"),
                  t("admin.payouts.guide.flowSteps.manage"),
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-stone-100 text-xs font-semibold text-[color:var(--editorial-muted)]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[color:var(--editorial-text)]">
                {t("admin.payouts.guide.statusTitle")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
                {PAYOUT_STATUS_ORDER.map((status) => (
                  <li
                    key={status}
                    className="rounded-2xl border border-black/10 bg-stone-50/70 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-3 py-1 text-[11px] font-medium"
                        style={(() => { const ts = getToneStyle(getPayoutStatusToneKey(status)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}
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
          className="mb-5 rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl"
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
                  <span className="pb-1 text-xs uppercase tracking-[0.26em] text-[color:var(--editorial-muted)]">
                    {t("admin.payouts.progress.completed")}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${onboardingProgress.progressValue}%`, background: getPayoutProgressBarColor(account?.status) }}
                  />
                </div>
                <p
                  data-testid="payout-progress-summary"
                  className="mt-4 text-sm leading-6 text-[color:var(--editorial-muted)]"
                >
                  {onboardingProgress.summary}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                  {t("admin.payouts.progress.recommendedAction")}
                </p>
                <p className="mt-1 text-sm text-[color:var(--editorial-muted)]">
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
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                        style={tone.marker}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[color:var(--editorial-text)]">
                            {step.label}
                          </span>
                          <span
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={tone.chip}
                          >
                            {t(`admin.payouts.progress.state.${step.state}`)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--editorial-muted)]">
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
          <section className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.account")}
              </h2>
              <span
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={(() => { const ts = getToneStyle(statusToneKey); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}
                data-testid="payout-status-badge"
              >
                {t(`admin.payouts.status.${account?.status || "NOT_STARTED"}`)}
              </span>
            </div>

            {!account ? (
              <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-black/[0.03] p-8 text-sm leading-6 text-[color:var(--editorial-muted)]">
                <p>{t("admin.payouts.emptyState")}</p>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                      {t("admin.payouts.fields.providerAccountId")}
                    </div>
                    <div className="mt-2 break-all text-sm font-medium">
                      {account.providerAccountId}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                      {t("admin.payouts.fields.country")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {account.country || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
                      {t("admin.payouts.fields.defaultCurrency")}
                    </div>
                    <div className="mt-2 text-sm font-medium">
                      {account.defaultCurrency || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-black/10 bg-stone-50/80 p-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
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
                      <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--editorial-muted)]">
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
                  <p className="mt-2 text-sm text-[color:var(--editorial-muted)]">
                    {account.bankNameMasked || account.bankLast4Masked
                      ? `${account.bankNameMasked || "Stripe"} •••• ${account.bankLast4Masked || "—"}`
                      : t("admin.payouts.fields.bankUnavailable")}
                  </p>
                </div>
              </>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold">
                {t("admin.payouts.sections.nextSteps")}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--editorial-muted)]">
                <p>
                  {account?.chargesEnabled && account?.payoutsEnabled
                    ? t("admin.payouts.hints.active")
                    : t("admin.payouts.hints.pending")}
                </p>
                {account?.disabledReason ? (
                  <p
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: "color-mix(in srgb, #9a4b3d 8%, var(--editorial-surface))",
                      color: "#9a4b3d",
                    }}
                  >
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
                className="rounded-[28px] border border-black/10 bg-white/72 p-6 shadow-[0_24px_72px_rgba(17,12,6,0.08)] backdrop-blur-xl"
              >
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.items.length === 0 ? (
                  <p className="mt-3 text-sm text-[color:var(--editorial-muted)]">
                    {t("admin.payouts.fields.none")}
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-[color:var(--editorial-muted)]">
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
