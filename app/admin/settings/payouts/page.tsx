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

  const statusTone = useMemo(() => {
    switch (account?.status) {
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
  }, [account?.status]);

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
