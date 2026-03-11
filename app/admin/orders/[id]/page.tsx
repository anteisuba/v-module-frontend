"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedOrder } from "@/domain/shop";
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

type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  tone: "default" | "success" | "warning" | "danger";
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    void (async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.id);
    })();
  }, [params]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/admin");
      return;
    }

    if (!userLoading && user && orderId) {
      void loadOrder(orderId);
    }
  }, [orderId, router, user, userLoading]);

  useEffect(() => {
    if (!order) {
      return;
    }

    if (order.refundableAmount > 0) {
      setRefundAmount(order.refundableAmount.toFixed(2));
    } else {
      setRefundAmount("");
    }
  }, [order?.id, order?.refundableAmount]);

  async function loadOrder(id: string) {
    try {
      setLoading(true);
      const nextOrder = await shopApi.getOrder(id);
      setOrder(nextOrder);
    } catch (err) {
      handleError(err);
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
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

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      AWAITING_PAYMENT: "等待支付",
      PENDING: "待处理",
      PAID: "已支付",
      SHIPPED: "已发货",
      DELIVERED: "已送达",
      CANCELLED: "已取消",
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      AWAITING_PAYMENT: "bg-amber-100 text-amber-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PAID: "bg-blue-100 text-blue-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function getPaymentStatusLabel(status: string | null) {
    if (!status) {
      return "未记录";
    }

    const labels: Record<string, string> = {
      OPEN: "待支付",
      PAID: "支付成功",
      FAILED: "支付失败",
      EXPIRED: "支付已过期",
      PARTIALLY_REFUNDED: "部分退款",
      REFUNDED: "已全额退款",
    };

    return labels[status] || status;
  }

  function getPaymentStatusColor(status: string | null) {
    const colors: Record<string, string> = {
      OPEN: "bg-amber-100 text-amber-700",
      PAID: "bg-blue-100 text-blue-700",
      FAILED: "bg-red-100 text-red-700",
      EXPIRED: "bg-gray-100 text-gray-700",
      PARTIALLY_REFUNDED: "bg-orange-100 text-orange-700",
      REFUNDED: "bg-emerald-100 text-emerald-700",
    };

    return colors[status || ""] || "bg-gray-100 text-gray-700";
  }

  function getDisputeStatusLabel(status: string) {
    const labels: Record<string, string> = {
      warning_needs_response: "预警待响应",
      warning_under_review: "预警审核中",
      warning_closed: "预警已关闭",
      needs_response: "争议待响应",
      under_review: "争议审核中",
      won: "争议胜诉",
      lost: "争议败诉",
    };

    return labels[status] || status;
  }

  function getDisputeStatusColor(status: string) {
    if (status === "won" || status === "warning_closed") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (status === "lost") {
      return "bg-red-100 text-red-700";
    }

    if (status === "under_review" || status === "warning_under_review") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-amber-100 text-amber-700";
  }

  function getNextStatus(currentOrder: SerializedOrder | null) {
    if (!currentOrder || currentOrder.paymentStatus === "REFUNDED") {
      return null;
    }

    const statusFlow: Record<string, string> = {
      PENDING: "PAID",
      PAID: "SHIPPED",
      SHIPPED: "DELIVERED",
    };

    return statusFlow[currentOrder.status] || null;
  }

  function formatAddress(address: SerializedOrder["shippingAddress"]) {
    if (!address || typeof address !== "object" || Array.isArray(address)) {
      return "未填写";
    }

    return Object.entries(address as Record<string, unknown>)
      .filter(([, value]) => value != null && String(value).trim().length > 0)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join("\n");
  }

  function getRefundEligibilityMessage(currentOrder: SerializedOrder | null) {
    if (!currentOrder) {
      return "";
    }

    if (currentOrder.paymentProvider !== "STRIPE") {
      return "当前仅支持 Stripe 订单退款";
    }

    if (
      currentOrder.paymentStatus !== "PAID" &&
      currentOrder.paymentStatus !== "PARTIALLY_REFUNDED"
    ) {
      return "仅已支付订单可发起退款";
    }

    if (!currentOrder.paymentIntentId) {
      return "订单缺少 PaymentIntent，无法发起退款";
    }

    if (currentOrder.refundableAmount <= 0) {
      return "当前没有可退款余额";
    }

    return "";
  }

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!order) {
      return [];
    }

    const events: TimelineEvent[] = [
      {
        id: `order-created-${order.id}`,
        title: "订单已创建",
        description: `买家 ${order.buyerName || order.buyerEmail} 提交了订单`,
        occurredAt: order.createdAt,
        tone: "default",
      },
    ];

    for (const attempt of order.paymentAttempts) {
      const baseDescription = [
        attempt.provider,
        attempt.externalSessionId ? `Session ${attempt.externalSessionId}` : null,
        attempt.externalPaymentIntentId
          ? `Intent ${attempt.externalPaymentIntentId}`
          : null,
      ]
        .filter(Boolean)
        .join(" / ");

      if (attempt.status === "OPEN") {
        events.push({
          id: `attempt-open-${attempt.id}`,
          title: "支付会话已创建",
          description: baseDescription || "等待买家完成支付",
          occurredAt: attempt.createdAt,
          tone: "warning",
        });
      }

      if (attempt.paidAt) {
        events.push({
          id: `attempt-paid-${attempt.id}`,
          title: "支付成功",
          description:
            baseDescription || `已收款 ${formatPrice(attempt.amount, attempt.currency)}`,
          occurredAt: attempt.paidAt,
          tone: "success",
        });
      }

      if (attempt.failedAt) {
        events.push({
          id: `attempt-failed-${attempt.id}`,
          title: "支付失败",
          description: attempt.failureReason || baseDescription || "支付未成功完成",
          occurredAt: attempt.failedAt,
          tone: "danger",
        });
      }

      if (attempt.expiredAt) {
        events.push({
          id: `attempt-expired-${attempt.id}`,
          title: "支付已过期",
          description: attempt.failureReason || baseDescription || "支付会话已过期",
          occurredAt: attempt.expiredAt,
          tone: "warning",
        });
      }
    }

    if (order.shippedAt) {
      events.push({
        id: `order-shipped-${order.id}`,
        title: "订单已发货",
        description: "卖家已推进到发货状态",
        occurredAt: order.shippedAt,
        tone: "default",
      });
    }

    if (order.deliveredAt) {
      events.push({
        id: `order-delivered-${order.id}`,
        title: "订单已送达",
        description: "订单履约完成",
        occurredAt: order.deliveredAt,
        tone: "success",
      });
    }

    for (const refund of order.refunds) {
      const refundDescription = [
        formatPrice(refund.amount, refund.currency),
        refund.reason ? `原因: ${refund.reason}` : null,
        refund.failureReason ? `失败原因: ${refund.failureReason}` : null,
      ]
        .filter(Boolean)
        .join(" / ");

      const titleMap: Record<string, string> = {
        PENDING: "退款处理中",
        SUCCEEDED: "退款成功",
        FAILED: "退款失败",
        CANCELED: "退款已取消",
      };
      const toneMap: Record<string, TimelineEvent["tone"]> = {
        PENDING: "warning",
        SUCCEEDED: "success",
        FAILED: "danger",
        CANCELED: "default",
      };

      events.push({
        id: `refund-${refund.id}`,
        title: titleMap[refund.status] || refund.status,
        description: refundDescription || "退款事件已记录",
        occurredAt: refund.refundedAt || refund.createdAt,
        tone: toneMap[refund.status] || "default",
      });
    }

    return events.sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  }, [order]);

  const nextStatus = getNextStatus(order);
  const refundEligibilityMessage = getRefundEligibilityMessage(order);

  async function handleAdvanceStatus() {
    if (!order || !nextStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);
      const updatedOrder = await shopApi.updateOrderStatus(order.id, nextStatus);
      setOrder(updatedOrder);
      showToast(`订单状态已更新为 ${getStatusLabel(nextStatus)}`);
    } catch (err) {
      handleError(err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleRefund() {
    if (!order) {
      return;
    }

    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("退款金额必须大于 0");
      return;
    }

    try {
      setRefunding(true);
      const result = await shopApi.createOrderRefund(order.id, {
        amount,
        reason: refundReason.trim() || null,
      });

      setOrder(result.order);
      setRefundReason("");
      showToast(
        result.refund.status === "SUCCEEDED"
          ? "退款已提交并完成"
          : "退款请求已提交，等待处理"
      );
    } catch (err) {
      handleError(err);
    } finally {
      setRefunding(false);
    }
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

  if (!user || !order) {
    return null;
  }

  return (
    <main
      data-testid="admin-order-detail-page"
      className="relative min-h-screen w-full overflow-hidden"
    >
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

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-black">
                订单 #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(
                  order.paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
            <p className="text-sm text-black/65">
              下单时间 {formatDate(order.createdAt)} / 买家{" "}
              {order.buyerName || order.buyerEmail}
            </p>
            <p className="mt-2 text-sm text-black/55">
              Provider: {order.paymentProvider || "MANUAL"} / Currency: {order.currency}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="text-right">
              <div className="text-xs text-black/50">订单总额</div>
              <div className="text-2xl font-bold text-black">
                {formatPrice(order.totalAmount, order.currency)}
              </div>
            </div>
            {nextStatus ? (
              <Button
                variant="secondary"
                onClick={handleAdvanceStatus}
                loading={updatingStatus}
              >
                推进为 {getStatusLabel(nextStatus)}
              </Button>
            ) : null}
          </div>
        </div>

        {error ? <Alert type="error" message={error} onClose={clearError} /> : null}
        {toastMessage ? (
          <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm text-white">
            {toastMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-black">订单商品</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-black/10 bg-white/70 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-lg bg-black/5">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-black">
                          {item.product?.name || item.productId}
                        </div>
                        <div className="text-xs text-black/55">
                          数量 {item.quantity} / 单价{" "}
                          {formatPrice(item.price, order.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-black">
                      {formatPrice(item.subtotal, order.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-black">支付时间线</h2>
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="mt-1 flex w-20 shrink-0 justify-end text-xs text-black/45">
                      {formatDate(event.occurredAt)}
                    </div>
                    <div className="relative flex-1 rounded-xl border border-black/10 bg-white/70 p-4">
                      <div
                        className={[
                          "mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                          event.tone === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : event.tone === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : event.tone === "danger"
                                ? "bg-red-100 text-red-700"
                                : "bg-black/5 text-black/65",
                        ].join(" ")}
                      >
                        {event.title}
                      </div>
                      <p className="text-sm text-black/75">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-black">买家与配送</h2>
              <dl className="space-y-3 text-sm text-black/75">
                <div>
                  <dt className="text-xs text-black/45">买家姓名</dt>
                  <dd>{order.buyerName || "未填写"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">买家邮箱</dt>
                  <dd>{order.buyerEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">配送方式</dt>
                  <dd>{order.shippingMethod || "未填写"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">配送地址</dt>
                  <dd className="whitespace-pre-wrap">{formatAddress(order.shippingAddress)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-black">支付信息</h2>
              <dl className="space-y-3 text-sm text-black/75">
                <div>
                  <dt className="text-xs text-black/45">支付提供方</dt>
                  <dd>{order.paymentProvider || "未记录"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">支付状态</dt>
                  <dd>{getPaymentStatusLabel(order.paymentStatus)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">Checkout Session</dt>
                  <dd className="break-all">{order.paymentSessionId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">Payment Intent</dt>
                  <dd className="break-all">{order.paymentIntentId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">支付完成时间</dt>
                  <dd>{formatDate(order.paidAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/45">支付失败原因</dt>
                  <dd>{order.paymentFailureReason || " - "}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">争议 / Chargeback</h2>
                <span className="text-xs text-black/45">{order.disputes.length} 条记录</span>
              </div>

              <div className="space-y-3">
                {order.disputes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-4 text-sm text-black/50">
                    当前没有 Stripe dispute / chargeback 记录
                  </div>
                ) : (
                  order.disputes.map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getDisputeStatusColor(dispute.status)}`}>
                              {getDisputeStatusLabel(dispute.status)}
                            </span>
                            <span className="text-xs text-black/45">
                              {formatPrice(dispute.amount, dispute.currency)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-black/75">
                            原因：{dispute.reason || "未记录"}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-black/50">
                            <div>Dispute ID: {dispute.externalDisputeId}</div>
                            <div>Charge: {dispute.externalChargeId || " - "}</div>
                            <div>PaymentIntent: {dispute.externalPaymentIntentId || " - "}</div>
                            <div>响应截止: {formatDate(dispute.dueBy)}</div>
                            <div>关闭时间: {formatDate(dispute.closedAt)}</div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-black/45">
                          <div>创建 {formatDate(dispute.createdAt)}</div>
                          <div>更新 {formatDate(dispute.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">退款</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-black/45">已退款</div>
                  <div className="mt-1 font-semibold text-black">
                    {formatPrice(order.refundedAmount, order.currency)}
                  </div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-black/45">退款处理中</div>
                  <div className="mt-1 font-semibold text-black">
                    {formatPrice(order.pendingRefundAmount, order.currency)}
                  </div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-black/45">剩余可退</div>
                  <div className="mt-1 font-semibold text-black">
                    {formatPrice(order.refundableAmount, order.currency)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/70 p-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-black/70">
                    退款金额
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    disabled={Boolean(refundEligibilityMessage) || refunding}
                    data-testid="order-refund-amount"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-black/70">
                    退款原因
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    rows={3}
                    data-testid="order-refund-reason"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black placeholder:text-black/35"
                    placeholder="例如：买家取消、库存异常、售后补偿"
                    disabled={Boolean(refundEligibilityMessage) || refunding}
                  />
                </div>
                {refundEligibilityMessage ? (
                  <div className="text-xs text-black/55">{refundEligibilityMessage}</div>
                ) : null}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleRefund}
                    loading={refunding}
                    disabled={Boolean(refundEligibilityMessage)}
                    data-testid="order-refund-submit"
                  >
                    发起退款
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {order.refunds.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-4 text-sm text-black/50">
                    还没有退款记录
                  </div>
                ) : (
                  order.refunds.map((refund) => (
                    <div
                      key={refund.id}
                      className="rounded-xl border border-black/10 bg-white/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getPaymentStatusColor(
                                refund.status === "SUCCEEDED"
                                  ? "REFUNDED"
                                  : refund.status === "PENDING"
                                    ? "OPEN"
                                    : "FAILED"
                              )}`}
                            >
                              {refund.status}
                            </span>
                            <span className="text-xs text-black/45">
                              {formatDate(refund.refundedAt || refund.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-black/75">
                            {refund.reason || "未填写退款原因"}
                          </div>
                          {refund.failureReason ? (
                            <div className="mt-1 text-xs text-red-600">
                              {refund.failureReason}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-black">
                            {formatPrice(refund.amount, refund.currency)}
                          </div>
                          <div className="mt-1 text-[11px] text-black/45">
                            {refund.externalRefundId || "等待外部退款 ID"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
