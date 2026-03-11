// app/api/news/articles/[id]/route.ts

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

// GET: 获取单篇文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.newsArticle.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // 如果文章未发布，需要验证权限
  if (!article.published) {
    const session = await getServerSession();
    if (!session?.user?.id || session.user.id !== article.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { user, ...articleData } = article;
  return NextResponse.json({
    article: {
      ...articleData,
      userSlug: user?.slug || null,
    },
  });
}

// PUT: 更新文章
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;

  // 检查文章是否存在且属于当前用户
  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const updateData: Prisma.NewsArticleUpdateInput = {};
  if (title !== undefined) updateData.title = asOptionalString(title) || "";
  if (content !== undefined) updateData.content = asOptionalString(content) || "";
  if (category !== undefined) updateData.category = asOptionalString(category) || "";
  if (tag !== undefined) updateData.tag = asOptionalString(tag);
  if (shareUrl !== undefined) updateData.shareUrl = asOptionalString(shareUrl);
  if (shareChannels !== undefined) {
    updateData.shareChannels =
      shareChannels === null ? Prisma.JsonNull : (shareChannels as Prisma.InputJsonValue);
  }
  if (backgroundType !== undefined) {
    updateData.backgroundType = asOptionalString(backgroundType) || "color";
  }
  if (backgroundValue !== undefined) {
    updateData.backgroundValue = asOptionalString(backgroundValue) || "#000000";
  }
  const nextPublished = asOptionalBoolean(published);
  if (nextPublished !== null) {
    updateData.published = nextPublished;
    if (nextPublished && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const article = await prisma.newsArticle.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ article });
}

// DELETE: 删除文章
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await params;

  // 检查文章是否存在且属于当前用户
  const existing = await prisma.newsArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.newsArticle.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
