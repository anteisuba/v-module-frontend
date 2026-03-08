// domain/blog/services.ts

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  BLOG_COMMENT_APPROVED_STATUS,
  BLOG_COMMENT_PUBLIC_QUERY,
  getApprovedCommentCount,
  getApprovedCommentCountMap,
  serializeBlogComment,
  type BlogComment,
} from "./comments";

export interface BlogPost {
  id: string;
  userId: string;
  userSlug: string | null;
  userDisplayName: string | null;
  title: string;
  content: string;
  coverImage: string | null;
  videoUrl: string | null;
  externalLinks: Array<{ url: string; label: string }> | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export interface BlogPostDetail extends BlogPost {
  comments: BlogComment[];
}

export interface BlogPostCreateInput {
  userId: string;
  title: string;
  content: string;
  coverImage?: string | null;
  videoUrl?: string | null;
  externalLinks?: Array<{ url: string; label: string }> | null;
  published?: boolean;
}

export interface BlogPostUpdateInput {
  title?: string;
  content?: string;
  coverImage?: string | null;
  videoUrl?: string | null;
  externalLinks?: Array<{ url: string; label: string }> | null;
  published?: boolean;
}

export interface BlogPostListParams {
  page?: number;
  limit?: number;
  userSlug?: string;
  published?: boolean; // true: 只获取已发布, false: 只获取未发布, undefined: 获取所有
  viewerUserId?: string | null;
  viewerEmail?: string | null;
}

export interface BlogPostListResult {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogPostDetailOptions {
  viewerUserId?: string | null;
  viewerEmail?: string | null;
  commentsLimit?: number;
}

/**
 * 获取博客文章列表（支持分页和按 userSlug 过滤）
 */
export async function getBlogPosts(
  params: BlogPostListParams = {}
): Promise<BlogPostListResult> {
  const {
    page = 1,
    limit = 10,
    userSlug,
    published,
    viewerUserId,
    viewerEmail,
  } = params;

  const where: Prisma.BlogPostWhereInput = {};

  // 按用户 slug 过滤
  if (userSlug) {
    where.user = {
      slug: userSlug,
    };
  }

  // 按发布状态过滤
  if (published !== undefined) {
    where.published = published;
  }

  const skip = (page - 1) * limit;

  // 查询文章和总数
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            slug: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  const postIds = posts.map((post) => post.id);
  let likedPostIds = new Set<string>();
  const approvedCommentCountMap = await getApprovedCommentCountMap(postIds);

  if (postIds.length > 0 && (viewerUserId || viewerEmail)) {
    const likeWhere: Prisma.BlogLikeWhereInput = viewerUserId
      ? {
          blogPostId: { in: postIds },
          userId: viewerUserId,
        }
      : {
          blogPostId: { in: postIds },
          userEmail: viewerEmail!,
          userId: null,
        };

    likedPostIds = new Set(
      (
        await prisma.blogLike.findMany({
          where: likeWhere,
          select: {
            blogPostId: true,
          },
        })
      ).map((like) => like.blogPostId)
    );
  }

  // 转换数据格式
  const formattedPosts: BlogPost[] = posts.map(
    ({
      user,
      _count,
      createdAt,
      updatedAt,
      publishedAt,
      externalLinks,
      ...post
    }) => ({
      ...post,
      userSlug: user?.slug || null,
      userDisplayName: user?.displayName || null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
      likeCount: _count.likes,
      commentCount: approvedCommentCountMap.get(post.id) || 0,
      isLiked: likedPostIds.has(post.id),
      // 转换 externalLinks（Prisma JsonValue 类型）
      externalLinks:
        externalLinks &&
        typeof externalLinks === "object" &&
        Array.isArray(externalLinks)
          ? (externalLinks as Array<{ url: string; label: string }>)
          : null,
    })
  );

  return {
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 获取单篇博客文章详细内容
 */
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  if (!post) {
    return null;
  }

  const approvedCommentCount = await getApprovedCommentCount(id);

  const {
    user,
    _count,
    createdAt,
    updatedAt,
    publishedAt,
    externalLinks,
    ...postData
  } =
    post;

  return {
    ...postData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    likeCount: _count.likes,
    commentCount: approvedCommentCount,
    isLiked: false,
    // 转换 externalLinks
    externalLinks:
      externalLinks &&
      typeof externalLinks === "object" &&
      Array.isArray(externalLinks)
        ? (externalLinks as Array<{ url: string; label: string }>)
        : null,
  };
}

/**
 * 获取单篇博客详情页数据（包含点赞状态和首批评论）
 */
export async function getBlogPostDetailById(
  id: string,
  options: BlogPostDetailOptions = {}
): Promise<BlogPostDetail | null> {
  const { viewerUserId, viewerEmail, commentsLimit = 50 } = options;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });

