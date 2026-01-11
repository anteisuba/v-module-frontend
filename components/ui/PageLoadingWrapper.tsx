// components/ui/PageLoadingWrapper.tsx

"use client";

import { useI18n } from "@/lib/i18n/context";
import PageLoading from "./PageLoading";

/**
 * PageLoading 的包装器组件
 * 用于 Server Component 中，通过 messageKey 传递翻译键
 */
interface PageLoadingWrapperProps {
  messageKey?: string;
  backgroundColor?: string;
}

export default function PageLoadingWrapper({
  messageKey = "common.loading",
  backgroundColor,
}: PageLoadingWrapperProps) {
  const { t } = useI18n();
  return <PageLoading message={t(messageKey)} backgroundColor={backgroundColor} />;
}
