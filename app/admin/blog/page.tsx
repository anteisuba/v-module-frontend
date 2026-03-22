// app/admin/blog/page.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  LoadingState,
  ConfirmDialog,
  AdminEditorAccordion,
  AdminEditorPage,
  AdminEditorTabs,
  BackgroundEditor,
  SaveStatus,
  Button,
  StatusBadge,
} from "@/components/ui";
import {
  BLOG_DETAIL_BACKGROUND,
  BLOG_LIST_BACKGROUND,
} from "@/domain/media/usage";
import { blogApi, pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useI18n } from "@/lib/i18n/context";
import type { BackgroundConfig } from "@/domain/page-config/types";
import type { AdminEditorPanelItem, AdminEditorTabOption } from "@/components/ui";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  publishedAt: string | null;
}

type EditorTabId = "layout" | "content";

const BLOG_PANEL_TO_TAB: Record<string, EditorTabId> = {
  "list-background": "layout",
  "detail-background": "layout",
  posts: "content",
};

function BlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, info: showToast } = useToast();
  const { error, handleError, clearError } = useErrorHandler();
  const { config, setConfig, loading: configLoading, hasUnsavedChanges, markAsSaved } = usePageConfig();
  const { saving, publishing, saveDraft, publish } = usePageConfigActions({
    config,
    setConfig,
    onError: handleError,
    onToast: (msg) => {
      const translatedMsg = msg.startsWith("cms.") ? t(msg) : msg;
      showToast(translatedMsg);
    },
  });

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTabId>("layout");
  const [openPanelByTab, setOpenPanelByTab] = useState<
    Record<EditorTabId, string | null>
  >({
    layout: "list-background",
    content: "posts",
  });
  const requestedTab = searchParams.get("tab");
  const requestedPanel = searchParams.get("panel");

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogApi.getPosts({ page: 1, limit: 100 });
      setPosts(response.posts);
    } catch (err) {
      handleError(err);
      showToast(t("blog.list.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [handleError, showToast, t]);

  // 加载博客列表
  useEffect(() => {
    if (!userLoading && user) {
      void loadPosts();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [loadPosts, router, user, userLoading]);

  useEffect(() => {
    const nextPanel =
      requestedPanel && requestedPanel in BLOG_PANEL_TO_TAB ? requestedPanel : null;
    const nextTab =
      requestedTab === "layout" || requestedTab === "content"
        ? requestedTab
        : nextPanel
          ? BLOG_PANEL_TO_TAB[nextPanel]
          : null;

    if (nextTab) {
      setActiveTab(nextTab);
    }

    if (nextTab && nextPanel) {
      setOpenPanelByTab((prev) => ({
        ...prev,
        [nextTab]: nextPanel,
      }));
    }
  }, [requestedPanel, requestedTab]);

  // 保存草稿处理
  const handleSaveDraft = async () => {
    try {
      await saveDraft();
      markAsSaved();
      setLastSaved(new Date());
    } catch {
      // 错误已由 handleError 处理
    }
  };

  // 发布处理
  const handlePublish = async () => {
    try {
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch {
      // 错误已由 handleError 处理
    }
  };

  // 处理导航（带加载状态）
  const handleNavigate = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await blogApi.deletePost(id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      showToast(t("blog.list.deleted"));
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (err) {
      handleError(err);
      showToast(t("blog.list.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const togglePanel = (tabId: EditorTabId, panelId: string) => {
    setOpenPanelByTab((prev) => ({
      ...prev,
      [tabId]: prev[tabId] === panelId ? null : panelId,
    }));
  };

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
        loading={saving}
        disabled={saving || publishing || !hasUnsavedChanges}
      >
        {t("cms.saveDraft")}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowPublishConfirm(true)}
        loading={publishing}
        disabled={saving || publishing}
      >
        {t("cms.publish")}
      </Button>
    </>
  );

  const layoutPanels: AdminEditorPanelItem[] = [
    {
      id: "list-background",
      title: t("blog.layout.listBackground"),
      description: t("admin.editorScaffold.panels.background.description"),
      actions: publishActions,
      content: (
        <BackgroundEditor
          label={t("blog.layout.listBackground")}
          background={
            config.blogBackground || { type: "color", value: "#000000" }
          }
          onBackgroundChange={(background: BackgroundConfig) => {
            setConfig({
              ...config,
              blogBackground: background,
            });
          }}
          disabled={saving || publishing}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
          usageContext={BLOG_LIST_BACKGROUND}
          onToast={showToast}
          onError={handleError}
          previewHeight="h-48"
        />
      ),
    },
    {
      id: "detail-background",
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
          disabled={saving || publishing}
          onUploadImage={(file, options) => pageApi.uploadImage(file, options)}
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
      id: "posts",
      title: t("blog.title"),
      description: t("admin.editorScaffold.panels.list.description"),
      content:
        posts.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-16 text-center backdrop-blur-xl">
            <p className="font-serif text-4xl font-extralight tracking-widest text-black/15">{'\u2726'}</p>
            <p className="mt-4 text-lg font-medium text-[color:var(--editorial-text)]">{t("blog.list.empty")}</p>
            <p className="mt-2 text-sm text-[color:var(--editorial-muted)]">
              写下你的第一篇文章，开始创作之旅
            </p>
            <button
              onClick={() => handleNavigate("/admin/blog/new")}
              className="mt-6 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
            >
              {t("blog.create")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="cursor-pointer rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl transition-colors hover:bg-white/70"
                onClick={() => handleNavigate(`/admin/blog/${post.id}`)}
              >
                <div className="flex items-start gap-4">
                  {post.coverImage ? (
                    <div className="flex-shrink-0">
                      {/* Dynamic admin uploads can be local or remote, so keep native img here. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-24 w-24 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold text-[color:var(--editorial-text)]">
                          {post.title}
                        </h3>
                        <p className="mb-2 line-clamp-2 text-sm text-[color:var(--editorial-muted)]">
                          {post.content.substring(0, 100)}
                          {post.content.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--editorial-muted)" }}>
                          <span>{formatDate(post.createdAt)}</span>
                          <StatusBadge domain="product" status={post.published ? "PUBLISHED" : "DRAFT"}>
                            {post.published ? t("blog.list.published") : t("blog.list.draft")}
                          </StatusBadge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(`/admin/blog/${post.id}`);
                          }}
                          className="editorial-button editorial-button--secondary px-3 py-1.5 text-xs"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPostToDelete(post.id);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={deletingId === post.id}
                          className="editorial-button editorial-button--danger px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {deletingId === post.id
                            ? t("common.loading")
                            : t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
    },
  ];

  const visiblePanels =
    activeTab === "layout" ? layoutPanels : contentPanels;

  if (userLoading || loading || configLoading || navigating) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <div className="flex h-screen items-center justify-center">
          <LoadingState message={t("common.loading")} />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminEditorPage
      backHref="/admin/dashboard"
      backLabel={t("common.back")}
      title={t("blog.title")}
      description={t("admin.dashboard.pages.blog.description")}
      action={
        <button
          onClick={() => handleNavigate("/admin/blog/new")}
          className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/90"
        >
          {t("blog.create")}
        </button>
      }
    >
      {error && <Alert type="error" message={error} onClose={clearError} />}
      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[200] -translate-x-1/2 transform rounded-lg bg-black px-4 py-2 text-sm text-white">
          {toastMessage}
        </div>
      )}

      <SaveStatus
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
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

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("blog.deleteConfirm.title")}
        message={t("blog.deleteConfirm.message")}
        confirmLabel={t("common.delete")}
        variant="danger"
        onConfirm={() => {
          if (postToDelete) {
            handleDelete(postToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPostToDelete(null);
        }}
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

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingState message="加载中..." />
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
