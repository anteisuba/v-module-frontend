import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import {
  BLOG_COMMENT_MODERATION_QUERY,
  buildBlogCommentModerationSummary,
  buildBlogCommentSearchWhere,
  isBlogCommentStatus,
  serializeModerationBlogComment,
} from "@/domain/blog/comments";

export const runtime = "nodejs";

function parsePaginationParam(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePaginationParam(searchParams.get("page"), 1, 1000);
    const limit = parsePaginationParam(searchParams.get("limit"), 20, 100);
    const statusParam = searchParams.get("status");
    const query = searchParams.get("query") || "";

    if (statusParam && statusParam !== "ALL" && !isBlogCommentStatus(statusParam)) {
      return NextResponse.json(
        { error: "Invalid comment status" },
        { status: 400 }
      );
    }

    const searchWhere = buildBlogCommentSearchWhere(query);
    const baseWhere: Prisma.BlogCommentWhereInput = {
      blogPost: {
        userId: session.user.id,
      },
      ...(searchWhere || {}),
    };
    const where: Prisma.BlogCommentWhereInput =
      statusParam && statusParam !== "ALL"
        ? {
            ...baseWhere,
            status: statusParam,
          }
        : baseWhere;

    const [comments, total, summaryRows] = await Promise.all([
      prisma.blogComment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        ...BLOG_COMMENT_MODERATION_QUERY,
      }),
      prisma.blogComment.count({ where }),
      prisma.blogComment.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: {
          _all: true,
        },
      }),
    ]);

    return NextResponse.json({
      comments: comments.map(serializeModerationBlogComment),
      summary: buildBlogCommentModerationSummary(summaryRows),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch moderation comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch moderation comments" },
      { status: 500 }
    );
  }
}
