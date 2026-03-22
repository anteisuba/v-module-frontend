"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SerializedOrder } from "@/domain/shop";
import {
  BackButton,
  Alert,
  LoadingState,
  LanguageSelector,
  Button,
  Input,
  StatusBadge,
  getToneStyle,
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
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Dispute evidence state
  const [evidenceDisputeId, setEvidenceDisputeId] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState<Record<string, string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File>>({});
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  useEffect(() => {
    void (async () => {
      const resolvedParams = await params;
      setOrderId(resolvedParams.id);
    })();
  }, [params]);

  const loadOrder = useCallback(async (id: string) => {
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
  }, [handleError, router]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/admin");
      return;
    }

    if (!userLoading && user && orderId) {
      void loadOrder(orderId);
    }
  }, [loadOrder, orderId, router, user, userLoading]);

  useEffect(() => {
    if (!order) {
      return;
    }

    if (order.refundableAmount > 0) {
      setRefundAmount(order.refundableAmount.toFixed(2));
    } else {
      setRefundAmount("");
    }
  }, [order]);

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

  // 订单状态颜色通过 StatusBadge 组件统一管理

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

  function getRoutingModeLabel(mode: SerializedOrder["paymentRoutingMode"]) {
    return mode === "STRIPE_CONNECT_DESTINATION"
      ? "卖家 Stripe Connect"
      : "平台统一收款";
  }

  function getRoutingModeDescription(orderRecord: SerializedOrder) {
    if (orderRecord.paymentProvider !== "STRIPE") {
      return "当前订单不走 Stripe Checkout";
    }

    if (orderRecord.paymentRoutingMode === "STRIPE_CONNECT_DESTINATION") {
      return "资金直接路由到卖家的 Stripe connected account。";
    }

    return "当前仍走平台统一收款 fallback，未使用卖家 connected account。";
  }

  function formatOptionalPrice(
    amount: number | null | undefined,
    currency = "JPY"
  ) {
    return amount == null ? " - " : formatPrice(amount, currency);
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
        attempt.connectedAccountId
          ? `Connected ${attempt.connectedAccountId}`
          : null,
        attempt.externalChargeId ? `Charge ${attempt.externalChargeId}` : null,
        attempt.externalTransferId ? `Transfer ${attempt.externalTransferId}` : null,
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

  const EVIDENCE_GUIDANCE: Record<string, { summary: string; fields: string[] }> = {
    fraudulent: {
      summary: "买方声称未授权此交易",
      fields: ["customer_name", "customer_email_address", "uncategorized_text", "receipt"],
    },
    product_not_received: {
      summary: "买方声称未收到商品",
      fields: ["shipping_tracking_number", "shipping_carrier", "shipping_documentation", "uncategorized_text"],
    },
    product_unacceptable: {
      summary: "买方声称商品与描述不符",
      fields: ["product_description", "uncategorized_text", "customer_communication"],
    },
    duplicate: {
      summary: "买方声称被重复收费",
      fields: ["uncategorized_text", "receipt"],
    },
    general: {
      summary: "一般性争议",
      fields: ["uncategorized_text", "product_description", "receipt", "customer_communication"],
    },
  };

  const EVIDENCE_FIELD_LABELS: Record<string, string> = {
    uncategorized_text: "补充说明",
    product_description: "商品描述",
    customer_name: "客户姓名",
    customer_email_address: "客户邮箱",
    shipping_tracking_number: "物流追踪号",
    shipping_carrier: "物流公司",
    receipt: "收据 / 交易凭证",
    shipping_documentation: "发货 / 签收证明",
    customer_communication: "客户沟通记录",
    uncategorized_file: "其他文件",
  };

  const TEXT_EVIDENCE_FIELDS = [
    "uncategorized_text", "product_description", "customer_name",
    "customer_email_address", "shipping_tracking_number", "shipping_carrier",
  ];

  const FILE_EVIDENCE_FIELDS = [
    "receipt", "shipping_documentation", "customer_communication", "uncategorized_file",
  ];

  function isActionableDispute(status: string) {
    return status === "needs_response" || status === "warning_needs_response";
  }

  async function handleSubmitEvidence(submit: boolean) {
    if (!evidenceDisputeId || !order) return;

    if (submit && !confirm("证据一旦提交将无法撤回，确认提交？")) return;

    try {
      setSubmittingEvidence(true);
      clearError();

      const result = await shopApi.submitDisputeEvidence(evidenceDisputeId, {
        textFields: evidenceText,
        files: evidenceFiles,
        submit,
      });

      // Refresh order data
      const updated = await shopApi.getOrder(order.id);
      setOrder(updated);

      setEvidenceDisputeId(null);
      setEvidenceText({});
      setEvidenceFiles({});
      showToast(result.submitted ? "证据已提交至 Stripe" : "证据草稿已保存");
    } catch (err) {
      handleError(err);
    } finally {
      setSubmittingEvidence(false);
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
      className="editorial-shell--light relative min-h-screen w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/88" />
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
              <h1 className="text-2xl font-bold text-[color:var(--editorial-text)]">
                订单 #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <StatusBadge domain="order" status={order.status}>
                {getStatusLabel(order.status)}
              </StatusBadge>
              <StatusBadge domain="payment" status={order.paymentStatus || "OPEN"}>
                {getPaymentStatusLabel(order.paymentStatus)}
              </StatusBadge>
            </div>
            <p className="text-sm text-[color:var(--editorial-muted)]">
              下单时间 {formatDate(order.createdAt)} / 买家{" "}
              {order.buyerName || order.buyerEmail}
            </p>
            <p className="mt-2 text-sm text-[color:var(--editorial-muted)]">
              Provider: {order.paymentProvider || "MANUAL"} / Currency: {order.currency}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="text-right">
              <div className="text-xs text-[color:var(--editorial-muted)]">订单总额</div>
              <div className="text-2xl font-bold text-[color:var(--editorial-text)]">
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
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--editorial-text)]">订单商品</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-black/10 bg-white/70 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-lg bg-black/5">
                        {item.product?.images?.[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-[color:var(--editorial-text)]">
                          {item.product?.name || item.productId}
                        </div>
                        <div className="text-xs text-[color:var(--editorial-muted)]">
                          数量 {item.quantity} / 单价{" "}
                          {formatPrice(item.price, order.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[color:var(--editorial-text)]">
                      {formatPrice(item.subtotal, order.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--editorial-text)]">支付时间线</h2>
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="mt-1 flex w-20 shrink-0 justify-end text-xs text-[color:var(--editorial-muted)]">
                      {formatDate(event.occurredAt)}
                    </div>
                    <div className="relative flex-1 rounded-xl border border-black/10 bg-white/70 p-4">
                      {(() => {
                        const toneKey = event.tone === "default" ? "neutral" : (event.tone as "success" | "warning" | "danger");
                        const ts = getToneStyle(toneKey);
                        return (
                          <div
                            className="mb-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={{ borderColor: ts.border, background: ts.bg, color: ts.text }}
                          >
                            {event.title}
                          </div>
                        );
                      })()}
                      <p className="text-sm text-[color:var(--editorial-muted)]">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--editorial-text)]">买家与配送</h2>
              <dl className="space-y-3 text-sm text-[color:var(--editorial-muted)]">
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">买家姓名</dt>
                  <dd>{order.buyerName || "未填写"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">买家邮箱</dt>
                  <dd>{order.buyerEmail}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">配送方式</dt>
                  <dd>{order.shippingMethod || "未填写"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">配送地址</dt>
                  <dd className="whitespace-pre-wrap">{formatAddress(order.shippingAddress)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--editorial-text)]">支付信息</h2>
              <dl className="space-y-3 text-sm text-[color:var(--editorial-muted)]">
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">支付提供方</dt>
                  <dd>{order.paymentProvider || "未记录"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">收款路由</dt>
                  <dd>{getRoutingModeLabel(order.paymentRoutingMode)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">支付状态</dt>
                  <dd>{getPaymentStatusLabel(order.paymentStatus)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">路由说明</dt>
                  <dd>{getRoutingModeDescription(order)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Payout Account</dt>
                  <dd className="break-all">{order.payoutAccountId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Connected Account</dt>
                  <dd className="break-all">{order.connectedAccountId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Charge ID</dt>
                  <dd className="break-all">{order.externalChargeId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Transfer ID</dt>
                  <dd className="break-all">{order.externalTransferId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Checkout Session</dt>
                  <dd className="break-all">{order.paymentSessionId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">Payment Intent</dt>
                  <dd className="break-all">{order.paymentIntentId || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">支付完成时间</dt>
                  <dd>{formatDate(order.paidAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">支付失败原因</dt>
                  <dd>{order.paymentFailureReason || " - "}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">平台手续费快照</dt>
                  <dd>{formatOptionalPrice(order.platformFeeAmount, order.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">卖家收款总额快照</dt>
                  <dd>{formatOptionalPrice(order.sellerGrossAmount, order.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[color:var(--editorial-muted)]">卖家预估净额快照</dt>
                  <dd>{formatOptionalPrice(order.sellerNetExpectedAmount, order.currency)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[color:var(--editorial-text)]">争议 / Chargeback</h2>
                <span className="text-xs text-[color:var(--editorial-muted)]">{order.disputes.length} 条记录</span>
              </div>

              <div className="space-y-3">
                {order.disputes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-4 text-sm text-[color:var(--editorial-muted)]">
                    当前没有 Stripe dispute / chargeback 记录
                  </div>
                ) : (
                  order.disputes.map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border border-black/10 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge domain="dispute" status={dispute.status}>
                              {getDisputeStatusLabel(dispute.status)}
                            </StatusBadge>
                            <span className="text-xs text-[color:var(--editorial-muted)]">
                              {formatPrice(dispute.amount, dispute.currency)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-[color:var(--editorial-muted)]">
                            原因：{dispute.reason || "未记录"}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-[color:var(--editorial-muted)]">
                            <div>Dispute ID: {dispute.externalDisputeId}</div>
                            <div>Charge: {dispute.externalChargeId || " - "}</div>
                            <div>PaymentIntent: {dispute.externalPaymentIntentId || " - "}</div>
                            <div>响应截止: {formatDate(dispute.dueBy)}</div>
                            <div>关闭时间: {formatDate(dispute.closedAt)}</div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-xs text-[color:var(--editorial-muted)]">
                          <div>创建 {formatDate(dispute.createdAt)}</div>
                          <div>更新 {formatDate(dispute.updatedAt)}</div>
                        </div>
                      </div>

                      {/* Evidence submit button */}
                      {isActionableDispute(dispute.status) && evidenceDisputeId !== dispute.externalDisputeId && (
                        <div className="mt-3 border-t border-black/5 pt-3">
                          <Button
                            variant="primary"
                            onClick={() => {
                              setEvidenceDisputeId(dispute.externalDisputeId);
                              setEvidenceText({});
                              setEvidenceFiles({});
                            }}
                            data-testid="dispute-evidence-open"
                          >
                            提交证据
                          </Button>
                        </div>
                      )}

                      {/* Evidence form */}
                      {evidenceDisputeId === dispute.externalDisputeId && (
                        <div className="mt-3 space-y-3 border-t border-black/5 pt-3" data-testid="dispute-evidence-form">
                          {/* Guidance */}
                          <div className="rounded-lg bg-[color:var(--editorial-accent)]/5 p-3 text-xs text-[color:var(--editorial-muted)]">
                            {(EVIDENCE_GUIDANCE[dispute.reason || "general"] || EVIDENCE_GUIDANCE.general).summary}
                          </div>

                          {/* Text fields */}
                          {TEXT_EVIDENCE_FIELDS.filter((f) =>
                            (EVIDENCE_GUIDANCE[dispute.reason || "general"] || EVIDENCE_GUIDANCE.general).fields.includes(f)
                          ).map((fieldName) => (
                            <div key={fieldName}>
                              <label className="mb-1 block text-xs font-medium text-[color:var(--editorial-muted)]">
                                {EVIDENCE_FIELD_LABELS[fieldName]}
                              </label>
                              {fieldName === "uncategorized_text" || fieldName === "product_description" ? (
                                <textarea
                                  value={evidenceText[fieldName] || ""}
                                  onChange={(e) => setEvidenceText((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                                  rows={3}
                                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--editorial-text)]"
                                  disabled={submittingEvidence}
                                  data-testid={`evidence-${fieldName}`}
                                />
                              ) : (
                                <Input
                                  value={evidenceText[fieldName] || ""}
                                  onChange={(e) => setEvidenceText((prev) => ({ ...prev, [fieldName]: e.target.value }))}
                                  disabled={submittingEvidence}
                                  data-testid={`evidence-${fieldName}`}
                                />
                              )}
                            </div>
                          ))}

                          {/* File fields */}
                          {FILE_EVIDENCE_FIELDS.filter((f) =>
                            (EVIDENCE_GUIDANCE[dispute.reason || "general"] || EVIDENCE_GUIDANCE.general).fields.includes(f)
                          ).map((fieldName) => (
                            <div key={fieldName}>
                              <label className="mb-1 block text-xs font-medium text-[color:var(--editorial-muted)]">
                                {EVIDENCE_FIELD_LABELS[fieldName]}
                              </label>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.size > 4 * 1024 * 1024) {
                                      showToast("文件不能超过 4MB");
                                      e.target.value = "";
                                      return;
                                    }
                                    setEvidenceFiles((prev) => ({ ...prev, [fieldName]: file }));
                                  }
                                }}
                                className="w-full text-xs text-[color:var(--editorial-muted)]"
                                disabled={submittingEvidence}
                                data-testid={`evidence-file-${fieldName}`}
                              />
                              {evidenceFiles[fieldName] && (
                                <div className="mt-1 text-[11px] text-[color:var(--editorial-muted)]">
                                  已选: {evidenceFiles[fieldName].name}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setEvidenceDisputeId(null);
                                setEvidenceText({});
                                setEvidenceFiles({});
                              }}
                              disabled={submittingEvidence}
                            >
                              取消
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleSubmitEvidence(false)}
                              loading={submittingEvidence}
                              data-testid="evidence-save-draft"
                            >
                              保存草稿
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleSubmitEvidence(true)}
                              loading={submittingEvidence}
                              data-testid="evidence-submit"
                            >
                              提交证据
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[color:var(--editorial-text)]">退款</h2>
                <StatusBadge domain="payment" status={order.paymentStatus || "OPEN"}>
                  {getPaymentStatusLabel(order.paymentStatus)}
                </StatusBadge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-[color:var(--editorial-muted)]">已退款</div>
                  <div className="mt-1 font-semibold text-[color:var(--editorial-text)]">
                    {formatPrice(order.refundedAmount, order.currency)}
                  </div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-[color:var(--editorial-muted)]">退款处理中</div>
                  <div className="mt-1 font-semibold text-[color:var(--editorial-text)]">
                    {formatPrice(order.pendingRefundAmount, order.currency)}
                  </div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/70 p-3">
                  <div className="text-xs text-[color:var(--editorial-muted)]">剩余可退</div>
                  <div className="mt-1 font-semibold text-[color:var(--editorial-text)]">
                    {formatPrice(order.refundableAmount, order.currency)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/70 p-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">
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
                  <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">
                    退款原因
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    rows={3}
                    data-testid="order-refund-reason"
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--editorial-text)] placeholder:text-[color:var(--editorial-muted)]"
                    placeholder="例如：买家取消、库存异常、售后补偿"
                    disabled={Boolean(refundEligibilityMessage) || refunding}
                  />
                </div>
                {refundEligibilityMessage ? (
                  <div className="text-xs text-[color:var(--editorial-muted)]">{refundEligibilityMessage}</div>
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
                  <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-4 text-sm text-[color:var(--editorial-muted)]">
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
                            <StatusBadge domain="payment" status={
                              refund.status === "SUCCEEDED"
                                ? "REFUNDED"
                                : refund.status === "PENDING"
                                  ? "OPEN"
                                  : "FAILED"
                            }>
                              {refund.status}
                            </StatusBadge>
                            <span className="text-xs text-[color:var(--editorial-muted)]">
                              {formatDate(refund.refundedAt || refund.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-[color:var(--editorial-muted)]">
                            {refund.reason || "未填写退款原因"}
                          </div>
                          {refund.failureReason ? (
                            <div className="mt-1 text-xs text-[color:#9a4b3d]">
                              {refund.failureReason}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[color:var(--editorial-text)]">
                            {formatPrice(refund.amount, refund.currency)}
                          </div>
                          <div className="mt-1 text-[11px] text-[color:var(--editorial-muted)]">
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
