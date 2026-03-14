import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  newsArticleFindManyMock,
  newsArticleCountMock,
  newsArticleFindUniqueMock,
  newsArticleCreateMock,
  newsArticleUpdateMock,
  newsArticleDeleteMock,
} = vi.hoisted(() => ({
  newsArticleFindManyMock: vi.fn(),
  newsArticleCountMock: vi.fn(),
  newsArticleFindUniqueMock: vi.fn(),
  newsArticleCreateMock: vi.fn(),
  newsArticleUpdateMock: vi.fn(),
  newsArticleDeleteMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    newsArticle: {
      findMany: newsArticleFindManyMock,
      count: newsArticleCountMock,
      findUnique: newsArticleFindUniqueMock,
      create: newsArticleCreateMock,
      update: newsArticleUpdateMock,
      delete: newsArticleDeleteMock,
    },
  },
}));

import {
  createNewsArticle,
  deleteNewsArticle,
  getNewsArticleById,
  listNewsArticles,
  updateNewsArticle,
} from "@/domain/news";
import { ApiRouteError } from "@/lib/api/server";

function buildArticleRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "article-1",
    userId: "seller-1",
    title: "Event notice",
    content: "Doors open at 19:00",
    category: "MEDIA",
    tag: "TOUR",
    shareUrl: "https://example.com/articles/1",
    shareChannels: [{ platform: "twitter", enabled: true }],
    backgroundType: "image",
    backgroundValue: "/uploads/event.jpg",
    published: true,
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-11T00:00:00.000Z"),
    publishedAt: new Date("2026-03-12T00:00:00.000Z"),
    user: {
      slug: "creator",
    },
    ...overrides,
  };
}

describe("domain/news services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes article lists with ISO dates and userSlug", async () => {
    newsArticleFindManyMock.mockResolvedValue([buildArticleRecord()]);
    newsArticleCountMock.mockResolvedValue(1);

    const result = await listNewsArticles({
      page: 1,
      limit: 10,
      published: true,
      viewerUserId: null,
    });

    expect(newsArticleFindManyMock).toHaveBeenCalledWith({
      where: {
        published: true,
      },
      skip: 0,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: expect.any(Object),
    });
    expect(result.articles[0]).toMatchObject({
      id: "article-1",
      userSlug: "creator",
      createdAt: "2026-03-10T00:00:00.000Z",
      updatedAt: "2026-03-11T00:00:00.000Z",
      publishedAt: "2026-03-12T00:00:00.000Z",
      shareChannels: [{ platform: "twitter", enabled: true }],
    });
  });

  it("creates published articles with a publish timestamp", async () => {
    newsArticleCreateMock.mockResolvedValue(buildArticleRecord());

    const article = await createNewsArticle({
      userId: "seller-1",
      input: {
        title: "Event notice",
        content: "Doors open at 19:00",
        category: "MEDIA",
        tag: null,
        shareUrl: null,
        shareChannels: null,
        published: true,
        backgroundType: "image",
        backgroundValue: "/uploads/event.jpg",
      },
    });

    const createInput = newsArticleCreateMock.mock.calls[0]?.[0] as {
      data: {
        userId: string;
        published: boolean;
        publishedAt: Date | null;
      };
    };

    expect(createInput.data.userId).toBe("seller-1");
    expect(createInput.data.published).toBe(true);
    expect(createInput.data.publishedAt).toBeInstanceOf(Date);
    expect(article.publishedAt).toBe("2026-03-12T00:00:00.000Z");
  });

  it("sets publishedAt when publishing a draft article", async () => {
    newsArticleFindUniqueMock.mockResolvedValue(
      buildArticleRecord({
        published: false,
        publishedAt: null,
      })
    );
    newsArticleUpdateMock.mockResolvedValue(
      buildArticleRecord({
        published: true,
      })
    );

    await updateNewsArticle({
      id: "article-1",
      userId: "seller-1",
      input: {
        title: "Updated title",
        published: true,
      },
    });

    const updateInput = newsArticleUpdateMock.mock.calls[0]?.[0] as {
      where: Record<string, string>;
      data: {
        title?: string;
        published?: boolean;
        publishedAt?: Date;
      };
    };

    expect(updateInput.where).toEqual({ id: "article-1" });
    expect(updateInput.data.title).toBe("Updated title");
    expect(updateInput.data.published).toBe(true);
    expect(updateInput.data.publishedAt).toBeInstanceOf(Date);
  });

  it("rejects unpublished article reads from other users", async () => {
    newsArticleFindUniqueMock.mockResolvedValue(
      buildArticleRecord({
        published: false,
      })
    );

    await expect(
      getNewsArticleById({
        id: "article-1",
        viewerUserId: "seller-2",
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    } satisfies Partial<ApiRouteError>);
  });

  it("rejects deletes for articles owned by another seller", async () => {
    newsArticleFindUniqueMock.mockResolvedValue(
      buildArticleRecord({
        userId: "seller-2",
      })
    );

    await expect(
      deleteNewsArticle({
        id: "article-1",
        userId: "seller-1",
      })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    } satisfies Partial<ApiRouteError>);
    expect(newsArticleDeleteMock).not.toHaveBeenCalled();
  });
});
