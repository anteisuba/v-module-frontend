// app/api/blog/posts/[id]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    const userId = session?.user?.id || null;
    const email = userEmail || session?.user?.email || null;

    const likeWhere = userId
      ? {
          blogPostId: id,
          userId,
        }
      : email
        ? {
            blogPostId: id,
            userEmail: email,
            userId: null,
          }
        : null;

    if (likeWhere) {
      const deleted = await prisma.blogLike.deleteMany({
        where: likeWhere,
      });

      if (deleted.count > 0) {
        return NextResponse.json({ liked: false });
      }
    }

    try {
      await prisma.blogLike.create({
        data: {
          blogPostId: id,
          userId,
          userEmail: email || undefined,
        },
      });
      return NextResponse.json({ liked: true });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        );
      }

      throw error;
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

    const [likeCount, existingLike] = await Promise.all([
      prisma.blogLike.count({
        where: { blogPostId: id },
      }),
      userId
        ? prisma.blogLike.findFirst({
            where: {
              blogPostId: id,
              userId,
            },
          })
        : email
          ? prisma.blogLike.findFirst({
              where: {
                blogPostId: id,
                userEmail: email,
                userId: null,
              },
            })
          : Promise.resolve(null),
    ]);

    return NextResponse.json({
      likeCount,
      isLiked: !!existingLike,
    });
  } catch (error) {
    console.error("Failed to get like status:", error);
    return NextResponse.json(
      { error: "Failed to get like status" },
      { status: 500 }
    );
  }
}
