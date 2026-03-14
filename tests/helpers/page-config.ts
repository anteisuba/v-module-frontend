import type { PageConfig } from "@/domain/page-config/types";

export function createPageConfigFixture(
  overrides: Partial<PageConfig> = {}
): PageConfig {
  return {
    background: {
      type: "color",
      value: "#112233",
    },
    newsBackground: {
      type: "color",
      value: "#000000",
    },
    blogBackground: {
      type: "color",
      value: "#000000",
    },
    blogDetailBackground: {
      type: "color",
      value: "#000000",
    },
    shopBackground: {
      type: "color",
      value: "#000000",
    },
    shopDetailBackground: {
      type: "color",
      value: "#000000",
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
    ],
    socialLinks: [],
    ...overrides,
  };
}

export function createLegacyPageConfigFixture(
  overrides: Record<string, unknown> = {}
) {
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
