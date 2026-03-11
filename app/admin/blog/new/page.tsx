// app/admin/blog/new/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminEditorAccordion,
  AdminEditorPage,
  LoadingState,
} from "@/components/ui";
import BlogEditor from "@/components/blog/BlogEditor";
import { blogApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useI18n } from "@/lib/i18n/context";
import type { AdminEditorPanelItem } from "@/components/ui";

export default function NewBlogPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { info: showToast } = useToast();
  const { handleError } = useErrorHandler();

  const [saving, setSaving] = useState(false);

  async function handleSave(data: {
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
  }) {
    try {
      setSaving(true);
      await blogApi.createPost(data);
      showToast(
        data.published
          ? t("blog.list.createdPublished")
          : t("blog.list.createdDraft")
      );
      router.push("/admin/blog");
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/admin/blog");
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
      title: t("blog.create"),
      description: t("admin.editorScaffold.panels.create.description"),
      content: (
        <BlogEditor
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ),
    },
  ];

  return (
    <AdminEditorPage
      backHref="/admin/blog"
      backLabel={t("common.back")}
      title={t("blog.create")}
      description={t("admin.dashboard.pages.blog.description")}
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
