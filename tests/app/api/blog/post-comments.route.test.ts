import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  findBlogPostMock,
  createCommentMock,
  findCommentsMock,
  countCommentsMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findBlogPostMock: vi.fn(),
  createCommentMock: vi.fn(),
  findCommentsMock: vi.fn(),
  countCommentsMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: {
      findUnique: findBlogPostMock,
    },
    blogComment: {
      create: createCommentMock,
      findMany: findCommentsMock,
      count: countCommentsMock,
    },
  },
}));

import { GET, POST } from "@/app/api/blog/posts/[id]/comments/route";

const pendingCommentRecord = {
  id: "comment-1",
  blogPostId: "post-1",
  userId: null,
  userName: "Alice",
  userEmail: "alice@example.com",
  content: "First!",
  status: "PENDING",
  moderatedAt: null,
  createdAt: new Date("2026-03-08T00:00:00.000Z"),
  updatedAt: new Date("2026-03-08T00:00:00.000Z"),
  user: null,
};

const approvedCommentRecord = {
  ...pendingCommentRecord,
  id: "comment-2",
  status: "APPROVED",
  moderatedAt: new Date("2026-03-08T01:00:00.000Z"),
  user: {
    id: "user-1",
    slug: "creator",
    displayName: "Creator",
  },
};

describe("blog public comments route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue(null);
    findBlogPostMock.mockResolvedValue({
      id: "post-1",
      published: true,
    });
  });

  it("creates new comments as pending", async () => {
    createCommentMock.mockResolvedValue(pendingCommentRecord);

    const response = await POST(
      new Request("http://localhost/api/blog/posts/post-1/comments", {
        method: "POST",
        body: JSON.stringify({
          userName: "Alice",
          userEmail: "alice@example.com",
          content: "First!",
        }),
      }),
      {
        params: Promise.resolve({ id: "post-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createCommentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          blogPostId: "post-1",
          status: "PENDING",
        }),
      })
    );
    expect(payload).toMatchObject({
      id: "comment-1",
      status: "PENDING",
    });
  });

  it("returns only approved comments from the public API", async () => {
    findCommentsMock.mockResolvedValue([approvedCommentRecord]);
    countCommentsMock.mockResolvedValue(1);

    const response = await GET(
      new Request("http://localhost/api/blog/posts/post-1/comments?page=1&limit=20"),
      {
        params: Promise.resolve({ id: "post-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findCommentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          blogPostId: "post-1",
          status: "APPROVED",
        },
      })
    );
    expect(countCommentsMock).toHaveBeenCalledWith({
      where: {
        blogPostId: "post-1",
        status: "APPROVED",
      },
    });
    expect(payload.comments).toHaveLength(1);
    expect(payload.comments[0]).toMatchObject({
      id: "comment-2",
      status: "APPROVED",
    });
  });

  it("hides comments for unpublished posts", async () => {
    findBlogPostMock.mockResolvedValue({
      id: "post-1",
      published: false,
    });

    const response = await GET(
      new Request("http://localhost/api/blog/posts/post-1/comments"),
      {
        params: Promise.resolve({ id: "post-1" }),
      }
    );

    expect(response.status).toBe(404);
    expect(findCommentsMock).not.toHaveBeenCalled();
  });
});
