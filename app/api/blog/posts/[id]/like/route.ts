// app/api/blog/posts/[id]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";

// POST: 点赞/取消点赞
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const body = await request.json();
    const { userEmail } = body;

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

    const userId = session?.user?.id || null;
    const email = userEmail || session?.user?.email || null;

    // 检查是否已点赞（优先使用 userId，如果没有则使用 userEmail）
    let existingLike = null;
    if (userId) {
      existingLike = await prisma.blogLike.findFirst({
        where: {
          blogPostId: id,
          userId,
        },
      });
    } else if (email) {
      existingLike = await prisma.blogLike.findFirst({
        where: {
          blogPostId: id,
          userEmail: email,
          userId: null, // 确保是匿名用户
        },
      });
    }

    if (existingLike) {
      // 取消点赞
      await prisma.blogLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false });
    } else {
      // 点赞
      await prisma.blogLike.create({
        data: {
          blogPostId: id,
          userId,
          userEmail: email || undefined,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

// GET: 获取点赞状态和数量
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");

    const userId = session?.user?.id || null;
    const email = userEmail || session?.user?.email || null;

    // 获取点赞数量
    const likeCount = await prisma.blogLike.count({
      where: { blogPostId: id },
    });

    // 检查当前用户是否已点赞
    let isLiked = false;
    if (userId) {
      const existingLike = await prisma.blogLike.findFirst({
        where: {
          blogPostId: id,
          userId,
        },
      });
      isLiked = !!existingLike;
    } else if (email) {
      const existingLike = await prisma.blogLike.findFirst({
        where: {
          blogPostId: id,
          userEmail: email,
          userId: null,
        },
      });
      isLiked = !!existingLike;
    }

    return NextResponse.json({
      likeCount,
      isLiked,
    });
  } catch (error) {
    console.error("Failed to get like status:", error);
    return NextResponse.json(
      { error: "Failed to get like status" },
      { status: 500 }
    );
  }
}
