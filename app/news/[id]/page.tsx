// app/news/[id]/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { newsArticleApi, pageApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useUser } from "@/lib/context/UserContext";
import type { NewsArticle } from "@/lib/api/types";
import type { PageConfig } from "@/domain/page-config/types";

function NewsDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);

  // 获取返回链接
  const getBackUrl = () => {
    const fromParam = searchParams.get("from");
    if (fromParam) {
      return fromParam;
    }
    return "/news";
  };

  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "MEDIA",
    tag: "",
    shareUrl: "",
    shareChannels: [
      { platform: "twitter", enabled: false },
      { platform: "facebook", enabled: false },
      { platform: "line", enabled: false },
    ],
    backgroundType: "color" as "color" | "image",
    backgroundValue: "#000000",
    published: false,
  });

  useEffect(() => {
    params.then((p) => {
      setArticleId(p.id);
    });
  }, [params]);

  const loadArticle = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const article = await newsArticleApi.getArticle(id);
      setArticle(article);
      // 确保 shareChannels 有正确的结构
      const articleShareChannels = (article.shareChannels as Array<{ platform: string; enabled: boolean }>) || [];
      const shareChannels = [
        { platform: "twitter", enabled: false },
        { platform: "facebook", enabled: false },
        { platform: "line", enabled: false },
      ].map((p) => {
        const existing = articleShareChannels.find((ch) => ch.platform === p.platform);
        return existing || p;
      });
      
      setFormData({
        title: article.title || "",
        content: article.content || "",
        category: article.category || "MEDIA",
        tag: article.tag || "",
        shareUrl: article.shareUrl || "",
        shareChannels: shareChannels,
        backgroundType: (article.backgroundType as "color" | "image") || "color",
        backgroundValue: article.backgroundValue || "#000000",
        published: article.published || false,
      });
      // 如果用户是作者，可以编辑
      if (user?.id === article.userId) {
        setIsEditing(false); // 默认不编辑，需要点击编辑按钮
      }
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("加载文章失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      loadArticle(articleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // 加载页面配置（用于获取新闻页面背景）
  useEffect(() => {
    async function loadPageConfig() {
      try {
        // 优先使用 from 参数
        const fromParam = searchParams.get("from");
        if (fromParam && fromParam.startsWith("/u/")) {
          const slug = fromParam.replace("/u/", "");
          const config = await pageApi.getPublishedConfig(slug);
          setPageConfig(config);
          return;
        }
        
        // 如果没有 from 参数，尝试从文章信息中获取用户 slug
        if (article?.userSlug) {
          const config = await pageApi.getPublishedConfig(article.userSlug);
          setPageConfig(config);
        }
      } catch (err) {
        console.error("Failed to load page config:", err);
      }
    }
    loadPageConfig();
  }, [searchParams, article?.userSlug]); // 只依赖 userSlug，而不是整个 article 对象

  const handleSave = async () => {
    if (!articleId || !formData.title.trim() || !formData.content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await newsArticleApi.updateArticle(articleId, {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tag: formData.tag || undefined,
        shareUrl: formData.shareUrl || undefined,
        shareChannels: formData.shareChannels,
        backgroundType: formData.backgroundType,
        backgroundValue: formData.backgroundValue,
        published: formData.published,
      });
      setIsEditing(false);
      await loadArticle(articleId);
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShare = (platform: string) => {
    if (!article) return;

    const shareUrl = article.shareUrl || window.location.href;
    const title = article.title;
    const text = article.content.substring(0, 100);

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;
      case "line":
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
        break;
    }
  };

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        {/* 背景图 */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
          />
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16">
          <div className="text-center text-black/60">加载中...</div>
        </div>
      </main>
    );
  }

  if (error && !article) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        {/* 背景图 */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
          />
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16">
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
          <Link
            href={getBackUrl()}
            className="inline-block rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
          >
            返回列表
          </Link>
        </div>
      </main>
    );
  }

  if (!article) {
    return null;
  }

  const isAuthor = user?.id === article.userId;
  const shareChannels = (article.shareChannels as Array<{ platform: string; enabled: boolean }>) || [];

  // 获取新闻页面背景样式（用于整个页面）
  const newsPageBackgroundStyle: React.CSSProperties = pageConfig?.newsBackground
    ? pageConfig.newsBackground.type === "color"
      ? { backgroundColor: pageConfig.newsBackground.value }
      : {
          backgroundImage: `url(${pageConfig.newsBackground.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
    : { backgroundColor: "#000000" };

  return (
    <main className="relative min-h-screen w-full overflow-hidden" style={newsPageBackgroundStyle}>
      {/* 背景遮罩层（仅在图片背景时显示） */}
      {pageConfig?.newsBackground && pageConfig.newsBackground.type === "image" && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {/* 头部 */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-black">NEWS</h1>
            <p className="mt-1 text-xs text-black/70">新闻详情</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAuthor && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
              >
                编辑
              </button>
            )}
            <Link
              href={getBackUrl()}
              className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
            >
              BACK
            </Link>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 编辑模式 */}
        {isEditing && isAuthor ? (
          <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={15}
                  className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
                    disabled={saving}
                  >
                    <option value="MEDIA">MEDIA</option>
                    <option value="MAGAZINE">MAGAZINE</option>
                    <option value="あの">あの</option>
                    <option value="ANO">ANO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1.5">
                    标签
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                    className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  分享链接
                </label>
                <input
                  type="url"
                  value={formData.shareUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, shareUrl: e.target.value })
                  }
                  className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  分享渠道
                </label>
                <div className="flex gap-3">
                  {shareChannels.map((ch) => (
                    <label
                      key={ch.platform}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={ch.enabled}
                        onChange={(e) => {
                          const updated = formData.shareChannels.map((c) =>
                            c.platform === ch.platform
                              ? { ...c, enabled: e.target.checked }
                              : c
                          );
                          setFormData({ ...formData, shareChannels: updated });
                        }}
                        disabled={saving}
                        className="toggle toggle-sm"
                      />
                      <span className="text-xs text-black/70">
                        {ch.platform === "twitter" ? "Twitter/X" : ch.platform === "facebook" ? "Facebook" : "LINE"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 背景设置（控制详情页背景） */}
              <div>
                <label className="block text-xs font-medium text-black mb-1.5">
                  背景设置（控制此详情页背景）
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, backgroundType: "color" })
                      }
                      className={`rounded px-3 py-1.5 text-xs transition-colors ${
                        formData.backgroundType === "color"
                          ? "bg-black text-white"
                          : "bg-white/70 text-black hover:bg-white/90"
                      }`}
                      disabled={saving}
                    >
                      颜色
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, backgroundType: "image" })
                      }
                      className={`rounded px-3 py-1.5 text-xs transition-colors ${
                        formData.backgroundType === "image"
                          ? "bg-black text-white"
                          : "bg-white/70 text-black hover:bg-white/90"
                      }`}
                      disabled={saving}
                    >
                      图片
                    </button>
                  </div>

                  {formData.backgroundType === "color" ? (
                    <div>
                      <input
                        type="color"
                        value={formData.backgroundValue}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundValue: e.target.value })
                        }
                        className="h-8 w-full rounded border border-black/10"
                        disabled={saving}
                      />
                      <div
                        className="mt-2 h-16 w-full rounded border border-black/10"
                        style={{ backgroundColor: formData.backgroundValue }}
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={formData.backgroundValue}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundValue: e.target.value })
                        }
                        placeholder="/path/to/image.jpg 或 https://example.com/image.jpg"
                        className="w-full rounded border border-black/10 bg-white px-3 py-1.5 text-xs text-black mb-2"
                        disabled={saving}
                      />
                      <div className="mt-2 h-32 w-full rounded border border-black/10 overflow-hidden bg-black/5 relative">
                        {formData.backgroundValue ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={formData.backgroundValue}
                            alt="背景预览"
                            className="h-full w-full object-cover"
                            onError={() => {}}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-xs text-black/50">暂无图片</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    disabled={saving}
                    className="toggle toggle-sm"
                  />
                  <span className="text-xs text-black/70">已发布</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="cursor-pointer rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadArticle(articleId!);
                  }}
                  disabled={saving}
                  className="cursor-pointer rounded-lg border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-black/10 bg-white/55 p-5 backdrop-blur-xl">
            {/* 文章标题 */}
            <h2 className="mb-4 text-lg font-semibold text-black">{article.title}</h2>

            {/* 元信息 */}
            <div className="mb-4 flex items-center gap-3 text-xs text-black/60">
              <span>
                {new Date(article.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).replace(/\//g, ".")}
              </span>
              <span className="font-medium">{article.category}</span>
              {article.tag && <span>{article.tag}</span>}
            </div>

            {/* 分享按钮 */}
            {shareChannels.some((ch) => ch.enabled) && (
              <div className="mb-4 flex gap-2 border-t border-black/10 pt-4">
                {shareChannels
                  .filter((ch) => ch.enabled)
                  .map((ch) => (
                    <button
                      key={ch.platform}
                      type="button"
                      onClick={() => handleShare(ch.platform)}
                      className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
                    >
                      {ch.platform === "twitter"
                        ? "ポスト"
                        : ch.platform === "facebook"
                        ? "シェアする"
                        : "LINEで送る"}
                    </button>
                  ))}
              </div>
            )}

            {/* 文章内容 */}
            <div className="mb-4">
              <div className="whitespace-pre-wrap text-sm text-black/90 leading-relaxed">
                {article.content}
              </div>
            </div>

            {/* 分享链接 */}
            {article.shareUrl && (
              <div className="mb-4">
                <a
                  href={article.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  {article.shareUrl}
                </a>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex gap-2 border-t border-black/10 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
              >
                前へ
              </button>
              <Link
                href={getBackUrl()}
                className="cursor-pointer rounded-lg border border-black/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-black transition-colors duration-200 hover:bg-white/80"
              >
                一覧に戻る
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen w-full overflow-hidden bg-black">
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
          <div className="text-center text-black/60">加载中...</div>
        </div>
      </main>
    }>
      <NewsDetailContent params={params} />
    </Suspense>
  );
}

