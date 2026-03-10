import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getServerSessionMock,
  pageFindUniqueMock,
  pageUpdateMock,
  userFindUniqueMock,
  ensureUserPageMock,
} = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  pageFindUniqueMock: vi.fn(),
  pageUpdateMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  ensureUserPageMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/page-config", () => ({
  ensureUserPage: ensureUserPageMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: {
      findUnique: pageFindUniqueMock,
      update: pageUpdateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

import { GET, PUT } from "@/app/api/page/me/route";
import { POST } from "@/app/api/page/me/publish/route";

function createDraftConfig(overrides?: Record<string, unknown>) {
  return {
    background: {
      type: "color",
      value: "#112233",
    },
    sections: [
      {
        id: "hero-1",
        type: "hero",
        enabled: true,
        order: 0,
        props: {
          slides: [],
          title: "Hello",
        },
      },
      {
        id: "links-1",
        type: "links",
        enabled: true,
        order: 1,
        props: {
          items: [
            {
              id: "link-1",
              label: "X",
              href: "https://example.com",
            },
          ],
        },
      },
    ],
    socialLinks: [],
    ...overrides,
  };
}

describe("page editor routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    userFindUniqueMock.mockResolvedValue({
      id: "user-1",
      slug: "creator",
    });
    ensureUserPageMock.mockResolvedValue({
      id: "page-1",
      draftConfig: createDraftConfig(),
      publishedConfig: null,
    });
  });

  it("returns the normalized draft config for the current seller", async () => {
    pageFindUniqueMock.mockResolvedValue({
      draftConfig: createDraftConfig(),
      themeColor: "#445566",
      fontFamily: "Noto Sans JP",
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      themeColor: "#445566",
      fontFamily: "Noto Sans JP",
      draftConfig: {
        background: {
          type: "color",
          value: "#112233",
        },
      },
    });
    expect(payload.draftConfig.sections).toHaveLength(1);
    expect(payload.draftConfig.sections[0]).toMatchObject({
      id: "hero-1",
      type: "hero",
    });
  });

  it("saves a normalized draft config with theme settings", async () => {
    pageUpdateMock.mockResolvedValue({
      draftConfig: createDraftConfig(),
      themeColor: "#998877",
      fontFamily: "Zen Maru Gothic",
    });

    const response = await PUT(
      new Request("http://localhost/api/page/me", {
        method: "PUT",
        body: JSON.stringify({
          draftConfig: createDraftConfig(),
          themeColor: "#998877",
          fontFamily: "Zen Maru Gothic",
        }),
      })
    );
    const payload = await response.json();
    const updateInput = pageUpdateMock.mock.calls[0]?.[0] as {
      where: Record<string, string>;
      data: {
        draftConfig: {
          sections: Array<{ type: string }>;
        };
        themeColor?: string;
        fontFamily?: string;
        updatedAt: Date;
      };
    };

    expect(response.status).toBe(200);
    expect(ensureUserPageMock).toHaveBeenCalledWith("user-1", "creator");
    expect(updateInput.where).toEqual({ userId: "user-1" });
    expect(updateInput.data.themeColor).toBe("#998877");
    expect(updateInput.data.fontFamily).toBe("Zen Maru Gothic");
    expect(updateInput.data.updatedAt).toBeInstanceOf(Date);
    expect(updateInput.data.draftConfig.sections).toHaveLength(1);
    expect(updateInput.data.draftConfig.sections[0].type).toBe("hero");
    expect(payload.pageConfig.sections).toHaveLength(1);
  });

  it("rejects invalid draft configs before touching the database", async () => {
    const response = await PUT(
      new Request("http://localhost/api/page/me", {
        method: "PUT",
        body: JSON.stringify({
          draftConfig: createDraftConfig({
            background: {
              type: "color",
              value: "#123",
            },
          }),
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid config");
    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(pageUpdateMock).not.toHaveBeenCalled();
  });

  it("publishes the normalized draft config", async () => {
    pageFindUniqueMock.mockResolvedValue({
      draftConfig: createDraftConfig(),
    });
    pageUpdateMock.mockResolvedValue({
      publishedConfig: createDraftConfig(),
    });

    const response = await POST(
      new Request("http://localhost/api/page/me/publish", {
        method: "POST",
      })
    );
    const payload = await response.json();
    const updateInput = pageUpdateMock.mock.calls[0]?.[0] as {
      where: Record<string, string>;
      data: {
        publishedConfig: {
          sections: Array<{ type: string }>;
        };
        updatedAt: Date;
      };
    };

    expect(response.status).toBe(200);
    expect(ensureUserPageMock).toHaveBeenCalledWith("user-1", "creator");
    expect(updateInput.where).toEqual({ userId: "user-1" });
    expect(updateInput.data.updatedAt).toBeInstanceOf(Date);
    expect(updateInput.data.publishedConfig.sections).toHaveLength(1);
    expect(updateInput.data.publishedConfig.sections[0].type).toBe("hero");
    expect(payload.publishedConfig.sections).toHaveLength(1);
  });

  it("blocks publishing when the stored draft config is invalid", async () => {
    pageFindUniqueMock.mockResolvedValue({
      draftConfig: createDraftConfig({
        background: {
          type: "color",
          value: "#123",
        },
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/page/me/publish", {
        method: "POST",
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Draft config is invalid");
    expect(pageUpdateMock).not.toHaveBeenCalled();
  });
});
