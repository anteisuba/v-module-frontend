import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  transactionMock,
  mediaAssetFindManyMock,
  mediaAssetUpdateMock,
  pageFindManyMock,
  pageUpdateMock,
  blogPostFindManyMock,
  blogPostUpdateManyMock,
  productFindManyMock,
  productUpdateMock,
  newsArticleFindManyMock,
  newsArticleUpdateManyMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  transactionMock: vi.fn(),
  mediaAssetFindManyMock: vi.fn(),
  mediaAssetUpdateMock: vi.fn(),
  pageFindManyMock: vi.fn(),
  pageUpdateMock: vi.fn(),
  blogPostFindManyMock: vi.fn(),
  blogPostUpdateManyMock: vi.fn(),
  productFindManyMock: vi.fn(),
  productUpdateMock: vi.fn(),
  newsArticleFindManyMock: vi.fn(),
  newsArticleUpdateManyMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    mediaAsset: {
      findMany: mediaAssetFindManyMock,
      update: mediaAssetUpdateMock,
    },
    page: {
      findMany: pageFindManyMock,
      update: pageUpdateMock,
    },
    blogPost: {
      findMany: blogPostFindManyMock,
      updateMany: blogPostUpdateManyMock,
    },
    product: {
      findMany: productFindManyMock,
      update: productUpdateMock,
    },
    newsArticle: {
      findMany: newsArticleFindManyMock,
      updateMany: newsArticleUpdateManyMock,
    },
  },
}));

import { POST } from "@/app/api/media-assets/replace/route";

function createAsset(overrides?: Record<string, unknown>) {
  return {
    id: "asset-1",
    src: "/uploads/test/source.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    originalName: "source.jpg",
    usageContexts: ["PAGE_BACKGROUND"],
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    ...overrides,
  };
}

describe("/api/media-assets/replace", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    transactionMock.mockImplementation(async (callback) =>
      callback({
        mediaAsset: {
          update: mediaAssetUpdateMock,
        },
        page: {
          findMany: pageFindManyMock,
          update: pageUpdateMock,
        },
        blogPost: {
          updateMany: blogPostUpdateManyMock,
        },
        product: {
          findMany: productFindManyMock,
          update: productUpdateMock,
        },
        newsArticle: {
          updateMany: newsArticleUpdateManyMock,
        },
      })
    );

    pageFindManyMock.mockResolvedValue([]);
    blogPostFindManyMock.mockResolvedValue([]);
    blogPostUpdateManyMock.mockResolvedValue({ count: 0 });
    productFindManyMock.mockResolvedValue([]);
    newsArticleFindManyMock.mockResolvedValue([]);
    newsArticleUpdateManyMock.mockResolvedValue({ count: 0 });
  });

  it("requires authentication", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/media-assets/replace", {
        method: "POST",
        body: JSON.stringify({
          sourceAssetId: "asset-old",
          targetAssetId: "asset-new",
        }),
      })
    );

    expect(response.status).toBe(401);
    expect(mediaAssetFindManyMock).not.toHaveBeenCalled();
  });

  it("replaces references across page, blog, product, and news records", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });

    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-old",
        src: "/uploads/test/source.jpg",
        usageContexts: ["PAGE_BACKGROUND", "BLOG_COVER"],
      }),
      createAsset({
        id: "asset-new",
        src: "/uploads/test/target.jpg",
        usageContexts: ["PRODUCT_IMAGE"],
      }),
    ]);

    pageFindManyMock.mockResolvedValue([
      {
        id: "page-1",
        slug: "creator",
        draftConfig: {
          background: {
            type: "image",
            value: "/uploads/test/source.jpg",
          },
        },
        publishedConfig: {
          background: {
            type: "image",
            value: "/uploads/test/source.jpg",
          },
        },
      },
    ]);
    blogPostFindManyMock.mockResolvedValue([
      {
        id: "post-1",
        title: "Pinned post",
        coverImage: "/uploads/test/source.jpg",
      },
    ]);
    productFindManyMock.mockResolvedValue([
      {
        id: "product-1",
        name: "Penlight",
        images: [
          "/uploads/test/source.jpg",
          "/uploads/test/other.jpg",
        ],
      },
    ]);
    newsArticleFindManyMock.mockResolvedValue([
      {
        id: "article-1",
        title: "Breaking",
        backgroundType: "image",
        backgroundValue: "/uploads/test/source.jpg",
      },
    ]);
    pageUpdateMock.mockResolvedValue({});
    productUpdateMock.mockResolvedValue({});
    blogPostUpdateManyMock.mockResolvedValue({ count: 1 });
    newsArticleUpdateManyMock.mockResolvedValue({ count: 1 });
    mediaAssetUpdateMock.mockResolvedValue({});

    const response = await POST(
      new Request("http://localhost/api/media-assets/replace", {
        method: "POST",
        body: JSON.stringify({
          sourceAssetId: "asset-old",
          targetAssetId: "asset-new",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(pageUpdateMock).toHaveBeenCalledWith({
      where: { id: "page-1" },
      data: {
        draftConfig: {
          background: {
            type: "image",
            value: "/uploads/test/target.jpg",
          },
        },
        publishedConfig: {
          background: {
            type: "image",
            value: "/uploads/test/target.jpg",
          },
        },
      },
    });
    expect(blogPostUpdateManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        id: {
          in: ["post-1"],
        },
        coverImage: "/uploads/test/source.jpg",
      },
      data: {
        coverImage: "/uploads/test/target.jpg",
      },
    });
    expect(productUpdateMock).toHaveBeenCalledWith({
      where: { id: "product-1" },
      data: {
        images: [
          "/uploads/test/target.jpg",
          "/uploads/test/other.jpg",
        ],
      },
    });
    expect(newsArticleUpdateManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        id: {
          in: ["article-1"],
        },
        backgroundType: "image",
        backgroundValue: "/uploads/test/source.jpg",
      },
      data: {
        backgroundValue: "/uploads/test/target.jpg",
      },
    });
    expect(mediaAssetUpdateMock).toHaveBeenCalledWith({
      where: { id: "asset-new" },
      data: {
        usageContexts: ["PRODUCT_IMAGE", "PAGE_BACKGROUND", "BLOG_COVER"],
      },
    });
    expect(payload).toEqual({
      ok: true,
      replacedReferenceCount: 5,
      updatedEntityCount: 4,
    });
  });

  it("rejects replacing with the same asset", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });

    const response = await POST(
      new Request("http://localhost/api/media-assets/replace", {
        method: "POST",
        body: JSON.stringify({
          sourceAssetId: "asset-old",
          targetAssetId: "asset-old",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("MEDIA_ASSET_REPLACE_SAME_ASSET");
  });
});
