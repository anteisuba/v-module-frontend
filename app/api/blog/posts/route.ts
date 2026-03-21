// app/api/blog/posts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import { getBlogPosts, createBlogPost } from "@/domain/blog/services";
import { ApiRouteError, createApiErrorResponse, readJsonBody } from "@/lib/api/server";
import { createBlogPostInputSchema } from "@/domain/blog/schemas";

export const runtime = "nodejs";

// GET: 获取博客文章列表（支持分页和过滤）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userSlug = searchParams.get("userSlug") || undefined;
    const publishedParam = searchParams.get("published");

    let userId: string | undefined;
    let currentUserSlug: string | undefined;
    const session = await getServerSession();
    if (session?.user?.id) {
      userId = session.user.id;
      currentUserSlug = session.user.slug;
    }

    let published: boolean | undefined;
    if (publishedParam === "true") {
      published = true;
    } else if (publishedParam === "false") {
      if (!userId) {
        return NextResponse.json({
          posts: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      published = false;
    }

    const finalUserSlug = userSlug || currentUserSlug;

    const result = await getBlogPosts({ page, limit, userSlug: finalUserSlug, published });
    return NextResponse.json(result);
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "BLOG_LIST_FAILED",
      message: "获取文章列表失败",
      status: 500,
      logMessage: "Failed to get blog posts",
    });
  }
}

// POST: 创建新博客文章
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      throw new ApiRouteError("UNAUTHORIZED", "Unauthorized", 401);
    }

    const input = await readJsonBody(request, createBlogPostInputSchema, {
      code: "INVALID_BLOG_POST_INPUT",
      message: "文章内容格式不正确",
    });

    const post = await createBlogPost({ userId: session.user.id, ...input });
    return NextResponse.json({ post });
  } catch (error) {
    return createApiErrorResponse(error, {
      code: "BLOG_CREATE_FAILED",
      message: "创建文章失败",
      status: 500,
      logMessage: "Failed to create blog post",
    });
  }
}
