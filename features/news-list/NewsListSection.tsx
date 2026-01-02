// features/news-list/NewsListSection.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { newsArticleApi } from "@/lib/api";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { NewsArticle } from "@/lib/api/types";

interface NewsListSectionProps {
  slug?: string; // 用户 slug，用于返回链接
  limit?: number; // 显示的文章数量
}

export default function NewsListSection({ slug, limit = 3 }: NewsListSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        setLoading(true);
        const response = await newsArticleApi.getArticles({
          page: 1,
          limit,
          published: true, // 只显示已发布的文章
        });
        setArticles(response.articles);
      } catch (err) {
        console.error("Failed to load news articles:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    loadArticles();
  }, [limit]);

  if (loading) {
    return null; // 加载时不显示
  }

  if (articles.length === 0) {
    return null; // 没有文章时不显示
  }

  // 构建返回链接
  const newsHref = slug ? `/news?from=/u/${slug}` : "/news";

  return (
    <section className="bg-black text-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <h2 className="text-4xl font-bold tracking-wider mb-8 text-center">NEWS</h2>

        {/* 文章列表 */}
        <div className="space-y-4 mb-8">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}${slug ? `?from=/u/${slug}` : ""}`}
              className="block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="mb-2 flex items-center gap-3 text-sm text-white/60">
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
              <h3 className="text-lg font-medium text-white">{article.title}</h3>
            </Link>
          ))}
        </div>

        {/* MORE 按钮 */}
        <div className="text-center">
          <Link
            href={newsHref}
            className="inline-block rounded border border-white px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            MORE
          </Link>
        </div>
      </div>
    </section>
  );
}

