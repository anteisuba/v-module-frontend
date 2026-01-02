// app/news/page.tsx

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { newsArticleApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { NewsArticle } from "@/lib/api/types";

function NewsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 获取返回链接：优先使用 referrer 或 URL 参数，否则使用默认值
  const getBackUrl = () => {
    const fromParam = searchParams.get("from");
    if (fromParam) {
      return fromParam;
    }
    // 默认返回到 /u/xiuruisu
    return "/u/xiuruisu";
  };

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
    }
  };

  useEffect(() => {
    loadArticles();
  }, [currentPage]);

  return (
    <main className="min-h-screen bg-black text-white">
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
          <div className="py-12 text-center text-white/60">加载中...</div>
        )}

        {/* 文章列表 */}
        {!loading && articles.length === 0 && (
          <div className="py-12 text-center text-white/60">暂无文章</div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="mb-2 flex items-center gap-3 text-sm text-white/60">
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
                <h2 className="text-lg font-medium text-white">{article.title}</h2>
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
              className="rounded border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <span className="text-sm text-white/60">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="py-12 text-center text-white/60">加载中...</div>
        </div>
      </main>
    }>
      <NewsListContent />
    </Suspense>
  );
}

