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
    // 如果提供了 slug，则只获取该用户的文章；否则获取所有用户的文章
    articles = await getPublishedNewsArticles({ 
      limit,
      userSlug: slug, // 传递用户 slug 来过滤特定用户的文章
    });
  } catch (err) {
    console.error("Failed to load news articles:", err);
    // 数据获取失败时返回 null，不阻塞页面渲染
    return null;
  }

  // 即使没有文章也显示标题和 MORE 按钮，保持页面结构一致
  // if (articles.length === 0) {
  //   return null; // 没有文章时不显示
  // }

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
    <section className="editorial-shell relative py-16" style={backgroundStyle}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,6,0.24),rgba(8,8,6,0.64)_56%,rgba(8,8,6,0.82))]" />
      <div className="editorial-container">
        <div className="reveal max-w-3xl">
          <div className="editorial-kicker text-white/54">Latest dispatches</div>
          <div className="line-wipe mt-5 max-w-sm bg-white/16" />
          <h2 className="mt-8 font-serif text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.94] tracking-[0.03em] text-white">
            News
          </h2>
        </div>

        {articles.length > 0 ? (
          <div className="mt-10 space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}${slug ? `?from=/u/${slug}` : ""}`}
                className="reveal block rounded-[1.6rem] border border-white/10 bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_92%,transparent)] p-5 backdrop-blur-xl transition hover:bg-[color:color-mix(in_srgb,var(--editorial-surface-strong)_98%,transparent)]"
              >
                <div className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/44">
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
                <h3 className="font-serif text-[1.8rem] font-light leading-[1.02] tracking-[0.03em] text-white">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center text-white/56">
            <p>暂无新闻文章</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href={newsHref}
            className="editorial-button min-h-11 border-white/14 bg-black/26 px-5 py-2.5 text-[11px] text-white backdrop-blur-md hover:bg-black/40"
          >
            More
          </Link>
        </div>
      </div>
    </section>
  );
}
