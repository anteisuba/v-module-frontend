import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import {
  BLOG_COMMENT_APPROVED_STATUS,
  BLOG_COMMENT_PENDING_STATUS,
  BLOG_COMMENT_PUBLIC_QUERY,
  serializeBlogComment,
} from "@/domain/blog/comments";

export const runtime = "nodejs";

async function getPublishedBlogPost(id: string) {
  return prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      published: true,
    },
  });
}

function parsePaginationParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPublishedBlogPost(id);

    if (!post || !post.published) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession();
    const body = await request.json();
    const { userName, userEmail, content } = body;

    if (!userName || !content || !content.trim()) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const comment = await prisma.blogComment.create({
      data: {
        blogPostId: id,
        userId: session?.user?.id || null,
        userName: userName.trim(),
        userEmail: userEmail?.trim() || session?.user?.email || null,
        content: content.trim(),
        status: BLOG_COMMENT_PENDING_STATUS,
      },
      ...BLOG_COMMENT_PUBLIC_QUERY,
    });

    return NextResponse.json(serializeBlogComment(comment), { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPublishedBlogPost(id);

    if (!post || !post.published) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parsePaginationParam(searchParams.get("page"), 1, 1000);
    const limit = parsePaginationParam(searchParams.get("limit"), 20, 100);

    const [comments, total] = await Promise.all([
      prisma.blogComment.findMany({
        where: {
          blogPostId: id,
          status: BLOG_COMMENT_APPROVED_STATUS,
        },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        ...BLOG_COMMENT_PUBLIC_QUERY,
      }),
      prisma.blogComment.count({
        where: {
          blogPostId: id,
          status: BLOG_COMMENT_APPROVED_STATUS,
        },
      }),
    ]);

    return NextResponse.json({
      comments: comments.map(serializeBlogComment),
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
