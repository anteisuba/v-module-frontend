"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
  PaymentSettlementEntryGroup,
  PaymentSettlementEntryRecord,
  PaymentSettlementPayoutRecord,
  PaymentSettlementReport,
} from "@/domain/shop";
import {
  BackButton,
  Alert,
  LoadingState,
  LanguageSelector,
  Button,
  Input,
  getToneStyle,
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

export default function SettlementReconciliationPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [report, setReport] = useState<PaymentSettlementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const loadReport = useCallback(async () => {
    try {
      if (!report) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const nextReport = await shopApi.getPaymentSettlementReport({
        start: startDate,
        end: endDate,
      });
      setReport(nextReport);
      setSelectedIds((current) =>
        current.filter((id) => nextReport.entries.some((entry) => entry.id === id))
      );
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endDate, handleError, report, startDate]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/admin");
      return;
    }

    if (!userLoading && user) {
      void loadReport();
    }
  }, [loadReport, router, user, userLoading]);

  async function handleSync() {
    try {
      setSyncing(true);
      const result = await shopApi.syncPaymentSettlementLedger({
        start: startDate,
        end: endDate,
      });
      setReport(result.report);
      setSelectedIds([]);
      showToast(
        `同步完成：${result.sync.syncedEntries} 条流水，${result.sync.syncedPayouts} 笔 payout，${result.sync.syncedDisputes} 条 dispute`
      );
    } catch (err) {
      handleError(err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleBulkUpdate(
    reconciliationStatus: "OPEN" | "RECONCILED" | "IGNORED"
  ) {
    if (selectedIds.length === 0) {
      showToast("请先选择至少一条结算流水");
      return;
    }

    try {
      setUpdating(true);
      const result = await shopApi.updatePaymentSettlementEntries({
        ids: selectedIds,
        reconciliationStatus,
        note: note.trim() || null,
        start: startDate,
        end: endDate,
      });
      setReport(result.report);
      setSelectedIds([]);
      setNote("");
      showToast(`已更新 ${result.updated.updatedCount} 条流水状态`);
    } catch (err) {
      handleError(err);
    } finally {
      setUpdating(false);
    }
  }

  function toggleEntry(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleAll(entries: PaymentSettlementEntryRecord[]) {
    const allSelected = entries.every((entry) => selectedIds.includes(entry.id));
    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !entries.some((entry) => entry.id === id))
      );
      return;
    }

    setSelectedIds(Array.from(new Set([...selectedIds, ...entries.map((entry) => entry.id)])));
  }

  function formatDate(dateString: string | null) {
    if (!dateString) {
      return " - ";
    }

    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(amount: number, currency = "JPY") {
    if (currency.toUpperCase() === "JPY") {
      return `¥${amount.toFixed(2)}`;
    }

    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }

  function getSettlementStatusTone(status: PaymentSettlementEntryRecord["status"]) {
    return status === "available" ? "success" as const : "warning" as const;
  }

  function getWriteOffTone(status: PaymentSettlementEntryRecord["reconciliationStatus"]) {
    if (status === "RECONCILED") return "info" as const;
    if (status === "IGNORED") return "neutral" as const;
    return "danger" as const;
  }

  function getPayoutTone(status: PaymentSettlementPayoutRecord["status"]) {
    if (status === "paid") return "success" as const;
    if (status === "failed" || status === "canceled") return "danger" as const;
    return "warning" as const;
  }

  function getEntryGroupTone(key: PaymentSettlementEntryGroup["key"]) {
    if (key === "PAID") return "success" as const;
    if (key === "FAILED" || key === "CANCELED") return "danger" as const;
    if (key === "NOT_IN_PAYOUT") return "neutral" as const;
    return "warning" as const;
  }

  function getRoutingLabel(mode: string | null) {
    return mode === "STRIPE_CONNECT_DESTINATION"
      ? "Connect 路由"
      : "平台 fallback";
  }

  function getRoutingTone(mode: string | null) {
    return mode === "STRIPE_CONNECT_DESTINATION" ? "success" as const : "neutral" as const;
  }

  const summaryCards = useMemo(() => {
    if (!report) {
      return [];
    }

    return [
      { label: "窗口内入账", value: formatPrice(report.summary.grossCapturedAmount) },
      { label: "窗口内退款", value: formatPrice(report.summary.refundedAmount) },
      { label: "Stripe 手续费", value: formatPrice(report.summary.feeAmount) },
      { label: "待 payout 净额", value: formatPrice(report.summary.availableNetAmount) },
      { label: "已 payout 净额", value: formatPrice(report.summary.paidOutNetAmount) },
      { label: "未核销流水", value: String(report.summary.unreconciledEntryCount) },
    ];
  }, [report]);

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

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <BackButton href="/admin/orders/reconciliation" label={t("common.back")} />
          <LanguageSelector position="inline" menuPosition="bottom" />
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--editorial-text)]">Stripe 结算核销</h1>
              <p className="mt-1 text-sm text-[color:var(--editorial-muted)]">
                同步 balance transactions / payouts，检查到账差异，并对流水做核销。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void loadReport()} disabled={refreshing || syncing || updating}>
                {refreshing ? "刷新中..." : "刷新报表"}
              </Button>
              <Button variant="primary" onClick={handleSync} loading={syncing} disabled={updating}>
                同步 Stripe 结算
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">开始日期</label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">结束日期</label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => void loadReport()} disabled={refreshing || syncing || updating}>
                应用时间窗口
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[color:var(--editorial-muted)]">
            <span>当前窗口 {formatDate(report.summary.windowStart)} 至 {formatDate(report.summary.windowEnd)}</span>
            <span>最近同步 {formatDate(report.summary.lastSyncedAt)}</span>
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
            <div key={card.label} className="rounded-2xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
              <div className="text-sm text-[color:var(--editorial-muted)]">{card.label}</div>
              <div className="mt-1 text-2xl font-bold text-[color:var(--editorial-text)]">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--editorial-text)]">异常与待处理项</h2>
            <span className="text-xs text-[color:var(--editorial-muted)]">{report.anomalies.length} 条异常</span>
          </div>
          <div className="space-y-3">
            {report.anomalies.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-4 text-sm text-[color:var(--editorial-muted)]">
                当前时间窗口没有新的结算异常。
              </div>
            ) : (
              report.anomalies.slice(0, 8).map((anomaly) => (
                <div key={anomaly.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                      style={(() => { const ts = getToneStyle("danger"); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}
                    >
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[color:var(--editorial-muted)]">{anomaly.code}</span>
                    <span className="text-[11px] text-[color:var(--editorial-muted)]">{formatDate(anomaly.occurredAt)}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-[color:var(--editorial-text)]">{anomaly.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--editorial-muted)]">{anomaly.description}</p>
                  <p className="mt-2 text-xs text-[color:var(--editorial-muted)]">建议处理：{anomaly.suggestedAction}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
          <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[color:var(--editorial-text)]">结算流水</h2>
                <p className="mt-1 text-sm text-[color:var(--editorial-muted)]">按 payout 状态分组查看流水，并对选中的项目批量标记为已核销、忽略，或恢复为待处理。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => toggleAll(report.entries)} disabled={report.entries.length === 0 || updating}>
                  {report.entries.every((entry) => selectedIds.includes(entry.id)) ? "取消全选" : "全选当前列表"}
                </Button>
                <Button variant="secondary" onClick={() => void handleBulkUpdate("OPEN")} disabled={selectedIds.length === 0 || updating || syncing}>
                  恢复待核销
                </Button>
                <Button variant="secondary" onClick={() => void handleBulkUpdate("IGNORED")} disabled={selectedIds.length === 0 || updating || syncing}>
                  标记忽略
                </Button>
                <Button variant="primary" onClick={() => void handleBulkUpdate("RECONCILED")} loading={updating} disabled={selectedIds.length === 0 || syncing}>
                  标记已核销
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">核销备注</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--editorial-text)] placeholder:text-[color:var(--editorial-muted)]"
                placeholder="例如：已对上 Stripe Dashboard / 银行到账单"
              />
            </div>

            <div className="space-y-3">
              {report.entries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-[color:var(--editorial-muted)]">
                  当前时间窗口没有结算流水。
                </div>
              ) : (
                report.entryGroups.map((group) => (
                  <div key={group.key} className="rounded-2xl border border-black/10 bg-white/50 p-4">
                    <div className="mb-4 flex flex-col gap-3 border-b border-black/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={(() => { const ts = getToneStyle(getEntryGroupTone(group.key)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}
                          >
                            {group.title}
                          </span>
                          <span className="text-xs text-[color:var(--editorial-muted)]">{group.entryCount} 条流水</span>
                          <span className="text-xs text-[color:var(--editorial-muted)]">未核销 {group.unreconciledEntryCount} 条</span>
                        </div>
                        <div className="mt-2 text-sm text-[color:var(--editorial-muted)]">
                          本组净额 {formatPrice(group.netAmount)}
                          {group.payoutStatus ? ` / payout status ${group.payoutStatus}` : " / 尚未进入 payout"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => toggleAll(group.entries)}
                          disabled={group.entries.length === 0 || updating}
                        >
                          {group.entries.every((entry) => selectedIds.includes(entry.id))
                            ? "取消全选本组"
                            : "全选本组"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {group.entries.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
                          <div className="flex gap-4">
                            <label className="pt-1">
                              <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleEntry(entry.id)} className="h-4 w-4 rounded border-black/20" />
                            </label>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-[color:var(--editorial-muted)]">{entry.externalSourceType || entry.type}</span>
                                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={(() => { const ts = getToneStyle(getSettlementStatusTone(entry.status)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}>{entry.status.toUpperCase()}</span>
                                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={(() => { const ts = getToneStyle(getWriteOffTone(entry.reconciliationStatus)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}>{entry.reconciliationStatus}</span>
                                <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={(() => { const ts = getToneStyle(getRoutingTone(entry.paymentRoutingMode ?? null)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}>{getRoutingLabel(entry.paymentRoutingMode ?? null)}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-[color:var(--editorial-text)]">
                                    {formatPrice(entry.net, entry.currency)} 净额 / 手续费 {formatPrice(entry.fee, entry.currency)}
                                  </div>
                                  <div className="mt-1 text-xs text-[color:var(--editorial-muted)]">
                                    订单 {entry.orderId ? entry.orderId.slice(0, 8).toUpperCase() : "未匹配"} / {entry.buyerName || entry.buyerEmail || entry.description || "无买家信息"}
                                  </div>
                                  <div className="mt-1 text-xs text-[color:var(--editorial-muted)] break-all">
                                    {entry.externalSourceId || entry.externalBalanceTransactionId}
                                  </div>
                                  <div className="mt-1 text-xs text-[color:var(--editorial-muted)] break-all">
                                    {entry.connectedAccountId
                                      ? `Connected ${entry.connectedAccountId}`
                                      : entry.stripeAccountId
                                        ? `Stripe Account ${entry.stripeAccountId}`
                                        : "当前未关联 connected account"}
                                  </div>
                                  {(entry.platformFeeAmount != null ||
                                    entry.sellerNetExpectedAmount != null) ? (
                                    <div className="mt-1 text-xs text-[color:var(--editorial-muted)]">
                                      平台手续费 {formatPrice(entry.platformFeeAmount || 0, entry.currency)}
                                      {" / "}
                                      卖家预估净额 {formatPrice(entry.sellerNetExpectedAmount || 0, entry.currency)}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="text-right text-xs text-[color:var(--editorial-muted)]">
                                  <div>发生时间 {formatDate(entry.occurredAt)}</div>
                                  <div>可结算 {formatDate(entry.availableOn)}</div>
                                  <div>到账 payout {entry.payoutExternalId || "待进入 payout"}</div>
                                  {entry.accountScope ? (
                                    <div>Scope {entry.accountScope}</div>
                                  ) : null}
                                </div>
                              </div>
                              {entry.reconciliationNote ? (
                                <div className="mt-2 text-xs text-[color:var(--editorial-muted)]">备注：{entry.reconciliationNote}</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--editorial-text)]">Payout 汇总</h2>
              <span className="text-xs text-[color:var(--editorial-muted)]">{report.payouts.length} 笔</span>
            </div>
            <div className="space-y-3">
              {report.payouts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-[color:var(--editorial-muted)]">
                  当前窗口没有匹配到 payout。
                </div>
              ) : (
                report.payouts.map((payout) => (
                  <div key={payout.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={(() => { const ts = getToneStyle(getPayoutTone(payout.status)); return { borderColor: ts.border, background: ts.bg, color: ts.text }; })()}>{payout.status}</span>
                          <span className="text-[11px] text-[color:var(--editorial-muted)]">{payout.externalPayoutId}</span>
                          {payout.accountScope ? (
                            <span className="text-[11px] text-[color:var(--editorial-muted)]">
                              Scope {payout.accountScope}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-[color:var(--editorial-text)]">
                          账户 payout {formatPrice(payout.amount, payout.currency)}
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--editorial-muted)]">
                          已匹配卖家净额 {formatPrice(payout.linkedNetAmount, payout.currency)} / 手续费 {formatPrice(payout.linkedFeeAmount, payout.currency)}
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--editorial-muted)]">
                          关联流水 {payout.linkedEntryCount} 条 / 未核销 {payout.unreconciledEntryCount} 条
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--editorial-muted)] break-all">
                          {payout.stripeAccountId
                            ? `Stripe Account ${payout.stripeAccountId}`
                            : "平台 payout"}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-[color:var(--editorial-muted)]">
                        <div>创建 {formatDate(payout.payoutCreatedAt)}</div>
                        <div>预计到账 {formatDate(payout.arrivalDate)}</div>
                        <div>实际到账 {formatDate(payout.paidAt)}</div>
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
