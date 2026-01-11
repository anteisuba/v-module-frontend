// app/admin/shop/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  Alert,
  LoadingState,
  ConfirmDialog,
  LanguageSelector,
} from "@/components/ui";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ShopPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // 加载商品列表
  useEffect(() => {
    if (!userLoading && user) {
      loadProducts();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [user, userLoading]);

  async function loadProducts() {
    try {
      setLoading(true);
      // 管理后台显示所有商品（包括草稿和已发布的），不传递 status 参数
      // API 会自动过滤只显示当前用户的商品
      const response = await shopApi.getProducts({ page: 1, limit: 100 });
      setProducts(response.products);
    } catch (err) {
      handleError(err);
      showToast(t("shop.list.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await shopApi.deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      showToast(t("shop.list.deleted"));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      handleError(err);
      showToast(t("shop.list.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
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
    switch (status) {
      case "DRAFT":
        return t("shop.list.draft");
      case "PUBLISHED":
        return t("shop.list.published");
      case "ARCHIVED":
        return t("shop.list.archived");
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700";
      case "PUBLISHED":
        return "bg-emerald-100 text-emerald-700";
      case "ARCHIVED":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">{t("shop.title")}</h1>
            <p className="mt-1 text-sm text-black/70">
              {t("admin.dashboard.pages.shop.description")}
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/shop/new")}
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            {t("shop.create")}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* Toast 提示 */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-black text-white px-4 py-2 rounded-lg text-sm">
            {toastMessage}
          </div>
        )}

        {/* 商品列表 */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-12 text-center backdrop-blur-xl">
            <p className="text-black/60">{t("shop.list.empty")}</p>
            <button
              onClick={() => router.push("/admin/shop/new")}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            >
              {t("shop.create")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl hover:bg-white/70 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/shop/${product.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* 商品图片 */}
                  {product.images && product.images.length > 0 ? (
                    <div className="flex-shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-black">
                            {product.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                              product.status
                            )}`}
                          >
                            {getStatusLabel(product.status)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-black/60 line-clamp-2 mb-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-black">
                            {formatPrice(product.price)}
                          </span>
                          <span
                            className={`text-xs ${
                              product.stock === 0
                                ? "text-red-600 font-semibold"
                                : "text-black/50"
                            }`}
                          >
                            {product.stock === 0
                              ? t("shop.list.outOfStock")
                              : `${t("shop.list.inStock")}: ${product.stock}`}
                          </span>
                          <span className="text-xs text-black/50">
                            {formatDate(product.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/shop/${product.id}`);
                          }}
                          className="rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black hover:bg-white/80 transition-colors"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product.id);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={deletingId === product.id}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === product.id ? t("common.loading") : t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("shop.deleteConfirm.title")}
        message={t("shop.deleteConfirm.message")}
        variant="danger"
        onConfirm={() => {
          if (productToDelete) {
            handleDelete(productToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProductToDelete(null);
        }}
      />
    </main>
  );
}
