import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  mediaAssetFindManyMock,
  mediaAssetCountMock,
  mediaAssetUpdateMock,
  mediaAssetDeleteManyMock,
  pageFindManyMock,
  blogPostFindManyMock,
  productFindManyMock,
  newsArticleFindManyMock,
  deleteManagedMediaSourceMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  mediaAssetFindManyMock: vi.fn(),
  mediaAssetCountMock: vi.fn(),
  mediaAssetUpdateMock: vi.fn(),
  mediaAssetDeleteManyMock: vi.fn(),
  pageFindManyMock: vi.fn(),
  blogPostFindManyMock: vi.fn(),
  productFindManyMock: vi.fn(),
  newsArticleFindManyMock: vi.fn(),
  deleteManagedMediaSourceMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/mediaStorage", () => ({
  deleteManagedMediaSource: deleteManagedMediaSourceMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findMany: mediaAssetFindManyMock,
      count: mediaAssetCountMock,
      update: mediaAssetUpdateMock,
      deleteMany: mediaAssetDeleteManyMock,
    },
    page: {
      findMany: pageFindManyMock,
    },
    blogPost: {
      findMany: blogPostFindManyMock,
    },
    product: {
      findMany: productFindManyMock,
    },
    newsArticle: {
      findMany: newsArticleFindManyMock,
    },
  },
}));

import { DELETE, GET, PATCH } from "@/app/api/media-assets/route";

function createAsset(overrides?: Record<string, unknown>) {
  return {
    id: "asset-1",
    src: "/uploads/test/cover.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    originalName: "cover.jpg",
    usageContexts: [],
    createdAt: new Date("2026-03-09T00:00:00.000Z"),
    ...overrides,
  };
}

describe("/api/media-assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageFindManyMock.mockResolvedValue([]);
    blogPostFindManyMock.mockResolvedValue([]);
    productFindManyMock.mockResolvedValue([]);
    newsArticleFindManyMock.mockResolvedValue([]);
  });

  it("requires authentication for GET", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/media-assets"));

    expect(response.status).toBe(401);
    expect(mediaAssetFindManyMock).not.toHaveBeenCalled();
  });

  it("returns paginated assets with reference metadata", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        usageContexts: ["BLOG_COVER"],
      }),
    ]);
    mediaAssetCountMock.mockResolvedValue(1);
    pageFindManyMock.mockResolvedValue([
      {
        id: "page-1",
        slug: "ano",
        draftConfig: {
          background: {
            type: "image",
            value: "/uploads/test/cover.jpg",
          },
        },
        publishedConfig: null,
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/media-assets?page=2&limit=12&query=cover&usageContext=BLOG_COVER"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mediaAssetFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12,
        take: 12,
        orderBy: { createdAt: "desc" },
        where: expect.objectContaining({
          userId: "user-1",
          usageContexts: {
            has: "BLOG_COVER",
          },
        }),
      })
    );
    expect(payload.assets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        usageContexts: ["BLOG_COVER"],
        isInUse: true,
        referenceCount: 1,
        references: [
          expect.objectContaining({
            kind: "PAGE_DRAFT_CONFIG",
            field: "background.value",
          }),
        ],
      }),
    ]);
  });

  it("adds a usage context to selected assets", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE"],
      }),
    ]);
    mediaAssetUpdateMock.mockResolvedValue(
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE", "BLOG_COVER"],
      })
    );

    const response = await PATCH(
      new Request("http://localhost/api/media-assets", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["asset-1"],
          usageContext: "BLOG_COVER",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mediaAssetUpdateMock).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: {
        usageContexts: ["PRODUCT_IMAGE", "BLOG_COVER"],
      },
      select: expect.any(Object),
    });
    expect(payload.assets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE", "BLOG_COVER"],
      }),
    ]);
  });

  it("removes a usage context from selected assets", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE", "BLOG_COVER"],
      }),
    ]);
    mediaAssetUpdateMock.mockResolvedValue(
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE"],
      })
    );

    const response = await PATCH(
      new Request("http://localhost/api/media-assets", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["asset-1"],
          action: "REMOVE",
          usageContext: "BLOG_COVER",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mediaAssetUpdateMock).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: {
        usageContexts: ["PRODUCT_IMAGE"],
      },
      select: expect.any(Object),
    });
    expect(payload.assets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE"],
      }),
    ]);
  });

  it("clears usage contexts for selected assets", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE", "BLOG_COVER"],
      }),
    ]);
    mediaAssetUpdateMock.mockResolvedValue(
      createAsset({
        id: "asset-1",
        usageContexts: [],
      })
    );

    const response = await PATCH(
      new Request("http://localhost/api/media-assets", {
        method: "PATCH",
        body: JSON.stringify({
          ids: ["asset-1"],
          action: "CLEAR",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mediaAssetUpdateMock).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: {
        usageContexts: [],
      },
      select: expect.any(Object),
    });
    expect(payload.assets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        usageContexts: [],
      }),
    ]);
  });

  it("blocks deletion when assets are still referenced", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        src: "/uploads/test/cover.jpg",
      }),
    ]);
    blogPostFindManyMock.mockResolvedValue([
      {
        id: "post-1",
        title: "Pinned post",
        coverImage: "/uploads/test/cover.jpg",
      },
    ]);

    const response = await DELETE(
      new Request("http://localhost/api/media-assets", {
        method: "DELETE",
        body: JSON.stringify({
          ids: ["asset-1"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(deleteManagedMediaSourceMock).not.toHaveBeenCalled();
    expect(mediaAssetDeleteManyMock).not.toHaveBeenCalled();
    expect(payload.code).toBe("MEDIA_ASSETS_IN_USE");
    expect(payload.details.blockedAssets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        isInUse: true,
        referenceCount: 1,
        references: [
          expect.objectContaining({
            kind: "BLOG_POST_COVER",
            entityLabel: "Pinned post",
          }),
        ],
      }),
    ]);
  });

  it("deletes unused assets and cleans up managed sources", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    mediaAssetFindManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        src: "/uploads/test/cover.jpg",
      }),
      createAsset({
        id: "asset-2",
        src: "/uploads/test/hero.jpg",
      }),
    ]);
    mediaAssetDeleteManyMock.mockResolvedValue({ count: 2 });

    const response = await DELETE(
      new Request("http://localhost/api/media-assets", {
        method: "DELETE",
        body: JSON.stringify({
          ids: ["asset-1", "asset-2"],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(deleteManagedMediaSourceMock).toHaveBeenCalledTimes(2);
    expect(mediaAssetDeleteManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        id: {
          in: ["asset-1", "asset-2"],
        },
      },
    });
    expect(payload).toEqual({
      ok: true,
      deletedIds: ["asset-1", "asset-2"],
      deletedCount: 2,
    });
  });
});
