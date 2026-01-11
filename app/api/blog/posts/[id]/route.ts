// app/api/blog/posts/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session/userSession";
import {
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  type BlogPostUpdateInput,
} from "@/domain/blog/services";

export const runtime = "nodejs";

// GET: 获取单篇博客文章
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const post = await getBlogPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // 如果文章未发布，需要验证权限
    if (!post.published) {
      const session = await getServerSession();
      if (!session?.user?.id || session.user.id !== post.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to get blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT: 更新博客文章
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

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { title, content, coverImage, videoUrl, externalLinks, published } = body;

  try {
    const input: BlogPostUpdateInput = {};
    if (title !== undefined) input.title = title;
    if (content !== undefined) input.content = content;
    if (coverImage !== undefined) input.coverImage = coverImage;
    if (videoUrl !== undefined) input.videoUrl = videoUrl;
    if (externalLinks !== undefined) input.externalLinks = externalLinks;
    if (published !== undefined) input.published = published;

    const post = await updateBlogPost(id, userId, input);
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    if (error instanceof Error && error.message.includes("Forbidden")) {
      console.error(`[Forbidden Debug] Current User ID: ${userId}, Post ID: ${id}`);
    }
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update blog post" },
      { status }
    );
  }
}

// DELETE: 删除博客文章
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

  try {
    await deleteBlogPost(id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    const status =
      error instanceof Error && error.message.includes("not found")
        ? 404
        : error instanceof Error && error.message.includes("Forbidden")
        ? 403
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete blog post" },
      { status }
    );
  }
}
