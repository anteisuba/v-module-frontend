import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  findManyMock,
  countMock,
  updateMock,
  deleteManyMock,
  deleteManagedMediaSourceMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
  updateMock: vi.fn(),
  deleteManyMock: vi.fn(),
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
      findMany: findManyMock,
      count: countMock,
      update: updateMock,
      deleteMany: deleteManyMock,
    },
  },
}));

import {
  DELETE,
  GET,
  PATCH,
} from "@/app/api/media-assets/route";

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
  });

  it("requires authentication for GET", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/media-assets"));

    expect(response.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns paginated assets for the current user with usage filter", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    findManyMock.mockResolvedValue([
      createAsset({
        usageContexts: ["BLOG_COVER"],
      }),
    ]);
    countMock.mockResolvedValue(1);

    const response = await GET(
      new Request(
        "http://localhost/api/media-assets?page=2&limit=12&query=cover&usageContext=BLOG_COVER"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12,
        take: 12,
        orderBy: { createdAt: "desc" },
        where: expect.objectContaining({
          userId: "user-1",
          usageContexts: {
            has: "BLOG_COVER",
          },
          OR: expect.arrayContaining([
            {
              originalName: {
                contains: "cover",
                mode: "insensitive",
              },
            },
          ]),
        }),
      })
    );
    expect(payload.assets).toEqual([
      expect.objectContaining({
        id: "asset-1",
        usageContexts: ["BLOG_COVER"],
      }),
    ]);
    expect(payload.pagination).toEqual({
      page: 2,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
  });

  it("adds a usage context to selected assets", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    findManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        usageContexts: ["PRODUCT_IMAGE"],
      }),
    ]);
    updateMock.mockResolvedValue(
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
    expect(updateMock).toHaveBeenCalledWith({
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

  it("deletes selected assets and cleans up managed sources", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    findManyMock.mockResolvedValue([
      createAsset({
        id: "asset-1",
        src: "/uploads/test/cover.jpg",
      }),
      createAsset({
        id: "asset-2",
        src: "/uploads/test/hero.jpg",
      }),
    ]);
    deleteManyMock.mockResolvedValue({ count: 2 });

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
    expect(deleteManagedMediaSourceMock).toHaveBeenNthCalledWith(
      1,
      "/uploads/test/cover.jpg"
    );
    expect(deleteManagedMediaSourceMock).toHaveBeenNthCalledWith(
      2,
      "/uploads/test/hero.jpg"
    );
    expect(deleteManyMock).toHaveBeenCalledWith({
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
