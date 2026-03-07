// app/admin/shop/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LoadingState,
  AdminEditorAccordion,
  AdminEditorPage,
  AdminEditorTabs,
  BackgroundEditor,
  SaveStatus,
  Button,
  Alert,
  ConfirmDialog,
} from "@/components/ui";
import ProductEditor from "@/components/shop/ProductEditor";
import { pageApi, shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import type { BackgroundConfig } from "@/domain/page-config/types";
import type { AdminEditorPanelItem, AdminEditorTabOption } from "@/components/ui";

type EditorTabId = "layout" | "content";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const {
    config,
    setConfig,
    loading: configLoading,
    hasUnsavedChanges,
    markAsSaved,
  } = usePageConfig();
  const {
    saving: savingConfig,
    publishing,
    saveDraft,
    publish,
  } = usePageConfigActions({
    config,
    setConfig,
    onError: handleError,
    onToast: (msg) => {
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });

  const [product, setProduct] = useState<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTabId>("content");
  const [openPanelByTab, setOpenPanelByTab] = useState<
    Record<EditorTabId, string | null>
  >({
    layout: "background",
    content: "editor",
  });

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (productId && !userLoading && user) {
      loadProduct();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [productId, user, userLoading]);

  async function loadProduct() {
    if (!productId) return;
    try {
      setLoading(true);
      const prod = await shopApi.getProduct(productId);
      setProduct({
        id: prod.id,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        stock: prod.stock,
        images: prod.images || [],
        status: prod.status,
      });
    } catch (err) {
      handleError(err);
      router.push("/admin/shop");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data: {
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
  }) {
    if (!productId) return;
    try {
      setSaving(true);
      await shopApi.updateProduct(productId, data);

      if (hasUnsavedChanges) {
        await publish();
        markAsSaved();
        setLastSaved(new Date());
      }

      showToast("商品已更新");
      router.push("/admin/shop");
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/shop");
  }

  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch (e) {
      // 错误已由 handleError 处理
    }
  };

  const handlePublish = async () => {
    try {
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch (e) {
      // 错误已由 handleError 处理
    }
  };

  const togglePanel = (tabId: EditorTabId, panelId: string) => {
    setOpenPanelByTab((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === panelId ? null : panelId,
    }));
  };

  if (userLoading || loading || configLoading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user || !product) {
    return null;
  }

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
        loading={savingConfig}
        disabled={savingConfig || publishing || !hasUnsavedChanges}
      >
        {t("cms.saveDraft")}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowPublishConfirm(true)}
        loading={publishing}
        disabled={savingConfig || publishing}
      >
        {t("cms.publish")}
      </Button>
    </>
  );

  const layoutPanels: AdminEditorPanelItem[] = [
    {
      id: "background",
      title: t("shop.layout.detailBackground"),
      description: t("admin.editorScaffold.panels.background.description"),
      actions: publishActions,
      content: (
        <BackgroundEditor
          label={t("shop.layout.detailBackground")}
          background={
            config.shopDetailBackground || {
              type: "color",
              value: "#000000",
            }
          }
          onBackgroundChange={(background: BackgroundConfig) => {
            setConfig({
              ...config,
              shopDetailBackground: background,
            });
          }}
          disabled={savingConfig || publishing}
          onUploadImage={async (file) => {
            const result = await pageApi.uploadImage(file);
            return result;
          }}
          onToast={showToast}
          onError={handleError}
          previewHeight="h-48"
        />
      ),
    },
  ];

  const contentPanels: AdminEditorPanelItem[] = [
    {
      id: "editor",
      title: t("common.edit"),
      description: t("admin.editorScaffold.panels.editor.description"),
      content: (
        <ProductEditor
          initialData={product}
          productId={productId}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ),
    },
  ];

  const visiblePanels =
    activeTab === "layout" ? layoutPanels : contentPanels;

  return (
    <AdminEditorPage
      backHref="/admin/shop"
      backLabel={t("common.back")}
      title={t("common.edit")}
      description={product.name}
      maxWidthClassName="max-w-4xl"
    >
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={clearError}
          className="mb-4"
        />
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 transform rounded-lg bg-black px-4 py-2 text-sm text-white">
          {toastMessage}
        </div>
      )}

      <SaveStatus
        hasUnsavedChanges={hasUnsavedChanges}
        saving={savingConfig}
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
