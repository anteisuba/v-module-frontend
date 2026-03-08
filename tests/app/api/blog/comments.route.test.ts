import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  findManyMock,
  countMock,
  groupByMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  groupByMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogComment: {
      findMany: findManyMock,
      count: countMock,
      groupBy: groupByMock,
    },
  },
}));

import { GET } from "@/app/api/blog/comments/route";

const moderationCommentRecord = {
  id: "comment-1",
  blogPostId: "post-1",
  userId: null,
  userName: "Alice",
  userEmail: "alice@example.com",
  content: "Please approve this",
  status: "PENDING",
  moderatedAt: null,
  createdAt: new Date("2026-03-08T00:00:00.000Z"),
  updatedAt: new Date("2026-03-08T00:00:00.000Z"),
  user: null,
  blogPost: {
    id: "post-1",
    title: "Launch Post",
    published: true,
    userId: "seller-1",
  },
};

describe("GET /api/blog/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("applies owner, status, and query filters for moderation", async () => {
    findManyMock.mockResolvedValue([moderationCommentRecord]);
    countMock.mockResolvedValue(1);
    groupByMock.mockResolvedValue([
      {
        status: "PENDING",
        _count: {
          _all: 1,
        },
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/blog/comments?page=1&limit=50&status=PENDING&query=alice"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 50,
        where: expect.objectContaining({
          blogPost: {
            userId: "seller-1",
          },
          status: "PENDING",
          OR: expect.arrayContaining([
            {
              userName: {
                contains: "alice",
                mode: "insensitive",
              },
            },
            {
              blogPost: {
                title: {
                  contains: "alice",
                  mode: "insensitive",
                },
              },
            },
          ]),
        }),
      })
    );
    expect(payload.summary).toEqual({
      total: 1,
      pending: 1,
      approved: 0,
      rejected: 0,
    });
    expect(payload.comments[0]).toMatchObject({
      id: "comment-1",
      status: "PENDING",
    });
  });
});
