// app/api/blog/posts/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { getBlogPostById, updateBlogPost, deleteBlogPost } from "@/domain/blog/services";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { updateBlogPostInputSchema } from "@/domain/blog/schemas";

export const runtime = "nodejs";

function toBlogApiError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes("not found")) {
      throw new ApiRouteError("POST_NOT_FOUND", error.message, 404);
    }
    if (error.message.includes("Forbidden")) {
      throw new ApiRouteError("FORBIDDEN", error.message, 403);
    }
  }
  throw error;
}

// GET: 获取单篇博客文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getBlogPostById(id);

    if (!post) {
      throw new ApiRouteError("POST_NOT_FOUND", "Blog post not found", 404);
    }

    if (!post.published) {
      const session = await getServerSession();
      if (!session?.user?.id || session.user.id !== post.userId) {
        throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "BLOG_GET_FAILED",
      message: "获取文章失败",
      status: 500,
      logMessage: "Failed to get blog post",
    });
  }
}

// PUT: 更新博客文章
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { id } = await params;
    const input = await readJsonBody(request, updateBlogPostInputSchema, {
      code: "INVALID_BLOG_POST_INPUT",
      message: "文章内容格式不正确",
    });

    let post;
    try {
      post = await updateBlogPost(id, session.user.id, input);
    } catch (err) {
      toBlogApiError(err);
    }

    return NextResponse.json({ post });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "BLOG_UPDATE_FAILED",
      message: "更新文章失败",
      status: 500,
      logMessage: "Failed to update blog post",
    });
  }
}

// DELETE: 删除博客文章
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { id } = await params;

    try {
      await deleteBlogPost(id, session.user.id);
    } catch (err) {
      toBlogApiError(err);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "BLOG_DELETE_FAILED",
      message: "删除文章失败",
      status: 500,
      logMessage: "Failed to delete blog post",
    });
  }
}
