"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  PaymentReconciliationAnomaly,
  PaymentReconciliationEvent,
  PaymentReconciliationReport,
  PaymentRoutingMode,
} from "@/domain/shop";
import {
  BackButton,
  Alert,
  LoadingState,
  LanguageSelector,
  Button,
  Input,
} from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

function getDefaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

type PaymentRoutingModeFilter = PaymentRoutingMode | "ALL";

export default function OrdersReconciliationPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [report, setReport] = useState<PaymentReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingEvents, setExportingEvents] = useState(false);
  const [exportingAnomalies, setExportingAnomalies] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [routingModeFilter, setRoutingModeFilter] =
    useState<PaymentRoutingModeFilter>("ALL");
  const [connectedAccountFilter, setConnectedAccountFilter] = useState("");

  const loadReport = useCallback(async () => {
    try {
      if (!report) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const nextReport = await shopApi.getPaymentReconciliationReport({
        start: startDate,
        end: endDate,
        paymentRoutingMode:
          routingModeFilter === "ALL" ? undefined : routingModeFilter,
        connectedAccountId: connectedAccountFilter.trim() || undefined,
      });
      setReport(nextReport);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    connectedAccountFilter,
    endDate,
    handleError,
    report,
    routingModeFilter,
    startDate,
  ]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    if (!userLoading && user && !report) {
      void loadReport();
    }
  }, [loadReport, report, user, userLoading]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(amount: number) {
    return `¥${amount.toFixed(2)}`;
  }

  function getSeverityStyle(severity: PaymentReconciliationAnomaly["severity"]) {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  function getEventStatusStyle(event: PaymentReconciliationEvent) {
    if (event.kind === "REFUND") {
      if (event.status === "SUCCEEDED") {
        return "bg-emerald-100 text-emerald-700";
      }
      if (event.status === "FAILED") {
        return "bg-red-100 text-red-700";
      }
      return "bg-amber-100 text-amber-700";
    }

    if (event.status === "PAID") {
      return "bg-blue-100 text-blue-700";
    }
    if (event.status === "FAILED") {
      return "bg-red-100 text-red-700";
    }
    if (event.status === "EXPIRED") {
      return "bg-gray-100 text-gray-700";
    }
    return "bg-amber-100 text-amber-700";
  }

  function getRoutingLabel(
    mode: PaymentReconciliationEvent["paymentRoutingMode"]
  ) {
    return mode === "STRIPE_CONNECT_DESTINATION"
      ? "Connect 路由"
      : "平台 fallback";
  }

  function getRoutingStyle(
    mode: PaymentReconciliationEvent["paymentRoutingMode"]
  ) {
    return mode === "STRIPE_CONNECT_DESTINATION"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-200 text-slate-700";
  }

  const summaryCards = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      {
        label: "窗口内入账",
        value: formatPrice(report.summary.grossCapturedAmount),
      },
      {
        label: "窗口内退款",
        value: formatPrice(report.summary.refundedAmount),
      },
      {
        label: "窗口内净额",
        value: formatPrice(report.summary.netCollectedAmount),
      },
      {
        label: "异常订单",
        value: String(report.summary.anomalyCount),
      },
      {
        label: "当前待支付",
        value: String(report.summary.openOrderCount),
      },
      {
        label: "待处理退款",
        value: String(report.summary.pendingRefundCount),
      },
    ];
  }, [report]);

  const activeRoutingLabel =
    routingModeFilter === "ALL"
      ? "全部路由"
      : getRoutingLabel(routingModeFilter);
  const activeAccountLabel = connectedAccountFilter.trim() || "全部账户";

  async function handleExportEvents() {
    try {
      setExportingEvents(true);
      const blob = await shopApi.exportPaymentEventsCsv({
        start: startDate,
        end: endDate,
        paymentRoutingMode:
          routingModeFilter === "ALL" ? undefined : routingModeFilter,
        connectedAccountId: connectedAccountFilter.trim() || undefined,
      });
      downloadBlob(
        blob,
        `stripe-payment-events-${startDate}-to-${endDate}.csv`
      );
      showToast("支付事件 CSV 已导出");
    } catch (err) {
      handleError(err);
    } finally {
      setExportingEvents(false);
    }
  }

  async function handleExportAnomalies() {
    try {
      setExportingAnomalies(true);
      const blob = await shopApi.exportPaymentAnomaliesCsv({
        start: startDate,
        end: endDate,
        paymentRoutingMode:
          routingModeFilter === "ALL" ? undefined : routingModeFilter,
        connectedAccountId: connectedAccountFilter.trim() || undefined,
      });
      downloadBlob(
        blob,
        `stripe-payment-anomalies-${startDate}-to-${endDate}.csv`
      );
      showToast("对账异常 CSV 已导出");
    } catch (err) {
      handleError(err);
    } finally {
      setExportingAnomalies(false);
    }
  }

  function resetFilters() {
    setRoutingModeFilter("ALL");
    setConnectedAccountFilter("");
  }

  if (userLoading || loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user || !report) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <BackButton href="/admin/orders" label={t("common.back")} />
          <LanguageSelector position="inline" menuPosition="bottom" />
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Stripe 支付对账</h1>
              <p className="mt-1 text-sm text-black/65">
                汇总支付/退款事件，导出 CSV，并优先处理异常订单。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void loadReport()}
                disabled={refreshing || exportingEvents || exportingAnomalies}
              >
                {refreshing ? "刷新中..." : "刷新报表"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportEvents}
                loading={exportingEvents}
                disabled={refreshing}
              >
                导出支付事件
              </Button>
              <Button
                variant="secondary"
                onClick={handleExportAnomalies}
                loading={exportingAnomalies}
                disabled={refreshing}
              >
                导出异常清单
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/admin/orders/reconciliation/settlements")}
                disabled={refreshing || exportingEvents || exportingAnomalies}
              >
                结算核销
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_minmax(0,1fr)_auto_auto] xl:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                开始日期
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                结束日期
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                Routing mode
              </label>
              <select
                value={routingModeFilter}
                onChange={(event) =>
                  setRoutingModeFilter(
                    event.target.value as PaymentRoutingModeFilter
                  )
                }
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
              >
                <option value="ALL">全部路由</option>
                <option value="STRIPE_CONNECT_DESTINATION">Connect 路由</option>
                <option value="PLATFORM">平台 fallback</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-black/70">
                Connected account
              </label>
              <Input
                value={connectedAccountFilter}
                onChange={(event) => setConnectedAccountFilter(event.target.value)}
                placeholder="acct_123..."
              />
            </div>
            <div className="flex justify-end xl:justify-start">
              <Button
                variant="secondary"
                onClick={resetFilters}
                disabled={refreshing || exportingEvents || exportingAnomalies}
              >
                清空筛选
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => void loadReport()}
                disabled={refreshing || exportingEvents || exportingAnomalies}
              >
                应用筛选
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-black/50">
            当前窗口 {formatDate(report.summary.windowStart)} 至{" "}
            {formatDate(report.summary.windowEnd)}
            {" / "}
            {activeRoutingLabel}
            {" / "}
            {activeAccountLabel}
          </div>
        </div>

        {error ? <Alert type="error" message={error} onClose={clearError} /> : null}
        {toastMessage ? (
          <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm text-white">
            {toastMessage}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl"
            >
              <div className="text-sm text-black/55">{card.label}</div>
              <div className="mt-1 text-2xl font-bold text-black">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">
                异常对账页
              </h2>
              <span className="text-xs text-black/45">
                {report.anomalies.length} 条异常
              </span>
            </div>

            <div className="space-y-4">
              {report.anomalies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-black/55">
                  当前没有发现 Stripe 对账异常。
                </div>
              ) : (
                report.anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="rounded-xl border border-black/10 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getSeverityStyle(
                              anomaly.severity
                            )}`}
                          >
                            {anomaly.severity.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-black/45">
                            {anomaly.code}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-black">
                          {anomaly.title}
                        </h3>
                        <p className="mt-1 text-sm text-black/70">
                          {anomaly.description}
                        </p>
                        <p className="mt-2 text-xs text-black/50">
                          建议处理：{anomaly.suggestedAction}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-black/45">
                          <span>订单状态 {anomaly.orderStatus}</span>
                          <span>支付状态 {anomaly.paymentStatus || "未记录"}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getRoutingStyle(
                              anomaly.paymentRoutingMode
                            )}`}
                          >
                            {getRoutingLabel(anomaly.paymentRoutingMode)}
                          </span>
                          {anomaly.connectedAccountId ? (
                            <span className="break-all">
                              Connected {anomaly.connectedAccountId}
                            </span>
                          ) : null}
                          <span>{formatDate(anomaly.createdAt)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/orders/${anomaly.orderId}`}
                        className="shrink-0 rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/80"
                      >
                        查看订单
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">近期支付/退款事件</h2>
              <span className="text-xs text-black/45">
                显示最近 {report.events.length} 条
              </span>
            </div>

            <div className="space-y-3">
              {report.events.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-black/55">
                  当前时间窗口内没有 Stripe 事件。
                </div>
              ) : (
                report.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-black/10 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/70">
                            {event.kind === "REFUND" ? "REFUND" : "PAYMENT"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getEventStatusStyle(
                              event
                            )}`}
                          >
                            {event.status}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getRoutingStyle(
                              event.paymentRoutingMode
                            )}`}
                          >
                            {getRoutingLabel(event.paymentRoutingMode)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-black">
                          {formatPrice(event.amount)} / {event.buyerName || event.buyerEmail}
                        </div>
                        <div className="mt-1 text-xs text-black/55">
                          订单 {event.orderId.slice(0, 8).toUpperCase()} / {event.provider}
                        </div>
                        <div className="mt-1 text-xs text-black/45">
                          {event.paymentIntentId || event.paymentSessionId || "无外部标识"}
                        </div>
                        <div className="mt-1 text-xs text-black/45">
                          {event.connectedAccountId
                            ? `Connected ${event.connectedAccountId}`
                            : "当前未关联 connected account"}
                        </div>
                        {event.reason ? (
                          <div className="mt-2 text-xs text-black/55">
                            原因：{event.reason}
                          </div>
                        ) : null}
                        {event.failureReason ? (
                          <div className="mt-2 text-xs text-red-600">
                            {event.failureReason}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs text-black/45">
                          {formatDate(event.occurredAt)}
                        </div>
                        <Link
                          href={`/admin/orders/${event.orderId}`}
                          className="mt-3 inline-block rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/80"
                        >
                          查看订单
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
