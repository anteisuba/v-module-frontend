// app/u/[slug]/loading.tsx

"use client";

import PageLoading from "@/components/ui/PageLoading";
import { useI18n } from "@/lib/i18n/context";

export default function UserPageLoading() {
  const { t } = useI18n();
  return <PageLoading message={t("common.loadingPage")} />;
}
