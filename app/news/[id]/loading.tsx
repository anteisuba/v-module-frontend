// app/news/[id]/loading.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";

/**
 * 简单的加载提示
 * 只显示文字，不显示复杂的加载页面
 */
export default function NewsDetailLoading() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-black/60">{t("common.loading")}</p>
    </div>
  );
}
