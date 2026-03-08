import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

import { GET } from "@/app/api/page/[slug]/route";

describe("GET /api/page/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the user does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/page/missing"), {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });

  it("sanitizes legacy links sections from published config", async () => {
    findUniqueMock.mockResolvedValue({
      slug: "alice",
      displayName: "Alice",
      page: {
        publishedConfig: {
          background: {
            type: "color",
            value: "#123456",
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
        },
      },
    });

    const response = await GET(new Request("http://localhost/api/page/alice"), {
      params: Promise.resolve({ slug: "alice" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      slug: "alice",
      displayName: "Alice",
      config: {
        background: {
          type: "color",
          value: "#123456",
        },
        newsBackground: {
          type: "color",
          value: "#000000",
        },
      },
    });
    expect(payload.config.sections).toHaveLength(1);
    expect(payload.config.sections[0].type).toBe("hero");
  });
});
