// app/admin/shop/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminEditorAccordion,
  AdminEditorPage,
  LoadingState,
} from "@/components/ui";
import ProductEditor from "@/components/shop/ProductEditor";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import type { AdminEditorPanelItem } from "@/components/ui";

export default function NewProductPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();

  const [saving, setSaving] = useState(false);

  async function handleSave(data: {
    name: string;
    description: string | null;
    price: number;
    stock: number;
    images: string[];
    status: string;
  }) {
    try {
      setSaving(true);
      await shopApi.createProduct(data);
      showToast("商品已创建");
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

  if (userLoading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user) {
    router.push("/admin");
    return null;
  }

  const panels: AdminEditorPanelItem[] = [
    {
      id: "editor",
      title: t("shop.create"),
      description: t("admin.editorScaffold.panels.create.description"),
      content: (
        <ProductEditor
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ),
    },
  ];

  return (
    <AdminEditorPage
      backHref="/admin/shop"
      backLabel={t("common.back")}
      title={t("shop.create")}
      description={t("admin.dashboard.pages.shop.description")}
      maxWidthClassName="max-w-4xl"
    >
      <AdminEditorAccordion
        panels={panels}
        openPanelId="editor"
        onToggle={() => {}}
      />
    </AdminEditorPage>
  );
}
