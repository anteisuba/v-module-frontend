// app/admin/orders/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

type Order = SerializedOrder;

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stats, setStats] = useState({
    pendingCount: 0,
    todaySales: 0,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await shopApi.getOrders({
        page: 1,
        limit: 100,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        query: debouncedQuery || undefined,
      });
      setOrders(response.orders);

      // 计算统计
      const pending = response.orders.filter(
        (o) => o.status === "AWAITING_PAYMENT" || o.status === "PENDING"
      ).length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySales = response.orders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= today && o.status === "PAID";
        })
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      setStats({
        pendingCount: pending,
        todaySales,
      });
      setHasLoadedOnce(true);
    } catch (err) {
      handleError(err);
      showToast("加载订单列表失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQuery, handleError, hasLoadedOnce, showToast, statusFilter]);

  useEffect(() => {
    if (!userLoading && user) {
      void loadOrders();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [loadOrders, router, user, userLoading]);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      setUpdatingStatus(orderId);
      await shopApi.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      showToast("订单状态已更新");
    } catch (err) {
      handleError(err);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      const csvBlob = await shopApi.exportOrdersCsv({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        query: debouncedQuery || undefined,
      });

      const downloadUrl = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast("订单 CSV 已导出");
    } catch (err) {
      handleError(err);
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  function getNextStatus(currentStatus: string): string | null {
    if (currentStatus === "CANCELLED") {
      return null;
    }

    const statusFlow: Record<string, string> = {
      PENDING: "PAID",
      PAID: "SHIPPED",
      SHIPPED: "DELIVERED",
    };
    return statusFlow[currentStatus] || null;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatPrice(price: number) {
    return `¥${price.toFixed(2)}`;
  }

  function handleViewOrder(orderId: string) {
    router.push(`/admin/orders/${orderId}`);
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

  // 状态颜色通过 StatusBadge 组件统一管理

  if (userLoading || loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main
      data-testid="admin-orders-page"
      className="editorial-shell--light relative min-h-screen w-full overflow-hidden"
    >
      {/* 背景 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/88" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <BackButton href="/admin/dashboard" label={t("common.back")} />
        <div className="fixed bottom-6 right-6 z-[100]">
          <LanguageSelector position="bottom-right" />
        </div>

        {/* 头部 */}
        <div className="mb-6 mt-14 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--editorial-text)]">订单管理</h1>
            <p className="mt-1 text-sm text-[color:var(--editorial-muted)]">管理您的所有订单</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/orders/reconciliation")}
            >
              支付对账
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/admin/orders/reconciliation/settlements")}
            >
              结算核销
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">
                搜索订单
              </label>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="订单号 / 买家邮箱 / 姓名 / 商品名"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--editorial-muted)]">
                状态筛选
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black"
              >
                <option value="ALL">全部状态</option>
                <option value="AWAITING_PAYMENT">等待支付</option>
                <option value="PENDING">待处理</option>
                <option value="PAID">已支付</option>
                <option value="SHIPPED">已发货</option>
                <option value="DELIVERED">已送达</option>
                <option value="CANCELLED">已取消</option>
              </select>
            </div>

            <div className="flex gap-2 md:justify-end">
              <Button
                variant="secondary"
                onClick={resetFilters}
                disabled={
                  (searchQuery.length === 0 && statusFilter === "ALL") ||
                  loading ||
                  refreshing ||
                  exporting
                }
              >
                清空筛选
              </Button>
              <Button
                variant="primary"
                onClick={handleExport}
                loading={exporting}
                disabled={loading || refreshing || orders.length === 0}
              >
                导出 CSV
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--editorial-muted)]">
            <span>当前结果 {orders.length} 条</span>
            {refreshing ? <span>正在更新结果...</span> : null}
          </div>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-[color:var(--editorial-muted)] mb-1">待支付 / 待处理</div>
            <div className="text-2xl font-bold text-[color:var(--editorial-text)]">{stats.pendingCount}</div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-[color:var(--editorial-muted)] mb-1">今日销售额</div>
            <div className="text-2xl font-bold text-[color:var(--editorial-text)]">
              {formatPrice(stats.todaySales)}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && <Alert type="error" message={error} onClose={clearError} />}

        {/* Toast 提示 */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-black text-white px-4 py-2 rounded-lg text-sm">
            {toastMessage}
          </div>
        )}

        {/* 订单列表 */}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-16 text-center backdrop-blur-xl">
            <p className="font-serif text-4xl font-extralight tracking-widest text-black/15">{'\u2726'}</p>
            <p className="mt-4 text-lg font-medium text-[color:var(--editorial-text)]">
              {debouncedQuery || statusFilter !== "ALL"
                ? "当前筛选条件下没有订单"
                : "暂无订单"}
            </p>
            <p className="mt-2 text-sm text-[color:var(--editorial-muted)]">
              {debouncedQuery || statusFilter !== "ALL"
                ? "尝试调整筛选条件查看更多"
                : "当有买家下单后，订单将在这里显示"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <div
                  key={order.id}
                  data-testid={`admin-order-card-${order.id}`}
                  className="rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[color:var(--editorial-text)]">
                          订单 #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge domain="order" status={order.status}>
                          {getStatusLabel(order.status)}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-[color:var(--editorial-muted)]">
                        {order.buyerName || order.buyerEmail}
                      </p>
                      {order.paymentProvider ? (
                        <p className="text-xs text-[color:var(--editorial-muted)]">
                          支付：{order.paymentProvider} / {order.paymentStatus || "UNKNOWN"}
                        </p>
                      ) : null}
                      <p className="text-xs text-[color:var(--editorial-muted)]">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[color:var(--editorial-text)]">
                        {formatPrice(order.totalAmount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order.id)}
                        data-testid={`admin-order-view-${order.id}`}
                        className="editorial-button editorial-button--secondary mt-3 px-3 py-1.5 text-xs"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>

                  {/* 订单项 */}
                  <div className="mb-4 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[color:var(--editorial-muted)]">
                          {(item.product?.name || item.productId)} × {item.quantity}
                        </span>
                        <span className="text-[color:var(--editorial-muted)]">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 状态更新按钮 */}
                  {nextStatus && order.paymentStatus !== "REFUNDED" && (
                    <div className="pt-4 border-t border-black/10">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        loading={updatingStatus === order.id}
                      >
                        更新为: {getStatusLabel(nextStatus)}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
