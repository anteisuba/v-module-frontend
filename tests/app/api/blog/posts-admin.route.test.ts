import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  getBlogPostsMock,
  createBlogPostMock,
  getBlogPostByIdMock,
  updateBlogPostMock,
  deleteBlogPostMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  getBlogPostsMock: vi.fn(),
  createBlogPostMock: vi.fn(),
  getBlogPostByIdMock: vi.fn(),
  updateBlogPostMock: vi.fn(),
  deleteBlogPostMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/blog/services", () => ({
  getBlogPosts: getBlogPostsMock,
  createBlogPost: createBlogPostMock,
  getBlogPostById: getBlogPostByIdMock,
  updateBlogPost: updateBlogPostMock,
  deleteBlogPost: deleteBlogPostMock,
}));

import { POST as createPost } from "@/app/api/blog/posts/route";
import { PUT as updatePost } from "@/app/api/blog/posts/[id]/route";

describe("blog post admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
        slug: "creator",
      },
    });
  });

  it("creates blog posts for the current seller", async () => {
    createBlogPostMock.mockResolvedValue({
      id: "post-1",
      title: "New post",
      published: true,
    });

    const response = await createPost(
      new Request("http://localhost/api/blog/posts", {
        method: "POST",
        body: JSON.stringify({
          title: "New post",
          content: "Body",
          coverImage: "",
          videoUrl: "",
          externalLinks: undefined,
          published: true,
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createBlogPostMock).toHaveBeenCalledWith({
      userId: "seller-1",
      title: "New post",
      content: "Body",
      coverImage: null,
      videoUrl: null,
      externalLinks: null,
      published: true,
    });
    expect(payload.post).toMatchObject({
      id: "post-1",
      published: true,
    });
  });

  it("updates blog posts with partial editor payloads", async () => {
    updateBlogPostMock.mockResolvedValue({
      id: "post-1",
      title: "Updated title",
      published: false,
    });

    const response = await updatePost(
      new Request("http://localhost/api/blog/posts/post-1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated title",
          published: false,
        }),
      }),
      {
        params: Promise.resolve({ id: "post-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateBlogPostMock).toHaveBeenCalledWith("post-1", "seller-1", {
      title: "Updated title",
      published: false,
    });
    expect(payload.post).toMatchObject({
      id: "post-1",
      title: "Updated title",
    });
  });

  it("maps forbidden blog updates to 403 responses", async () => {
    updateBlogPostMock.mockRejectedValue(new Error("Forbidden"));

    const response = await updatePost(
      new Request("http://localhost/api/blog/posts/post-1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated title",
        }),
      }),
      {
        params: Promise.resolve({ id: "post-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });
});
