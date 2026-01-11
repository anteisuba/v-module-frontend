// app/admin/orders/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  Alert,
  LoadingState,
  LanguageSelector,
  Button,
} from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

interface Order {
  id: string;
  buyerEmail: string;
  buyerName: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    todaySales: 0,
  });

  useEffect(() => {
    if (!userLoading && user) {
      loadOrders();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [user, userLoading]);

  async function loadOrders() {
    try {
      setLoading(true);
      const response = await shopApi.getOrders({ page: 1, limit: 100 });
      setOrders(response.orders);

      // 计算统计
      const pending = response.orders.filter((o) => o.status === "PENDING").length;
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
    } catch (err) {
      handleError(err);
      showToast("加载订单列表失败");
    } finally {
      setLoading(false);
    }
  }

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

  function getNextStatus(currentStatus: string): string | null {
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

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
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
      PENDING: "bg-yellow-100 text-yellow-700",
      PAID: "bg-blue-100 text-blue-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
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

  if (!user) {
    return null;
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <BackButton href="/admin/dashboard" label={t("common.back")} />
        <div className="fixed bottom-6 right-6 z-[100]">
          <LanguageSelector position="bottom-right" />
        </div>

        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">订单管理</h1>
          <p className="mt-1 text-sm text-black/70">管理您的所有订单</p>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60 mb-1">待处理订单</div>
            <div className="text-2xl font-bold text-black">{stats.pendingCount}</div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white/55 p-4 backdrop-blur-xl">
            <div className="text-sm text-black/60 mb-1">今日销售额</div>
            <div className="text-2xl font-bold text-black">
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
          <div className="rounded-2xl border border-black/10 bg-white/55 p-12 text-center backdrop-blur-xl">
            <p className="text-black/60">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-black">
                          订单 #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-black/60">
                        {order.buyerName || order.buyerEmail}
                      </p>
                      <p className="text-xs text-black/50">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-black">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* 订单项 */}
                  <div className="mb-4 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-black/70">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="text-black/60">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 状态更新按钮 */}
                  {nextStatus && (
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
