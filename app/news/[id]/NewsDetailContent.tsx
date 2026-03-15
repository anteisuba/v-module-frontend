// app/news/[id]/NewsDetailContent.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { newsArticleApi, pageApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useUser } from "@/lib/context/UserContext";
import { useI18n } from "@/lib/i18n/context";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import type { NewsArticle } from "@/lib/api/types";
import type { PageConfig } from "@/domain/page-config/types";

export function NewsDetailContent({
  id,
}: {
  id: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { t } = useI18n();
  const menu = useHeroMenu();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
    if (id) {
      loadArticle(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    if (!id || !formData.title.trim() || !formData.content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await newsArticleApi.updateArticle(id, {
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
      await loadArticle(id);
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
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${title} ${text}`)}`,
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
      <main className="editorial-shell flex min-h-screen items-center justify-center">
        <div className="editorial-panel px-8 py-6 text-sm text-white/56">
          {t("common.loading")}
        </div>
      </main>
    );
  }

  if (error && !article) {
    return (
      <main className="editorial-shell relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/login/login-c.jpeg)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.26),rgba(8,8,6,0.62)_56%,rgba(8,8,6,0.84))]" />
        </div>
        <div className="editorial-container pt-24">
          <div className="mb-4 rounded-[1.2rem] border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, #9a4b3d 24%, transparent)", background: "color-mix(in srgb, #9a4b3d 10%, transparent)", color: "color-mix(in srgb, #9a4b3d 40%, #e8e4d9)" }}>
            {error}
          </div>
          <Link
            href={getBackUrl()}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
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

  // 获取背景样式（优先使用文章的背景设置，否则使用新闻页面背景设置）
  const getBackgroundStyle = (): React.CSSProperties => {
    // 优先使用文章的背景设置
    if (article.backgroundType && article.backgroundValue && article.backgroundValue.trim() !== "") {
      return article.backgroundType === "color"
        ? { backgroundColor: article.backgroundValue }
        : {
            backgroundImage: `url(${article.backgroundValue})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }
    
    // 如果没有文章背景设置，使用新闻页面背景设置
    const newsBg = pageConfig?.newsBackground;
    if (newsBg && newsBg.type && newsBg.value && newsBg.value.trim() !== "") {
      return newsBg.type === "color"
        ? { backgroundColor: newsBg.value }
        : {
            backgroundImage: `url(${newsBg.value})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          };
    }
    
    // 默认黑色背景
    return { backgroundColor: "#000000" };
  };

  const pageBackgroundStyle = getBackgroundStyle();
  
  // 判断当前使用的背景类型（用于显示遮罩层）
  const currentBackgroundType = article.backgroundType && article.backgroundValue
    ? article.backgroundType
    : pageConfig?.newsBackground?.type || "color";

  const backgroundOverlayClass =
    currentBackgroundType === "image"
      ? "bg-[linear-gradient(180deg,rgba(8,8,6,0.28),rgba(8,8,6,0.52)_42%,rgba(8,8,6,0.82))]"
      : "bg-[linear-gradient(180deg,rgba(8,8,6,0.16),rgba(8,8,6,0.48)_46%,rgba(8,8,6,0.78))]";

  return (
    <main
      data-testid="public-news-detail"
      className="editorial-shell relative min-h-screen overflow-hidden"
    >
      <div className="absolute inset-0" style={pageBackgroundStyle} />
      <div className={`absolute inset-0 ${backgroundOverlayClass}`} />

      <div className="fixed right-6 top-6 z-50 flex items-center gap-4 text-white">
        <button
          className="editorial-button min-h-10 border-white/14 bg-black/28 px-4 py-2 text-[10px] text-white backdrop-blur-md hover:bg-black/40"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          Menu
        </button>
      </div>

      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="editorial-container pt-20 sm:pt-24">
        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="reveal max-w-3xl">
            <div className="editorial-kicker text-white/54">Public dispatches</div>
            <div className="line-wipe mt-5 max-w-sm bg-white/16" />
            <h1 className="mt-8 font-serif text-[clamp(3.2rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.03em] text-white">
              News
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAuthor && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
              >
                编辑
              </button>
            )}
            <Link
              href={getBackUrl()}
              className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
            >
              Back
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[1.2rem] border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, #9a4b3d 24%, transparent)", background: "color-mix(in srgb, #9a4b3d 10%, transparent)", color: "color-mix(in srgb, #9a4b3d 40%, #e8e4d9)" }}>
            {error}
          </div>
        )}

        {isEditing && isAuthor ? (
          <div className="reveal editorial-panel mb-6 p-6 sm:p-8">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                  标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="editorial-input text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                  内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={15}
                  className="editorial-textarea text-sm leading-7"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="editorial-select text-sm"
                    disabled={saving}
                  >
                    <option value="MEDIA">MEDIA</option>
                    <option value="MAGAZINE">MAGAZINE</option>
                    <option value="あの">あの</option>
                    <option value="ANO">ANO</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                    标签
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) =>
                      setFormData({ ...formData, tag: e.target.value })
                    }
                    className="editorial-input text-sm"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                  分享链接
                </label>
                <input
                  type="url"
                  value={formData.shareUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, shareUrl: e.target.value })
                  }
                  className="editorial-input text-sm"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
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
                      <span className="text-xs text-white/62">
                        {ch.platform === "twitter" ? "Twitter/X" : ch.platform === "facebook" ? "Facebook" : "LINE"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 背景设置（控制详情页背景） */}
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/44">
                  背景设置（控制此详情页背景）
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, backgroundType: "color" })
                      }
                      className={`editorial-button min-h-10 px-4 py-2 text-[10px] ${
                        formData.backgroundType === "color"
                          ? "editorial-button--primary"
                          : "border-white/14 bg-black/24 text-white hover:bg-black/36"
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
                      className={`editorial-button min-h-10 px-4 py-2 text-[10px] ${
                        formData.backgroundType === "image"
                          ? "editorial-button--primary"
                          : "border-white/14 bg-black/24 text-white hover:bg-black/36"
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
                        className="h-10 w-full rounded-[1rem] border border-white/10 bg-black/10"
                        disabled={saving}
                      />
                      <div
                        className="mt-2 h-16 w-full rounded-[1rem] border border-white/10"
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
                        className="editorial-input mb-2 text-sm"
                        disabled={saving}
                      />
                      <div className="relative mt-2 h-32 w-full overflow-hidden rounded-[1rem] border border-white/10 bg-black/10">
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
                            <div className="text-xs text-white/40">暂无图片</div>
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
                  <span className="text-xs text-white/62">已发布</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="editorial-button editorial-button--primary min-h-11 px-4 py-2.5 text-[11px] disabled:opacity-40"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (id) {
                      loadArticle(id);
                    }
                  }}
                  disabled={saving}
                  className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md disabled:opacity-40"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="reveal editorial-panel mb-6 p-6 sm:p-8">
            {/* 文章标题 */}
            <h2
              data-testid="public-news-detail-title"
              className="font-serif text-[clamp(2.4rem,4vw,4.4rem)] font-light leading-[0.96] tracking-[0.03em] text-white"
            >
              {article.title}
            </h2>

            {/* 元信息 */}
            <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/44">
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
              <div className="mb-4 mt-8 flex gap-2 border-t border-white/10 pt-4">
                {shareChannels
                  .filter((ch) => ch.enabled)
                  .map((ch) => (
                    <button
                      key={ch.platform}
                      type="button"
                      onClick={() => handleShare(ch.platform)}
                      className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
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
            <div className="mt-6">
              <div className="whitespace-pre-wrap text-sm leading-8 text-white/72">
                {article.content}
              </div>
            </div>

            {/* 分享链接 */}
            {article.shareUrl && (
              <div className="mb-4 mt-6">
                <a
                  href={article.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-link text-sm"
                >
                  {article.shareUrl}
                </a>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="mt-8 flex gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
              >
                前へ
              </button>
              <Link
                href={getBackUrl()}
                className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
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
