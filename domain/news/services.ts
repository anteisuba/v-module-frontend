// domain/news/services.ts

import { prisma } from "@/lib/prisma";
import type { NewsArticle } from "@/lib/api/types";

/**
 * 获取已发布的新闻文章列表（服务端函数）
 * 用于 Server Components 直接调用，无需通过 API
 */
export async function getPublishedNewsArticles(params: {
  limit?: number;
  category?: string;
}): Promise<NewsArticle[]> {
  const { limit = 10, category } = params;

  const where: any = {
    published: true, // 只获取已发布的文章
  };

  if (category) {
    where.category = category;
  }

  const articles = await prisma.newsArticle.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          slug: true,
        },
      },
    },
  });

  // 转换数据格式，添加 userSlug，并确保日期字段为字符串格式
  return articles.map(({ user, createdAt, updatedAt, publishedAt, ...article }) => ({
    ...article,
    userSlug: user?.slug || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
  }));
}
