// app/admin/shop/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  LoadingState,
  LanguageSelector,
} from "@/components/ui";
import ProductEditor from "@/components/shop/ProductEditor";
import { shopApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";

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

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <BackButton href="/admin/shop" label={t("common.back")} />
        <div className="fixed bottom-6 right-6 z-[100]">
          <LanguageSelector position="bottom-right" />
        </div>

        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">{t("shop.create")}</h1>
          <p className="mt-1 text-sm text-black/70">
            {t("admin.dashboard.pages.shop.description")}
          </p>
        </div>

        {/* 编辑器 */}
        <div className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <ProductEditor
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      </div>
    </main>
  );
}
