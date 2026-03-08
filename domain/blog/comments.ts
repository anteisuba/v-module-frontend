import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BLOG_COMMENT_PENDING_STATUS = "PENDING" as const;
export const BLOG_COMMENT_APPROVED_STATUS = "APPROVED" as const;
export const BLOG_COMMENT_REJECTED_STATUS = "REJECTED" as const;
export const BLOG_COMMENT_STATUSES = [
  BLOG_COMMENT_PENDING_STATUS,
  BLOG_COMMENT_APPROVED_STATUS,
  BLOG_COMMENT_REJECTED_STATUS,
] as const;

export type BlogCommentStatus = (typeof BLOG_COMMENT_STATUSES)[number];

const blogCommentUserSelect = {
  id: true,
  slug: true,
  displayName: true,
} satisfies Prisma.UserSelect;

export const BLOG_COMMENT_PUBLIC_QUERY =
  Prisma.validator<Prisma.BlogCommentDefaultArgs>()({
    include: {
      user: {
        select: blogCommentUserSelect,
      },
    },
  });

export const BLOG_COMMENT_MODERATION_QUERY =
  Prisma.validator<Prisma.BlogCommentDefaultArgs>()({
    include: {
      user: {
        select: blogCommentUserSelect,
      },
      blogPost: {
        select: {
          id: true,
          title: true,
          published: true,
          userId: true,
        },
      },
    },
  });

type BlogCommentRecord = Prisma.BlogCommentGetPayload<
  typeof BLOG_COMMENT_PUBLIC_QUERY
>;
type BlogModerationCommentRecord = Prisma.BlogCommentGetPayload<
  typeof BLOG_COMMENT_MODERATION_QUERY
>;

export interface BlogComment {
  id: string;
  blogPostId: string;
  userName: string;
  userEmail: string | null;
  content: string;
  status: BlogCommentStatus;
  createdAt: string;
  moderatedAt: string | null;
  user: {
    id: string;
    slug: string;
    displayName: string | null;
  } | null;
}

export interface ModerationBlogComment extends BlogComment {
  blogPost: {
    id: string;
    title: string;
    published: boolean;
  };
}

export interface BlogCommentModerationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function isBlogCommentStatus(value: string): value is BlogCommentStatus {
  return (BLOG_COMMENT_STATUSES as readonly string[]).includes(value);
}

export function buildBlogCommentSearchWhere(
  query: string
): Prisma.BlogCommentWhereInput | undefined {
  const trimmed = query.trim();

  if (!trimmed) {
    return undefined;
  }

  return {
    OR: [
      {
        userName: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        userEmail: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: trimmed,
          mode: "insensitive",
        },
      },
      {
        blogPost: {
          title: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      },
    ],
  };
}

export function serializeBlogComment(comment: BlogCommentRecord): BlogComment {
  return {
    id: comment.id,
    blogPostId: comment.blogPostId,
    userName: comment.userName,
    userEmail: comment.userEmail || null,
    content: comment.content,
    status: comment.status as BlogCommentStatus,
    createdAt: comment.createdAt.toISOString(),
    moderatedAt: comment.moderatedAt ? comment.moderatedAt.toISOString() : null,
    user: comment.user,
  };
}

export function serializeModerationBlogComment(
  comment: BlogModerationCommentRecord
): ModerationBlogComment {
  return {
    ...serializeBlogComment(comment),
    blogPost: {
      id: comment.blogPost.id,
      title: comment.blogPost.title,
      published: comment.blogPost.published,
    },
  };
}

export async function getApprovedCommentCount(postId: string): Promise<number> {
  return prisma.blogComment.count({
    where: {
      blogPostId: postId,
      status: BLOG_COMMENT_APPROVED_STATUS,
    },
  });
}

export async function getApprovedCommentCountMap(
  postIds: string[]
): Promise<Map<string, number>> {
  if (postIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.blogComment.groupBy({
    by: ["blogPostId"],
    where: {
      blogPostId: {
        in: postIds,
      },
      status: BLOG_COMMENT_APPROVED_STATUS,
    },
    _count: {
      _all: true,
    },
  });

  return new Map(
    rows.map((row) => [row.blogPostId, row._count._all])
  );
}

export function buildBlogCommentModerationSummary(
  rows: Array<{ status: string; _count: { _all: number } }>
): BlogCommentModerationSummary {
  const summary: BlogCommentModerationSummary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const row of rows) {
    summary.total += row._count._all;

    if (row.status === BLOG_COMMENT_PENDING_STATUS) {
      summary.pending = row._count._all;
    } else if (row.status === BLOG_COMMENT_APPROVED_STATUS) {
      summary.approved = row._count._all;
    } else if (row.status === BLOG_COMMENT_REJECTED_STATUS) {
      summary.rejected = row._count._all;
    }
  }

  return summary;
}
