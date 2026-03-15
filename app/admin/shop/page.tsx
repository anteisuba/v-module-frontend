// app/admin/shop/page.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  LoadingState,
  ConfirmDialog,
  AdminEditorAccordion,
  AdminEditorPage,
  AdminEditorTabs,
  BackgroundEditor,
  SaveStatus,
  Button,
  StatusBadge,
} from "@/components/ui";
import {
  SHOP_DETAIL_BACKGROUND,
  SHOP_LIST_BACKGROUND,
} from "@/domain/media/usage";
import { pageApi, shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import type { BackgroundConfig } from "@/domain/page-config/types";
import type { AdminEditorPanelItem, AdminEditorTabOption } from "@/components/ui";

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

type EditorTabId = "layout" | "content";

const SHOP_PANEL_TO_TAB: Record<string, EditorTabId> = {
  "list-background": "layout",
  "detail-background": "layout",
  products: "content",
};

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const {
    config,
    setConfig,
    loading: configLoading,
    hasUnsavedChanges,
    markAsSaved,
  } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    onError: handleError,
    onToast: (msg) => {
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTabId>("layout");
  const [openPanelByTab, setOpenPanelByTab] = useState<
    Record<EditorTabId, string | null>
  >({
    layout: "list-background",
    content: "products",
  });
  const requestedTab = searchParams.get("tab");
  const requestedPanel = searchParams.get("panel");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await shopApi.getProducts({ page: 1, limit: 100 });
      setProducts(response.products);
    } catch (err) {
      handleError(err);
      showToast(t("shop.list.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [handleError, showToast, t]);

  // 加载商品列表
  useEffect(() => {
    if (!userLoading && user) {
      void loadProducts();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [loadProducts, router, user, userLoading]);

  useEffect(() => {
    const nextPanel =
      requestedPanel && requestedPanel in SHOP_PANEL_TO_TAB ? requestedPanel : null;
    const nextTab =
      requestedTab === "layout" || requestedTab === "content"
        ? requestedTab
        : nextPanel
          ? SHOP_PANEL_TO_TAB[nextPanel]
          : null;

    if (nextTab) {
      setActiveTab(nextTab);
    }

    if (nextTab && nextPanel) {
      setOpenPanelByTab((prev) => ({
        ...prev,
        [nextTab]: nextPanel,
      }));
    }
  }, [requestedPanel, requestedTab]);

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await shopApi.deleteProduct(id);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );
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

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch {
      // 错误已由 handleError 处理
    }
  };

  const handlePublish = async () => {
    try {
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch {
      // 错误已由 handleError 处理
    }
  };

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

  // 状态颜色通过 StatusBadge 组件统一管理

  const togglePanel = (tabId: EditorTabId, panelId: string) => {
    setOpenPanelByTab((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === panelId ? null : panelId,
    }));
  };

  const tabOptions: AdminEditorTabOption[] = [
    {
      id: "layout",
      title: t("admin.editorScaffold.tabs.layout.title"),
      description: t("admin.editorScaffold.tabs.layout.description"),
    },
    {
      id: "content",
      title: t("admin.editorScaffold.tabs.content.title"),
      description: t("admin.editorScaffold.tabs.content.description"),
    },
  ];

  const publishActions = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSaveDraft}
        loading={saving}
        disabled={saving || publishing || !hasUnsavedChanges}
      >
        {t("cms.saveDraft")}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowPublishConfirm(true)}
        loading={publishing}
        disabled={saving || publishing}
      >
        {t("cms.publish")}
      </Button>
    </>
  );

  const layoutPanels: AdminEditorPanelItem[] = [
    {
      id: "list-background",
      title: t("shop.layout.listBackground"),
      description: t("admin.editorScaffold.panels.background.description"),
      actions: publishActions,
      content: (
        <BackgroundEditor
          label={t("shop.layout.listBackground")}
          background={
            config.shopBackground || { type: "color", value: "#000000" }
          }
          onBackgroundChange={(background: BackgroundConfig) => {
            setConfig({
              ...config,
              shopBackground: background,
            });
          }}
          disabled={saving || publishing}
          onUploadImage={async (file, options) => {
            const result = await pageApi.uploadImage(file, options);
            return result;
          }}
          usageContext={SHOP_LIST_BACKGROUND}
          onToast={showToast}
          onError={handleError}
          previewHeight="h-48"
        />
      ),
    },
    {
      id: "detail-background",
      title: t("shop.layout.detailBackground"),
      description: t("admin.editorScaffold.panels.background.description"),
      actions: publishActions,
      content: (
        <BackgroundEditor
          label={t("shop.layout.detailBackground")}
          background={
            config.shopDetailBackground || { type: "color", value: "#000000" }
          }
          onBackgroundChange={(background: BackgroundConfig) => {
            setConfig({
              ...config,
              shopDetailBackground: background,
            });
          }}
          disabled={saving || publishing}
          onUploadImage={async (file, options) => {
            const result = await pageApi.uploadImage(file, options);
            return result;
          }}
          usageContext={SHOP_DETAIL_BACKGROUND}
          onToast={showToast}
          onError={handleError}
          previewHeight="h-48"
        />
      ),
    },
  ];

  const contentPanels: AdminEditorPanelItem[] = [
    {
      id: "products",
      title: t("shop.title"),
      description: t("admin.editorScaffold.panels.list.description"),
      content:
        products.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-12 text-center backdrop-blur-xl">
            <p className="text-[color:var(--editorial-muted)]">{t("shop.list.empty")}</p>
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
                className="cursor-pointer rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl transition-colors hover:bg-white/70"
                onClick={() => router.push(`/admin/shop/${product.id}`)}
              >
                <div className="flex items-start gap-4">
                  {product.images && product.images.length > 0 ? (
                    <div className="flex-shrink-0">
                      {/* Dynamic admin uploads can be local or remote, so keep native img here. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-24 w-24 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "color-mix(in srgb, var(--editorial-border) 40%, transparent)" }}>
                      <span className="text-xs text-[color:var(--editorial-muted)]">No Image</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-[color:var(--editorial-text)]">
                            {product.name}
                          </h3>
                          <StatusBadge domain="product" status={product.status}>
                            {getStatusLabel(product.status)}
                          </StatusBadge>
                        </div>
                        {product.description ? (
                          <p className="mb-2 line-clamp-2 text-sm text-[color:var(--editorial-muted)]">
                            {product.description}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-[color:var(--editorial-text)]">
                            {formatPrice(product.price)}
                          </span>
                          <span
                            className={`text-xs ${
                              product.stock === 0
                                ? "font-semibold text-[color:#9a4b3d]"
                                : "text-[color:var(--editorial-muted)]"
                            }`}
                          >
                            {product.stock === 0
                              ? t("shop.list.outOfStock")
                              : `${t("shop.list.inStock")}: ${product.stock}`}
                          </span>
                          <span className="text-xs text-[color:var(--editorial-muted)]">
                            {formatDate(product.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/shop/${product.id}`);
                          }}
                          className="rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/80"
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
                          className="editorial-button editorial-button--danger px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {deletingId === product.id
                            ? t("common.loading")
                            : t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
    },
  ];

  const visiblePanels =
    activeTab === "layout" ? layoutPanels : contentPanels;

  if (userLoading || loading || configLoading) {
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
    <AdminEditorPage
      backHref="/admin/dashboard"
      backLabel={t("common.back")}
      title={t("shop.title")}
      description={t("admin.dashboard.pages.shop.description")}
      action={
        <button
          onClick={() => router.push("/admin/shop/new")}
          className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/90"
        >
          {t("shop.create")}
        </button>
      }
    >
      {error && <Alert type="error" message={error} onClose={clearError} />}
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 transform rounded-lg bg-black px-4 py-2 text-sm text-white">
          {toastMessage}
        </div>
      )}

      <SaveStatus
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        publishing={publishing}
        lastSaved={lastSaved}
      />

      <AdminEditorTabs
        tabs={tabOptions}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as EditorTabId)}
      />

      <AdminEditorAccordion
        panels={visiblePanels}
        openPanelId={openPanelByTab[activeTab]}
        onToggle={(panelId) => togglePanel(activeTab, panelId)}
      />

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

      <ConfirmDialog
        open={showPublishConfirm}
        title={t("cms.publishConfirm.title") || "确认发布"}
        message={
          t("cms.publishConfirm.message") ||
          "确定要发布页面吗？发布后将对所有访客可见。"
        }
        confirmLabel={t("cms.publishConfirm.confirm") || "确定发布"}
        cancelLabel={t("common.cancel")}
        onConfirm={handlePublish}
        onCancel={() => setShowPublishConfirm(false)}
      />
    </AdminEditorPage>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState message="加载中..." />
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  );
}
