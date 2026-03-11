// app/api/news/articles/route.ts

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asOptionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

// GET: 获取新闻列表（支持分页和过滤）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const published = searchParams.get("published"); // "true" | "false" | null (all)

  // 检查是否需要认证（如果查询未发布的文章或所有文章）
  let userId: string | undefined;
  const session = await getServerSession();
  if (session?.user?.id) {
    userId = session.user.id;
  }

  const skip = (page - 1) * limit;

  // 构建查询条件
  const where: Prisma.NewsArticleWhereInput = {};
  if (category) {
    where.category = category;
  }
  
  // 如果用户已登录，始终只显示该用户的文章
  if (userId) {
    where.userId = userId;
  }
  
  if (published === "true") {
    where.published = true;
  } else if (published === "false") {
    if (userId) {
      where.published = false;
      // where.userId 已经在上面设置了
    } else {
      // 未登录用户不能查看未发布的文章
      return NextResponse.json({
        articles: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }
  } else if (published === "null") {
    // 查看所有文章（包括已发布和未发布），但只显示当前用户的
    // where.userId 已经在上面设置了
  } else if (!userId) {
    // 未登录用户只能查看已发布的文章
    where.published = true;
  }

  // 查询文章
  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            slug: true,
          },
        },
      },
    }),
    prisma.newsArticle.count({ where }),
  ]);

  // 转换文章数据，添加 userSlug
  const articlesWithSlug = articles.map(({ user, ...article }) => ({
    ...article,
    userSlug: user?.slug || null,
  }));

  return NextResponse.json({
    articles: articlesWithSlug,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST: 创建新文章
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const {
    title,
    content,
    category,
    tag,
    shareUrl,
    shareChannels,
    published,
    backgroundType,
    backgroundValue,
  } = body;

  const normalizedTitle = asOptionalString(title)?.trim() || "";
  const normalizedContent = asOptionalString(content)?.trim() || "";
  const normalizedCategory = asOptionalString(category)?.trim() || "";

  if (!normalizedTitle || !normalizedContent || !normalizedCategory) {
    return NextResponse.json(
      { error: "title, content, and category are required" },
      { status: 400 }
    );
  }

  const article = await prisma.newsArticle.create({
    data: {
      userId,
      title: normalizedTitle,
      content: normalizedContent,
      category: normalizedCategory,
      tag: asOptionalString(tag),
      shareUrl: asOptionalString(shareUrl),
      shareChannels:
        shareChannels === undefined || shareChannels === null
          ? Prisma.JsonNull
          : (shareChannels as Prisma.InputJsonValue),
      backgroundType: asOptionalString(backgroundType) || "color",
      backgroundValue: asOptionalString(backgroundValue) || "#000000",
      published: asOptionalBoolean(published) === true,
      publishedAt: asOptionalBoolean(published) === true ? new Date() : null,
    },
  });

  return NextResponse.json({ article });
}
