// components/ui/PageLoading.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";

/**
 * 页面加载组件
 * 用于 Next.js loading.tsx 文件，提供统一的加载体验
 * 自动使用 i18n 翻译加载文字
 */

interface PageLoadingProps {
  message?: string;
  backgroundColor?: string;
}

export default function PageLoading({
  message,
  backgroundColor = "#000000",
}: PageLoadingProps) {
  const { t } = useI18n();
  const displayMessage = message || t("common.loading");

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="text-center">
        {/* 加载动画 */}
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        </div>
        {/* 加载文字 */}
        <p className="text-white/80">{displayMessage}</p>
      </div>
    </div>
  );
}