  if (!post) {
    return null;
  }

  const [existingLike, comments, approvedCommentCount] = await Promise.all([
    viewerUserId || viewerEmail
      ? prisma.blogLike.findFirst({
          where: viewerUserId
            ? {
                blogPostId: id,
                userId: viewerUserId,
              }
            : {
                blogPostId: id,
                userEmail: viewerEmail!,
                userId: null,
              },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
    prisma.blogComment.findMany({
      where: {
        blogPostId: id,
        status: BLOG_COMMENT_APPROVED_STATUS,
      },
      orderBy: { createdAt: "asc" },
      take: commentsLimit,
      ...BLOG_COMMENT_PUBLIC_QUERY,
    }),
    getApprovedCommentCount(id),
  ]);

  const {
    user,
    _count,
    createdAt,
    updatedAt,
    publishedAt,
    externalLinks,
    ...postData
  } = post;

  return {
    ...postData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    likeCount: _count.likes,
    commentCount: approvedCommentCount,
    isLiked: !!existingLike,
    externalLinks:
      externalLinks &&
      typeof externalLinks === "object" &&
      Array.isArray(externalLinks)
          ? (externalLinks as Array<{ url: string; label: string }>)
          : null,
    comments: comments.map(serializeBlogComment),
  };
}

/**
 * 为指定用户创建博客文章
 */
export async function createBlogPost(
  input: BlogPostCreateInput
): Promise<BlogPost> {
  const { userId, published = false, ...data } = input;

  const post = await prisma.blogPost.create({
    data: {
      userId,
      title: data.title,
      content: data.content,
      coverImage: data.coverImage || null,
      videoUrl: data.videoUrl || null,
      externalLinks: data.externalLinks ? (data.externalLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
      published,
      publishedAt: published ? new Date() : null,
    },
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  const { user, createdAt, updatedAt, publishedAt, externalLinks, ...postData } =
    post;

  return {
    ...postData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    externalLinks:
      externalLinks &&
      typeof externalLinks === "object" &&
      Array.isArray(externalLinks)
        ? (externalLinks as Array<{ url: string; label: string }>)
        : null,
  };
}

/**
 * 更新博客文章
 * 业务逻辑：当 published 从 false 变为 true 时，自动设置 publishedAt 时间戳
 * 安全性：验证 userId
 */
export async function updateBlogPost(
  id: string,
  userId: string,
  input: BlogPostUpdateInput
): Promise<BlogPost> {
  // 先获取现有文章，验证所有权
  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Blog post not found");
  }

  if (existing.userId !== userId) {
    throw new Error("Forbidden: You can only update your own blog posts");
  }

  // 构建更新数据
  const updateData: Prisma.BlogPostUpdateInput = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
  if (input.videoUrl !== undefined) updateData.videoUrl = input.videoUrl;
  if (input.externalLinks !== undefined)
    updateData.externalLinks = input.externalLinks ? (input.externalLinks as Prisma.InputJsonValue) : Prisma.JsonNull;

  // 处理发布状态变化
  if (input.published !== undefined) {
    updateData.published = input.published;
    // 当 published 从 false 变为 true 时，自动设置 publishedAt
    if (input.published && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          slug: true,
          displayName: true,
        },
      },
    },
  });

  const { user, createdAt, updatedAt, publishedAt, externalLinks, ...postData } =
    post;

  return {
    ...postData,
    userSlug: user?.slug || null,
    userDisplayName: user?.displayName || null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    likeCount: 0,
    commentCount: 0,
    isLiked: false,
    externalLinks:
      externalLinks &&
      typeof externalLinks === "object" &&
      Array.isArray(externalLinks)
        ? (externalLinks as Array<{ url: string; label: string }>)
        : null,
  };
}

/**
 * 删除博客文章
 * 安全性：验证 userId
 */
export async function deleteBlogPost(
  id: string,
  userId: string
): Promise<void> {
  // 先获取现有文章，验证所有权
  const existing = await prisma.blogPost.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Blog post not found");
  }

  if (existing.userId !== userId) {
    throw new Error("Forbidden: You can only delete your own blog posts");
  }

  await prisma.blogPost.delete({
    where: { id },
  });
}
