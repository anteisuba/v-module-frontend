// app/admin/blog/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BackButton,
  LoadingState,
  LanguageSelector,
  BackgroundEditor,
  SaveStatus,
  Button,
  Alert,
  ConfirmDialog,
} from "@/components/ui";
import BlogEditor from "@/components/blog/BlogEditor";
import { blogApi, pageApi } from "@/lib/api";
import { useUser } from "@/lib/context/UserContext";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageConfigActions } from "@/hooks/usePageConfigActions";
import { useI18n } from "@/lib/i18n/context";
import type { BackgroundConfig } from "@/domain/page-config/types";

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
        <div className="flex justify-between items-center mb-6">
          <BackButton href="/admin/blog" label={t("common.back")} />
        </div>

        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">{t("common.edit")}</h1>
          <p className="mt-1 text-sm text-black/70">{blogPost.title}</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} className="mb-4" />
        )}

        {/* Toast 提示 */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] bg-black text-white px-4 py-2 rounded-lg text-sm mb-4">
            {toastMessage}
          </div>
        )}

        {/* 保存状态 */}
        <SaveStatus
          hasUnsavedChanges={hasUnsavedChanges}
          saving={savingConfig}
          publishing={publishing}
          lastSaved={lastSaved}
        />

        {/* 博客详情页面背景编辑 */}
        <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-black">博客详情页面背景</h2>
          </div>
          <BackgroundEditor
            label="博客详情页面背景"
            background={config.blogDetailBackground || { type: "color", value: "#000000" }}
            onBackgroundChange={(background: BackgroundConfig) => {
              setConfig({
                ...config,
                blogDetailBackground: background,
              });
            }}
            disabled={savingConfig || publishing}
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

        {/* 编辑器 */}
        <div className="rounded-2xl border border-black/10 bg-white/55 p-6 backdrop-blur-xl">
          <BlogEditor
            initialData={blogPost}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>

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

        {/* 语言选择器 */}
        <div className="mt-8 flex justify-end">
          <LanguageSelector position="inline" menuPosition="top" />
        </div>
      </div>
    </main>
  );
}
