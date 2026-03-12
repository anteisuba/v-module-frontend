// app/news/page.tsx

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { newsArticleApi, pageApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n/context";
import PageLoading from "@/components/ui/PageLoading";
import { useHeroMenu } from "@/features/home-hero/hooks/useHeroMenu";
import HeroMenu from "@/features/home-hero/components/HeroMenu";
import type { NewsArticle } from "@/lib/api/types";
import type { PageConfig } from "@/domain/page-config/types";

function NewsListContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const menu = useHeroMenu();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 获取返回链接：优先使用 referrer 或 URL 参数，否则使用默认值
  const getBackUrl = () => {
    const fromParam = searchParams.get("from");
    if (fromParam) {
      return fromParam;
    }
    return null;
  };

  // 获取第一个文章的 userSlug（用于依赖数组）
  const firstArticleUserSlug = articles.length > 0 ? articles[0]?.userSlug : null;

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
        
        // 如果没有 from 参数，尝试从文章列表中获取用户 slug
        if (firstArticleUserSlug) {
          const config = await pageApi.getPublishedConfig(firstArticleUserSlug);
          setPageConfig(config);
        }
      } catch (err) {
        console.error("Failed to load page config:", err);
      }
    }
    loadPageConfig();
  }, [searchParams, firstArticleUserSlug]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await newsArticleApi.getArticles({
        page: currentPage,
        limit: 10,
        // 不传 category，显示所有分类的文章
        published: true, // 只显示已发布的文章
      });
      setArticles(response.articles);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("加载文章列表失败");
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  // 获取背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
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
    return { backgroundColor: "#000000" };
  };

  // 初始加载时显示完整的加载页面（避免黑屏）
  if (loading && (isInitialLoad || articles.length === 0)) {
    return <PageLoading message={t("common.loadingNewsList")} />;
  }

  const backgroundStyle = getBackgroundStyle();

  const backUrl = getBackUrl();

  return (
    <main
      data-testid="public-news-list"
      className="editorial-shell relative min-h-screen"
    >
      <div className="absolute inset-0" style={backgroundStyle} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.18),rgba(8,8,6,0.6)_56%,rgba(8,8,6,0.82))]" />

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
        <div className="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="reveal max-w-3xl">
            <div className="editorial-kicker text-white/54">Public dispatches</div>
            <div className="line-wipe mt-5 max-w-sm bg-white/16" />
            <h1 className="mt-8 font-serif text-[clamp(3.2rem,7vw,6.8rem)] font-light leading-[0.92] tracking-[0.03em] text-white">
              News
            </h1>
          </div>
          {backUrl ? (
            <Link
              href={backUrl}
              className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
            >
              Back
            </Link>
          ) : null}
        </div>

        {error && (
          <div className="mb-4 rounded-[1.2rem] border border-red-400/24 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center text-white/56">加载中...</div>
        )}

        {!loading && articles.length === 0 && (
          <div className="reveal editorial-panel px-6 py-16 text-center text-white/56">
            暂无文章
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                data-testid={`public-news-article-${article.id}`}
                className="reveal block rounded-[1.6rem] border border-white/10 bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_92%,transparent)] p-5 backdrop-blur-xl transition hover:bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_98%,transparent)]"
              >
                <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/44">
                  <span>
                    {new Date(article.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="font-medium">{article.category}</span>
                  {article.tag && <span>{article.tag}</span>}
                </div>
                <h2 className="font-serif text-[1.8rem] font-light leading-[1.02] tracking-[0.03em] text-white">
                  {article.title}
                </h2>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md disabled:opacity-40"
            >
              前へ
            </button>
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/44">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="editorial-button min-h-11 border-white/14 bg-black/26 px-4 py-2.5 text-[11px] text-white backdrop-blur-md disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function NewsListPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<PageLoading message={t("common.loadingNewsList")} />}>
      <NewsListContent />
    </Suspense>
  );
}
