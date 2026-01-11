// features/news-list/NewsListSection.tsx

import Link from "next/link";
import { getPublishedNewsArticles } from "@/domain/news";
import type { NewsArticle } from "@/lib/api/types";

interface NewsListSectionProps {
  slug?: string; // 用户 slug，用于返回链接
  limit?: number; // 显示的文章数量
  background?: { type: "color" | "image"; value: string }; // 新闻页面背景配置
}

export default async function NewsListSection({ slug, limit = 3, background }: NewsListSectionProps) {
  // 服务端直接获取数据
  let articles: NewsArticle[] = [];
  
  try {
    articles = await getPublishedNewsArticles({ limit });
  } catch (err) {
    console.error("Failed to load news articles:", err);
    // 数据获取失败时返回 null，不阻塞页面渲染
    return null;
  }

  if (articles.length === 0) {
    return null; // 没有文章时不显示
  }

  // 构建返回链接
  const newsHref = slug ? `/news?from=/u/${slug}` : "/news";

  // 获取背景样式
  const backgroundStyle: React.CSSProperties = background
    ? background.type === "color"
      ? { backgroundColor: background.value }
      : {
          backgroundImage: `url(${background.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
    : { backgroundColor: "#000000" };

  return (
    <section className="text-black py-16 px-6" style={backgroundStyle}>
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <h2 className="text-4xl font-bold tracking-wider mb-8 text-center">NEWS</h2>

        {/* 文章列表 */}
        <div className="space-y-4 mb-8">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}${slug ? `?from=/u/${slug}` : ""}`}
              className="block rounded-lg border border-black/10 bg-black/5 p-4 transition-colors hover:bg-black/10"
            >
              <div className="mb-2 flex items-center gap-3 text-sm text-black/60">
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
              <h3 className="text-lg font-medium text-black">{article.title}</h3>
            </Link>
          ))}
        </div>

        {/* MORE 按钮 */}
        <div className="text-center">
          <Link
            href={newsHref}
            className="inline-block rounded border border-black px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-black/10"
          >
            MORE
          </Link>
        </div>
      </div>
    </section>
  );
}

