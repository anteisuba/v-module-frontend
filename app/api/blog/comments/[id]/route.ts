import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/userSession";
import {
  BLOG_COMMENT_MODERATION_QUERY,
  BLOG_COMMENT_PENDING_STATUS,
  isBlogCommentStatus,
  serializeModerationBlogComment,
} from "@/domain/blog/comments";

export const runtime = "nodejs";

async function getOwnedComment(id: string, userId: string) {
  const comment = await prisma.blogComment.findUnique({
    where: { id },
    ...BLOG_COMMENT_MODERATION_QUERY,
  });

  if (!comment) {
    return {
      error: NextResponse.json(
        { error: "Blog comment not found" },
        { status: 404 }
      ),
    };
  }

  if (comment.blogPost.userId !== userId) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { comment };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const status = body.status;

    if (!status || !isBlogCommentStatus(status)) {
      return NextResponse.json(
        { error: "Invalid comment status" },
        { status: 400 }
      );
    }

    const owned = await getOwnedComment(id, session.user.id);

    if (owned.error) {
      return owned.error;
    }

    const moderatedAt =
      owned.comment.status === status
        ? owned.comment.moderatedAt
        : status === BLOG_COMMENT_PENDING_STATUS
        ? null
        : new Date();

    const comment = await prisma.blogComment.update({
      where: { id },
      data: {
        status,
        moderatedAt,
      },
      ...BLOG_COMMENT_MODERATION_QUERY,
    });

    return NextResponse.json({
      comment: serializeModerationBlogComment(comment),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    console.error("Failed to update blog comment:", error);
    return NextResponse.json(
      { error: "Failed to update blog comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const owned = await getOwnedComment(id, session.user.id);

    if (owned.error) {
      return owned.error;
    }

    await prisma.blogComment.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete blog comment:", error);
    return NextResponse.json(
      { error: "Failed to delete blog comment" },
      { status: 500 }
    );
  }
}
