import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  findUniqueMock,
  updateMock,
  deleteMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogComment: {
      findUnique: findUniqueMock,
      update: updateMock,
      delete: deleteMock,
    },
  },
}));

import { DELETE, PUT } from "@/app/api/blog/comments/[id]/route";

const ownedCommentRecord = {
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

describe("blog comment moderation detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("updates comment status for the owning seller", async () => {
    findUniqueMock.mockResolvedValue(ownedCommentRecord);
    updateMock.mockResolvedValue({
      ...ownedCommentRecord,
      status: "APPROVED",
      moderatedAt: new Date("2026-03-08T01:00:00.000Z"),
    });

    const response = await PUT(
      new Request("http://localhost/api/blog/comments/comment-1", {
        method: "PUT",
        body: JSON.stringify({ status: "APPROVED" }),
      }),
      {
        params: Promise.resolve({ id: "comment-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "comment-1" },
        data: expect.objectContaining({
          status: "APPROVED",
        }),
      })
    );
    expect(payload.comment).toMatchObject({
      id: "comment-1",
      status: "APPROVED",
    });
  });

  it("rejects deleting comments that belong to another seller", async () => {
    findUniqueMock.mockResolvedValue({
      ...ownedCommentRecord,
      blogPost: {
        ...ownedCommentRecord.blogPost,
        userId: "seller-2",
      },
    });

    const response = await DELETE(
      new Request("http://localhost/api/blog/comments/comment-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ id: "comment-1" }),
      }
    );

    expect(response.status).toBe(403);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
