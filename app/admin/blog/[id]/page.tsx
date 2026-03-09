// app/admin/blog/[id]/page.tsx

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
import BlogEditor from "@/components/blog/BlogEditor";
import { BLOG_DETAIL_BACKGROUND } from "@/domain/media/usage";
import { blogApi, pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useI18n } from "@/lib/i18n/context";
import type { BackgroundConfig } from "@/domain/page-config/types";
import type { AdminEditorPanelItem, AdminEditorTabOption } from "@/components/ui";

type EditorTabId = "layout" | "content";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const { config, setConfig, loading: configLoading, hasUnsavedChanges, markAsSaved } = usePageConfig();
  const { saving: savingConfig, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    onError: handleError,
    onToast: (msg) => {
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });

  const [blogPost, setBlogPost] = useState<{
    id: string;
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [navigating, setNavigating] = useState(false);
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
      setBlogId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (blogId && !userLoading && user) {
      loadBlogPost();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [blogId, user, userLoading]);

  async function loadBlogPost() {
    if (!blogId) return;
    try {
      setLoading(true);
      const post = await blogApi.getPost(blogId);
      setBlogPost({
        id: post.id,
        title: post.title,
        content: post.content,
        coverImage: post.coverImage,
        videoUrl: post.videoUrl,
        externalLinks: post.externalLinks || [],
        published: post.published,
      });
    } catch (err) {
      handleError(err);
      router.push("/admin/blog");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data: {
    title: string;
    content: string;
    coverImage: string | null;
    videoUrl: string | null;
    externalLinks: Array<{ url: string; label: string }> | null;
    published: boolean;
  }) {
    if (!blogId) return;
    try {
      setSaving(true);
      // 1. 保存博客内容
      await blogApi.updatePost(blogId, data);
      
      // 2. 如果页面配置有更改，同时也发布页面配置（背景等）
      if (hasUnsavedChanges) {
        await publish();
        markAsSaved();
        setLastSaved(new Date());
      }

      showToast(t("blog.list.saved"));
      router.push("/admin/blog");
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    handleNavigate("/admin/blog");
  }

  // 保存草稿处理
  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch (e) {
      // 错误已由 handleError 处理
    }
  };

  // 发布处理
  const handlePublish = async () => {
    try {
      console.log("[EditBlogPage] Publishing config:", config);
      if (config.blogDetailBackground) {
        console.log("[EditBlogPage] blogDetailBackground:", config.blogDetailBackground);
      } else {
        console.warn("[EditBlogPage] blogDetailBackground is missing in config!");
      }
      
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch (e) {
      // 错误已由 handleError 处理
      console.error("[EditBlogPage] Publish failed:", e);
    }
  };

  // 处理导航（带加载状态）
  const handleNavigate = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  const togglePanel = (tabId: EditorTabId, panelId: string) => {
    setOpenPanelByTab((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === panelId ? null : panelId,
    }));
  };

  if (userLoading || loading || configLoading || navigating) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user || !blogPost) {
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
      title: t("blog.layout.detailBackground"),
      description: t("admin.editorScaffold.panels.background.description"),
      actions: publishActions,
      content: (
        <BackgroundEditor
          label={t("blog.layout.detailBackground")}
          background={
            config.blogDetailBackground || { type: "color", value: "#000000" }
          }
          onBackgroundChange={(background: BackgroundConfig) => {
            setConfig({
              ...config,
              blogDetailBackground: background,
            });
          }}
          disabled={savingConfig || publishing}
          onUploadImage={async (file, options) => {
            try {
              const result = await pageApi.uploadImage(file, options);
              return result;
            } catch (e) {
              throw e;
            }
          }}
          usageContext={BLOG_DETAIL_BACKGROUND}
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
        <BlogEditor
          initialData={blogPost}
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
      backHref="/admin/blog"
      backLabel={t("common.back")}
      title={t("common.edit")}
      description={blogPost.title}
      maxWidthClassName="max-w-4xl"
    >
      {error && (
        <Alert type="error" message={error} onClose={clearError} className="mb-4" />
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

        {/* 发布确认对话框 */}
        <ConfirmDialog
          open={showPublishConfirm}
          title={t("cms.publishConfirm.title") || "确认发布"}
          message={t("cms.publishConfirm.message") || "确定要发布页面吗？发布后将对所有访客可见。"}
          confirmLabel={t("cms.publishConfirm.confirm") || "确定发布"}
          cancelLabel={t("common.cancel")}
          onConfirm={handlePublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
    </AdminEditorPage>
  );
}
