// app/api/blog/posts/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  getBlogPosts,
  createBlogPost,
  type BlogPostCreateInput,
} from "@/domain/blog/services";

export const runtime = "nodejs";

// GET: 获取博客文章列表（支持分页和过滤）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const userSlug = searchParams.get("userSlug") || undefined;
  const publishedParam = searchParams.get("published");

  // 检查是否需要认证（如果查询未发布的文章）
  let userId: string | undefined;
  let currentUserSlug: string | undefined;
  const session = await getServerSession();
  if (session?.user?.id) {
    userId = session.user.id;
    currentUserSlug = session.user.slug;
  }

  // 处理 published 参数
  let published: boolean | undefined;
  if (publishedParam === "true") {
    published = true;
  } else if (publishedParam === "false") {
    if (!userId) {
      // 未登录用户不能查看未发布的文章
      return NextResponse.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }
    published = false;
  }
  // publishedParam === null 或 undefined 表示获取所有文章

  // 如果用户已登录且没有传递 userSlug，使用当前用户的 slug
  const finalUserSlug = userSlug || currentUserSlug;

  try {
    const result = await getBlogPosts({
      page,
      limit,
      userSlug: finalUserSlug,
      published,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to get blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST: 创建新博客文章
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const {
    title,
    content,
    coverImage,
    videoUrl,
    externalLinks,
    published,
  } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    );
  }

  try {
    const input: BlogPostCreateInput = {
      userId,
      title,
      content,
      coverImage: coverImage || null,
      videoUrl: videoUrl || null,
      externalLinks: externalLinks || null,
      published: published === true,
    };

    const post = await createBlogPost(input);
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create blog post" },
      { status: 500 }
    );
  }
}
