// domain/news/services.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { NewsArticle } from "@/lib/api/types";

/**
 * 获取已发布的新闻文章列表（服务端函数）
 * 用于 Server Components 直接调用，无需通过 API
 */
export async function getPublishedNewsArticles(params: {
  limit?: number;
  category?: string;
  userSlug?: string; // 用户 slug，用于过滤特定用户的文章
}): Promise<NewsArticle[]> {
  const { limit = 10, category, userSlug } = params;

  const where: Prisma.NewsArticleWhereInput = {
    published: true, // 只获取已发布的文章
  };

  if (category) {
    where.category = category;
  }

  // 如果指定了 userSlug，则只获取该用户的文章
  if (userSlug) {
    where.user = {
      slug: userSlug,
    };
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
  return articles.map(
    ({ user, createdAt, updatedAt, publishedAt, shareChannels, ...article }) => ({
      ...article,
      userSlug: user?.slug || null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
      shareChannels:
        Array.isArray(shareChannels) &&
        shareChannels.every(
          (channel) =>
            typeof channel === "object" &&
            channel !== null &&
            "platform" in channel &&
            typeof channel.platform === "string" &&
            "enabled" in channel &&
            typeof channel.enabled === "boolean"
        )
          ? (shareChannels as Array<{ platform: string; enabled: boolean }>)
          : null,
    })
  );
}
