// app/u/[slug]/shop/order-success/[orderId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { SerializedOrder } from "@/domain/shop";
import { Alert, Button, FormField, Input, LoadingState } from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export default function OrderSuccessPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const menu = useHeroMenu();
  const { error, handleError, clearError } = useErrorHandler();
  const [slug, setSlug] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [confirmedSessionId, setConfirmedSessionId] = useState<string | null>(
    null
  );
  const stripeSessionId = searchParams.get("session_id")?.trim() || null;

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
      setOrderId(resolvedParams.orderId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const savedBuyerEmail = window.sessionStorage.getItem(
      `shop:order-access:${orderId}`
    );

    if (!savedBuyerEmail) {
      setLoading(false);
      return;
    }

    setBuyerEmail(savedBuyerEmail);
    void loadOrder(savedBuyerEmail, orderId);
  }, [orderId]);

  useEffect(() => {
    if (
      !orderId ||
      !buyerEmail ||
      !order ||
      order.paymentProvider !== "STRIPE" ||
      order.status !== "AWAITING_PAYMENT" ||
      order.paymentStatus !== "OPEN"
    ) {
      return;
    }

    if (stripeSessionId && confirmedSessionId !== stripeSessionId) {
      let cancelled = false;

      setConfirmingPayment(true);
      setConfirmedSessionId(stripeSessionId);

      void shopApi
        .confirmPublicOrder(orderId, buyerEmail, stripeSessionId)
        .then((confirmedOrder) => {
          if (cancelled) {
            return;
          }

          setOrder(confirmedOrder);
        })
        .catch((err) => {
          if (!cancelled) {
            handleError(err);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setConfirmingPayment(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    let attempts = 0;

    const intervalId = window.setInterval(async () => {
      attempts += 1;

      try {
        setRefreshingStatus(true);
        const latestOrder = await shopApi.getPublicOrder(orderId, buyerEmail);

        if (cancelled) {
          return;
        }

        setOrder(latestOrder);

        if (
          latestOrder.status !== "AWAITING_PAYMENT" ||
          latestOrder.paymentStatus !== "OPEN" ||
          attempts >= 20
        ) {
          window.clearInterval(intervalId);
        }
      } catch {
        if (attempts >= 20) {
          window.clearInterval(intervalId);
        }
      } finally {
        if (!cancelled) {
          setRefreshingStatus(false);
        }
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
      buyerEmail,
      confirmedSessionId,
      handleError,
      orderId,
      order?.paymentProvider,
      order?.paymentStatus,
      order?.status,
      stripeSessionId,
  ]);

  async function loadOrder(emailToLoad?: string, currentOrderId?: string) {
    const resolvedOrderId = currentOrderId || orderId;
    const normalizedEmail = (emailToLoad || buyerEmail).trim();

    if (!resolvedOrderId) {
      return;
    }

    if (!normalizedEmail) {
      handleError(new Error("请输入下单时使用的邮箱"));
      setLoading(false);
      return;
    }

    try {
      setLoadingOrder(true);
      clearError();
      const orderDetail = await shopApi.getPublicOrder(
        resolvedOrderId,
        normalizedEmail
      );
      setOrder(orderDetail);
      setBuyerEmail(normalizedEmail);
      window.sessionStorage.setItem(
        `shop:order-access:${resolvedOrderId}`,
        normalizedEmail
      );
    } catch (err) {
      window.sessionStorage.removeItem(`shop:order-access:${resolvedOrderId}`);
      setOrder(null);
      handleError(err);
    } finally {
      setLoading(false);
      setLoadingOrder(false);
    }
  }

  function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadOrder();
  }

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatStatus(status: string) {
    const labels: Record<string, string> = {
      AWAITING_PAYMENT: "等待支付确认",
      PENDING: "待处理",
      PAID: "已支付",
      SHIPPED: "已发货",
      DELIVERED: "已送达",
      CANCELLED: "已取消",
    };
    return labels[status] || status;
  }

  function getStatusPresentation(currentOrder: SerializedOrder | null) {
    if (!currentOrder) {
      return {
        title: "订单详情",
        subtitle: "请使用下单邮箱查询订单状态。",
        iconClassName: "bg-slate-100",
        iconColorClassName: "text-slate-600",
        iconPath: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      };
    }

    if (
      currentOrder.paymentProvider === "STRIPE" &&
      currentOrder.status === "AWAITING_PAYMENT" &&
      currentOrder.paymentStatus === "OPEN"
    ) {
      return {
        title: "支付结果确认中",
        subtitle: "Stripe 已返回成功页面，系统正在等待 webhook 确认付款。",
        iconClassName: "bg-amber-100",
        iconColorClassName: "text-amber-600",
        iconPath: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ),
      };
    }

    if (currentOrder.status === "PAID") {
      return {
        title: "订单已支付",
        subtitle: "付款已确认，订单已进入处理流程。",
        iconClassName: "bg-emerald-100",
        iconColorClassName: "text-emerald-600",
        iconPath: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ),
      };
    }

    if (currentOrder.status === "CANCELLED") {
      return {
        title: "支付未完成",
        subtitle: "订单已取消；如已尝试付款，请稍后检查邮箱或联系卖家确认。",
        iconClassName: "bg-rose-100",
        iconColorClassName: "text-rose-600",
        iconPath: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        ),
      };
    }

    return {
      title: "订单详情",
      subtitle: `当前状态：${formatStatus(currentOrder.status)}`,
      iconClassName: "bg-sky-100",
      iconColorClassName: "text-sky-600",
      iconPath: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6M7 8h10M5 6h14v12H5V6z"
        />
      ),
    };
  }

  function formatAddress(address: SerializedOrder["shippingAddress"]) {
    if (!address || typeof address !== "object" || Array.isArray(address)) {
      return "未提供";
    }

    const parts = Object.values(address)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    return parts.length > 0 ? parts.join(" / ") : "未提供";
  }

  if (loading || loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message={t("common.loading")} />
      </div>
    );
  }

  const awaitingPayment =
    order?.paymentProvider === "STRIPE" &&
    order.status === "AWAITING_PAYMENT" &&
    order.paymentStatus === "OPEN";
  const statusPresentation = getStatusPresentation(order);

  return (
    <div
      data-testid="public-shop-order-success-page"
      className="relative min-h-screen py-16 px-6"
    >
      {/* 右上角菜单按钮 */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4 text-white">
        <button
          className="text-2xl opacity-90 hover:opacity-100 transition drop-shadow-lg"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          ☰
        </button>
      </div>

      {/* 菜单 */}
      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div
            className={[
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
              statusPresentation.iconClassName,
            ].join(" ")}
          >
            <svg
              className={[
                "w-10 h-10",
                statusPresentation.iconColorClassName,
              ].join(" ")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {statusPresentation.iconPath}
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">
            <span data-testid="public-shop-order-status-title">
            {statusPresentation.title}
            </span>
          </h1>
          <p className="text-black/60 text-center">
            订单号: {orderId?.slice(0, 8).toUpperCase() || "--"}
          </p>
          <p className="mt-2 text-center text-sm text-black/60">
            {statusPresentation.subtitle}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        {!order ? (
          <div className="bg-white/50 rounded-lg p-6 border border-black/10 mb-6">
            <p className="text-black/70 mb-4">
              支付完成后，请输入下单时使用的邮箱，以查看本次订单详情。
            </p>
            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <FormField label="下单邮箱" required>
                <Input
                  data-testid="order-success-email"
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </FormField>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                data-testid="order-success-lookup"
              >
                查看订单详情
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {awaitingPayment ? (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-sm text-amber-800">
                {statusPresentation.subtitle}
                {confirmingPayment
                  ? " 正在向 Stripe 确认支付结果..."
                  : refreshingStatus
                    ? " 正在刷新订单状态..."
                    : " 如果几秒后仍未更新，可稍后刷新页面。"}
              </div>
            ) : null}

            <div
              data-testid="public-shop-order-detail-card"
              className="bg-white/55 rounded-lg p-6 border border-black/10"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">订单详情</h2>
                  <p className="text-sm text-black/60">
                    提交时间：{formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-black/60">
                    状态：{formatStatus(order.status)}
                  </p>
                  {order.paymentProvider ? (
                    <p className="text-sm text-black/60">
                      支付：{order.paymentProvider} / {order.paymentStatus || "UNKNOWN"}
                    </p>
                  ) : null}
                </div>
                <div className="text-left md:text-right">
                  <div className="text-sm text-black/60">订单总额</div>
                  <div className="text-2xl font-bold">{formatPrice(order.totalAmount)}</div>
                </div>
              </div>
            </div>

            <div
              data-testid="public-shop-order-buyer-card"
              className="bg-white/55 rounded-lg p-6 border border-black/10"
            >
              <h3 className="font-semibold mb-4">买家信息</h3>
              <div className="space-y-2 text-sm text-black/70">
                <p>邮箱：{order.buyerEmail}</p>
                <p>姓名：{order.buyerName || "未提供"}</p>
                <p>配送方式：{order.shippingMethod || "未提供"}</p>
                <p>配送地址：{formatAddress(order.shippingAddress)}</p>
              </div>
            </div>

            <div className="bg-white/55 rounded-lg p-6 border border-black/10">
              <h3 className="font-semibold mb-4">商品明细</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-black/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-black">
                        {item.product?.name || `商品 ${item.productId}`}
                      </p>
                      <p className="text-sm text-black/60">
                        数量 {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-black">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Link
            href={`/u/${slug}/shop`}
            className="rounded-lg border border-black/20 bg-white/70 px-6 py-2 text-sm font-medium text-black hover:bg-white/80 transition-colors"
          >
            继续购物
          </Link>
          <Link
            href={`/u/${slug}`}
            className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            返回主页
          </Link>
        </div>
      </div>
    </div>
  );
}
