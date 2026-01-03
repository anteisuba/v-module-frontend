// app/api/news/articles/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET: 获取新闻列表（支持分页和过滤）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const category = searchParams.get("category");
  const published = searchParams.get("published"); // "true" | "false" | null (all)

  // 检查是否需要认证（如果查询未发布的文章）
  let userId: string | undefined;
  if (published === "false" || published === null) {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;
  }

  const skip = (page - 1) * limit;

  // 构建查询条件
  const where: any = {};
  if (category) {
    where.category = category;
  }
  if (published === "true") {
    where.published = true;
  } else if (published === "false") {
    if (userId) {
      where.published = false;
      where.userId = userId; // 只能查看自己的未发布文章
    } else {
      // 未登录用户不能查看未发布的文章
      return NextResponse.json({ articles: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }
  } else if (published === "null" && userId) {
    where.userId = userId; // 查看自己的所有文章（包括已发布和未发布）
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

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { title, content, category, tag, shareUrl, shareChannels, published, backgroundType, backgroundValue } = body;

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "title, content, and category are required" },
      { status: 400 }
    );
  }

  const article = await prisma.newsArticle.create({
    data: {
      userId,
      title,
      content,
      category,
      tag: tag || null,
      shareUrl: shareUrl || null,
      shareChannels: shareChannels || null,
      backgroundType: backgroundType || "color",
      backgroundValue: backgroundValue || "#000000",
      published: published === true,
      publishedAt: published === true ? new Date() : null,
    },
  });

  return NextResponse.json({ article });
}

