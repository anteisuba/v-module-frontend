// app/u/[slug]/shop/order-success/[orderId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const menu = useHeroMenu();
  const { error, handleError, clearError } = useErrorHandler();
  const [slug, setSlug] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);

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
      PENDING: "待处理",
      PAID: "已支付",
      SHIPPED: "已发货",
      DELIVERED: "已送达",
      CANCELLED: "已取消",
    };
    return labels[status] || status;
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

  return (
    <div className="relative min-h-screen py-16 px-6">
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
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">订单已提交</h1>
          <p className="text-black/60 text-center">
            订单号: {orderId?.slice(0, 8).toUpperCase() || "--"}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={clearError} />}

        {!order ? (
          <div className="bg-white/50 rounded-lg p-6 border border-black/10 mb-6">
            <p className="text-black/70 mb-4">
              您的订单已成功提交。请输入下单时使用的邮箱，以查看本次订单详情。
            </p>
            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <FormField label="下单邮箱" required>
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </FormField>
              <Button type="submit" variant="primary" className="w-full">
                查看订单详情
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="bg-white/55 rounded-lg p-6 border border-black/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">订单详情</h2>
                  <p className="text-sm text-black/60">
                    提交时间：{formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-black/60">
                    状态：{formatStatus(order.status)}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <div className="text-sm text-black/60">订单总额</div>
                  <div className="text-2xl font-bold">{formatPrice(order.totalAmount)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/55 rounded-lg p-6 border border-black/10">
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
