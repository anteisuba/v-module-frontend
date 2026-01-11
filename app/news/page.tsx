// app/news/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
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
    // 默认返回到 /u/xiuruisu
    return "/u/xiuruisu";
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

  const loadArticles = async () => {
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
  };

  useEffect(() => {
    loadArticles();
  }, [currentPage]);

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

  return (
    <main className="relative min-h-screen text-black" style={backgroundStyle}>
      {/* 右上角菜单按钮 */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4 text-white">
        <button
          className="text-2xl opacity-90 hover:opacity-100 transition drop-shadow-lg"
          type="button"
          aria-label="menu"
          onClick={menu.toggleMenu}
        >
          ☰
        </button>
      </div>

      {/* 菜单 */}
      <HeroMenu open={menu.open} onClose={menu.closeMenu} />

      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* 标题 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-wider">NEWS</h1>
          <Link
            href={getBackUrl()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            BACK
          </Link>
        </div>


        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="py-12 text-center text-black/60">加载中...</div>
        )}

        {/* 文章列表 */}
        {!loading && articles.length === 0 && (
          <div className="py-12 text-center text-black/60">暂无文章</div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="block rounded-lg border border-black/10 bg-black/5 p-4 transition-colors hover:bg-black/10"
              >
                <div className="mb-2 flex items-center gap-3 text-sm text-black/60">
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
                <h2 className="text-lg font-medium text-black">{article.title}</h2>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-black/20 bg-black/5 px-4 py-2 text-sm text-black transition-colors hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <span className="text-sm text-black/60">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-black/20 bg-black/5 px-4 py-2 text-sm text-black transition-colors hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
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

