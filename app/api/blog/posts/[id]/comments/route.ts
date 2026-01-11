// app/api/blog/posts/[id]/comments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";

// POST: 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const body = await request.json();
    const { userName, userEmail, content } = body;

    if (!userName || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // 检查博客是否存在
    const blogPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // 创建评论
    const comment = await prisma.blogComment.create({
      data: {
        blogPostId: id,
        userId: session?.user?.id || null,
        userName: userName.trim(),
        userEmail: userEmail?.trim() || session?.user?.email || null,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            slug: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET: 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 获取评论列表
    const comments = await prisma.blogComment.findMany({
      where: { blogPostId: id },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            slug: true,
            displayName: true,
          },
        },
      },
    });

    // 获取总数
    const total = await prisma.blogComment.count({
      where: { blogPostId: id },
    });

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to get comments:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}
