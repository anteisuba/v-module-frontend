// app/api/news/articles/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET: 获取单篇文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await prisma.newsArticle.findUnique({
    where: { id },
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

  return NextResponse.json({ article });
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

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { title, content, category, tag, shareUrl, shareChannels, published, backgroundType, backgroundValue } =
    body;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (category !== undefined) updateData.category = category;
  if (tag !== undefined) updateData.tag = tag || null;
  if (shareUrl !== undefined) updateData.shareUrl = shareUrl || null;
  if (shareChannels !== undefined) updateData.shareChannels = shareChannels;
  if (backgroundType !== undefined) updateData.backgroundType = backgroundType || "color";
  if (backgroundValue !== undefined) updateData.backgroundValue = backgroundValue || "#000000";
  if (published !== undefined) {
    updateData.published = published;
    if (published && !existing.publishedAt) {
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

  await prisma.newsArticle.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

