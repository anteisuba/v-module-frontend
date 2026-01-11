// app/admin/blog/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  Alert,
  LoadingState,
  ConfirmDialog,
  LanguageSelector,
  BackgroundEditor,
  SaveStatus,
  Button,
} from "@/components/ui";
import { blogApi, pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useI18n } from "@/lib/i18n/context";
import type { BackgroundConfig } from "@/domain/page-config/types";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  publishedAt: string | null;
}

export default function BlogPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { t } = useI18n();
  const { message: toastMessage, showToast } = useToast();
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

  // 加载博客列表
  useEffect(() => {
    if (!userLoading && user) {
      loadPosts();
    } else if (!userLoading && !user) {
      router.push("/admin");
    }
  }, [user, userLoading]);

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
      await publish();
      markAsSaved();
      setLastSaved(new Date());
      setShowPublishConfirm(false);
    } catch (e) {
      // 错误已由 handleError 处理
    }
  };

  // 处理导航（带加载状态）
  const handleNavigate = (path: string) => {
    setNavigating(true);
    router.push(path);
  };

  async function loadPosts() {
    try {
      setLoading(true);
      // 管理后台显示所有文章（包括草稿和已发布的），不传递 published 参数
      // API 会自动过滤只显示当前用户的文章
      const response = await blogApi.getPosts({ page: 1, limit: 100 });
      setPosts(response.posts);
    } catch (err) {
      handleError(err);
      showToast(t("blog.list.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await blogApi.deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
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

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <BackButton href="/admin/dashboard" label={t("common.back")} fixed={false} className="!m-0" />
        </div>
        <div className="fixed bottom-6 right-6 z-[100]">
          <LanguageSelector position="bottom-right" />
        </div>

        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">{t("blog.title")}</h1>
            <p className="mt-1 text-sm text-black/70">
              {t("admin.dashboard.pages.blog.description")}
            </p>
          </div>
          <button
            onClick={() => handleNavigate("/admin/blog/new")}
            className="rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90 transition-colors"
          >
            {t("blog.create")}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* Toast 提示 */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-black text-white px-4 py-2 rounded-lg text-sm">
            {toastMessage}
          </div>
        )}

        {/* 保存状态 */}
        <SaveStatus
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving}
          publishing={publishing}
          lastSaved={lastSaved}
        />

        {/* 博客列表页面背景编辑 */}
        <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-black">博客列表页面背景</h2>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          <BackgroundEditor
            label="博客列表页面背景"
            background={config.blogBackground || { type: "color", value: "#000000" }}
            onBackgroundChange={(background: BackgroundConfig) => {
              setConfig({
                ...config,
                blogBackground: background,
              });
            }}
            disabled={saving || publishing}
            onUploadImage={async (file) => {
              try {
                const result = await pageApi.uploadImage(file);
                return result;
              } catch (e) {
                throw e;
              }
            }}
            onToast={showToast}
            onError={handleError}
            previewHeight="h-48"
          />
        </div>

        {/* 博客列表 */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white/55 p-12 text-center backdrop-blur-xl">
            <p className="text-black/60">{t("blog.list.empty")}</p>
            <button
              onClick={() => handleNavigate("/admin/blog/new")}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
            >
              {t("blog.create")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl hover:bg-white/70 transition-colors cursor-pointer"
                onClick={() => handleNavigate(`/admin/blog/${post.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* 封面图 */}
                  {post.coverImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-black mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-black/60 line-clamp-2 mb-2">
                          {post.content.substring(0, 100)}
                          {post.content.length > 100 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-black/50">
                          <span>{formatDate(post.createdAt)}</span>
                          {post.published ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                              {t("blog.list.published")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {t("blog.list.draft")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(`/admin/blog/${post.id}`);
                          }}
                          className="rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black hover:bg-white/80 transition-colors"
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
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === post.id ? t("common.loading") : t("common.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </main>
  );
}
