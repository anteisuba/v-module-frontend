import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  newsArticleFindManyMock,
  newsArticleCountMock,
  newsArticleCreateMock,
  newsArticleFindUniqueMock,
  newsArticleUpdateMock,
  newsArticleDeleteMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  newsArticleFindManyMock: vi.fn(),
  newsArticleCountMock: vi.fn(),
  newsArticleCreateMock: vi.fn(),
  newsArticleFindUniqueMock: vi.fn(),
  newsArticleUpdateMock: vi.fn(),
  newsArticleDeleteMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    newsArticle: {
      findMany: newsArticleFindManyMock,
      count: newsArticleCountMock,
      create: newsArticleCreateMock,
      findUnique: newsArticleFindUniqueMock,
      update: newsArticleUpdateMock,
      delete: newsArticleDeleteMock,
    },
  },
}));

import { POST as createArticle } from "@/app/api/news/articles/route";
import { PUT as updateArticle } from "@/app/api/news/articles/[id]/route";

describe("news article admin routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "seller-1",
      },
    });
  });

  it("creates published news articles with a publish timestamp", async () => {
    newsArticleCreateMock.mockResolvedValue({
      id: "article-1",
      userId: "seller-1",
      title: "Event notice",
      content: "Doors open at 19:00",
      category: "event",
      tag: null,
      shareUrl: null,
      shareChannels: null,
      backgroundType: "image",
      backgroundValue: "/uploads/event.jpg",
      published: true,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      publishedAt: new Date("2026-03-10T00:00:00.000Z"),
      user: {
        slug: "seller",
      },
    });

    const response = await createArticle(
      new Request("http://localhost/api/news/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Event notice",
          content: "Doors open at 19:00",
          category: "event",
          published: true,
          backgroundType: "image",
          backgroundValue: "/uploads/event.jpg",
        }),
      })
    );
    const payload = await response.json();
    const createInput = newsArticleCreateMock.mock.calls[0]?.[0] as {
      data: {
        userId: string;
        published: boolean;
        publishedAt: Date | null;
      };
    };

    expect(response.status).toBe(200);
    expect(createInput.data.userId).toBe("seller-1");
    expect(createInput.data.published).toBe(true);
    expect(createInput.data.publishedAt).toBeInstanceOf(Date);
    expect(payload.article).toMatchObject({
      id: "article-1",
      published: true,
      userSlug: "seller",
    });
  });

  it("rejects updates for news articles owned by another seller", async () => {
    newsArticleFindUniqueMock.mockResolvedValue({
      id: "article-1",
      userId: "seller-2",
      publishedAt: null,
    });

    const response = await updateArticle(
      new Request("http://localhost/api/news/articles/article-1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated title",
        }),
      }),
      {
        params: Promise.resolve({ id: "article-1" }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
    expect(payload.code).toBe("FORBIDDEN");
    expect(newsArticleUpdateMock).not.toHaveBeenCalled();
  });

  it("sets publishedAt when publishing a draft article", async () => {
    newsArticleFindUniqueMock.mockResolvedValue({
      id: "article-1",
      userId: "seller-1",
      published: false,
      publishedAt: null,
    });
    newsArticleUpdateMock.mockResolvedValue({
      id: "article-1",
      userId: "seller-1",
      title: "Updated title",
      content: "Doors open at 19:00",
      category: "event",
      tag: null,
      shareUrl: null,
      shareChannels: null,
      backgroundType: "color",
      backgroundValue: "#000000",
      published: true,
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-11T00:00:00.000Z"),
      publishedAt: new Date("2026-03-11T00:00:00.000Z"),
      user: {
        slug: "seller",
      },
    });

    const response = await updateArticle(
      new Request("http://localhost/api/news/articles/article-1", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated title",
          published: true,
        }),
      }),
      {
        params: Promise.resolve({ id: "article-1" }),
      }
    );
    const payload = await response.json();
    const updateInput = newsArticleUpdateMock.mock.calls[0]?.[0] as {
      where: Record<string, string>;
      data: {
        title?: string;
        published?: boolean;
        publishedAt?: Date;
      };
    };

    expect(response.status).toBe(200);
    expect(updateInput.where).toEqual({ id: "article-1" });
    expect(updateInput.data.title).toBe("Updated title");
    expect(updateInput.data.published).toBe(true);
    expect(updateInput.data.publishedAt).toBeInstanceOf(Date);
    expect(payload.article).toMatchObject({
      id: "article-1",
      published: true,
      userSlug: "seller",
    });
  });

  it("rejects invalid list query parameters", async () => {
    const { GET: listArticles } = await import("@/app/api/news/articles/route");

    const response = await listArticles(
      new Request("http://localhost/api/news/articles?page=0")
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid query parameters");
    expect(payload.code).toBe("INVALID_NEWS_ARTICLE_QUERY");
  });
});
