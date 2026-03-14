import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  NewsArticle as ApiNewsArticle,
  NewsArticleListResponse,
} from "@/lib/api/types";
import { ApiRouteError } from "@/lib/api/server";
import type {
  CreateNewsArticleInput,
  NewsArticleListQueryInput,
  UpdateNewsArticleInput,
} from "./schemas";

type NewsArticleRecord = {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tag: string | null;
  shareUrl: string | null;
  shareChannels: Prisma.JsonValue | null;
  backgroundType: string | null;
  backgroundValue: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  user?: {
    slug: string;
  } | null;
};

const newsArticleWithUserInclude = {
  user: {
    select: {
      slug: true,
    },
  },
} satisfies Prisma.NewsArticleInclude;

function serializeDate(value: Date) {
  return value.toISOString();
}

function serializeShareChannels(
  value: Prisma.JsonValue | null
): ApiNewsArticle["shareChannels"] {
  if (!Array.isArray(value)) {
    return null;
  }

  const channels = value
    .map((entry) => {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("platform" in entry) ||
        !("enabled" in entry)
      ) {
        return null;
      }

      const platform = entry.platform;
      const enabled = entry.enabled;

      if (typeof platform !== "string" || typeof enabled !== "boolean") {
        return null;
      }

      return {
        platform,
        enabled,
      };
    })
    .filter(
      (
        entry
      ): entry is {
        platform: string;
        enabled: boolean;
      } => entry !== null
    );

  return channels.length > 0 ? channels : null;
}

export function serializeNewsArticle(article: NewsArticleRecord): ApiNewsArticle {
  return {
    id: article.id,
    userId: article.userId,
    title: article.title,
    content: article.content,
    category: article.category,
    tag: article.tag,
    shareUrl: article.shareUrl,
    shareChannels: serializeShareChannels(article.shareChannels),
    backgroundType: article.backgroundType,
    backgroundValue: article.backgroundValue,
    published: article.published,
    createdAt: serializeDate(article.createdAt),
    updatedAt: serializeDate(article.updatedAt),
    publishedAt: article.publishedAt ? serializeDate(article.publishedAt) : null,
    userSlug: article.user?.slug || null,
  };
}

function buildNewsArticleListWhere(params: {
  category?: string;
  published?: boolean | null;
  viewerUserId?: string | null;
}) {
  const where: Prisma.NewsArticleWhereInput = {};

  if (params.category) {
    where.category = params.category;
  }

  if (params.viewerUserId) {
    where.userId = params.viewerUserId;
  }

  if (params.published === true) {
    where.published = true;
  } else if (params.published === false) {
    if (params.viewerUserId) {
      where.published = false;
    } else {
      where.id = "__no_public_drafts__";
    }
  } else if (!params.viewerUserId) {
    where.published = true;
  }

  return where;
}

async function getOwnedNewsArticleOrThrow(id: string, userId: string) {
  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new ApiRouteError(
      "NEWS_ARTICLE_NOT_FOUND",
      "Article not found",
      404
    );
  }

  if (existing.userId !== userId) {
    throw new ApiRouteError("FORBIDDEN", "Forbidden", 403);
  }

  return existing;
}

export async function listNewsArticles(params: NewsArticleListQueryInput & {
  viewerUserId?: string | null;
}): Promise<NewsArticleListResponse> {
  const { page, limit, category, published, viewerUserId = null } = params;
  const skip = (page - 1) * limit;
  const where = buildNewsArticleListWhere({
    category,
    published,
    viewerUserId,
  });

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: newsArticleWithUserInclude,
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return {
    articles: articles.map((article) => serializeNewsArticle(article)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getNewsArticleById(params: {
  id: string;
  viewerUserId?: string | null;
}) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: params.id },
    include: newsArticleWithUserInclude,
  });

  if (!article) {
    throw new ApiRouteError(
      "NEWS_ARTICLE_NOT_FOUND",
      "Article not found",
      404
    );
  }

  if (!article.published && params.viewerUserId !== article.userId) {
    throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
  }

  return serializeNewsArticle(article);
}

export async function createNewsArticle(params: {
  userId: string;
  input: CreateNewsArticleInput;
}) {
  const { userId, input } = params;

  const article = await prisma.newsArticle.create({
    data: {
      userId,
      title: input.title,
      content: input.content,
      category: input.category,
      tag: input.tag ?? null,
      shareUrl: input.shareUrl ?? null,
      shareChannels:
        input.shareChannels == null
          ? Prisma.JsonNull
          : (input.shareChannels as Prisma.InputJsonValue),
      backgroundType: input.backgroundType,
      backgroundValue: input.backgroundValue,
      published: input.published,
      publishedAt: input.published ? new Date() : null,
    },
    include: newsArticleWithUserInclude,
  });

  return serializeNewsArticle(article);
}

export async function updateNewsArticle(params: {
  id: string;
  userId: string;
  input: UpdateNewsArticleInput;
}) {
  const existing = await getOwnedNewsArticleOrThrow(params.id, params.userId);
  const updateData: Prisma.NewsArticleUpdateInput = {};

  if ("title" in params.input) {
    updateData.title = params.input.title;
  }

  if ("content" in params.input) {
    updateData.content = params.input.content;
  }

  if ("category" in params.input) {
    updateData.category = params.input.category;
  }

  if ("tag" in params.input) {
    updateData.tag = params.input.tag ?? null;
  }

  if ("shareUrl" in params.input) {
    updateData.shareUrl = params.input.shareUrl ?? null;
  }

  if ("shareChannels" in params.input) {
    updateData.shareChannels =
      params.input.shareChannels == null
        ? Prisma.JsonNull
        : (params.input.shareChannels as Prisma.InputJsonValue);
  }

  if ("backgroundType" in params.input) {
    updateData.backgroundType = params.input.backgroundType ?? "color";
  }

  if ("backgroundValue" in params.input) {
    updateData.backgroundValue = params.input.backgroundValue ?? "#000000";
  }

  if ("published" in params.input && typeof params.input.published === "boolean") {
    updateData.published = params.input.published;

    if (params.input.published && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const article = await prisma.newsArticle.update({
    where: { id: params.id },
    data: updateData,
    include: newsArticleWithUserInclude,
  });

  return serializeNewsArticle(article);
}

export async function deleteNewsArticle(params: { id: string; userId: string }) {
  await getOwnedNewsArticleOrThrow(params.id, params.userId);

  await prisma.newsArticle.delete({
    where: { id: params.id },
  });
}

/**
 * 获取已发布的新闻文章列表（服务端函数）
 * 用于 Server Components 直接调用，无需通过 API
 */
export async function getPublishedNewsArticles(params: {
  limit?: number;
  category?: string;
  userSlug?: string; // 用户 slug，用于过滤特定用户的文章
}): Promise<ApiNewsArticle[]> {
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
    include: newsArticleWithUserInclude,
  });

  return articles.map((article) => serializeNewsArticle(article));
}
