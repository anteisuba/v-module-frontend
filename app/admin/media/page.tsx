"use client";

import { useRouter } from "next/navigation";
import { AdminEditorPage, LoadingState, MediaLibraryBrowser } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";

export default function MediaPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading } = useUser();

  if (loading) {
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
    <AdminEditorPage
      backHref="/admin/dashboard"
      backLabel={t("common.back")}
      title={t("mediaLibrary.pageTitle")}
      description={t("mediaLibrary.pageDescription")}
      maxWidthClassName="max-w-7xl"
    >
      <MediaLibraryBrowser />
    </AdminEditorPage>
  );
}
