import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPageConfigFixture } from "@/tests/helpers/page-config";

const { renderSectionMock } = vi.hoisted(() => ({
  renderSectionMock: vi.fn(),
}));

vi.mock("@/features/page-renderer/registry", () => ({
  renderSection: renderSectionMock,
}));

import PageRenderer from "@/features/page-renderer/components/PageRenderer";

describe("PageRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderSectionMock.mockImplementation((section: { id: string }) =>
      createElement(
        "section",
        {
          "data-rendered-section": section.id,
        },
        section.id
      )
    );
  });

  it("renders enabled sections in public-page order and keeps hero first", () => {
    const config = createPageConfigFixture({
      background: {
        type: "image",
        value: "/uploads/background.jpg",
      },
      sections: [
        {
          id: "news-1",
          type: "news",
          enabled: true,
          order: 2,
          props: {
            items: [
              {
                id: "item-1",
                src: "/news.jpg",
                href: "https://example.com/news",
              },
            ],
          },
          layout: {
            colSpan: 2,
          },
        },
        {
          id: "hero-1",
          type: "hero",
          enabled: true,
          order: 99,
          props: {
            slides: [],
            title: "Hero",
          },
        },
        {
          id: "gallery-disabled",
          type: "gallery",
          enabled: false,
          order: 1,
          props: {
            items: [],
          },
        },
      ],
    });

    const html = renderToStaticMarkup(createElement(PageRenderer, { config }));

    expect(renderSectionMock.mock.calls.map(([section]) => section.id)).toEqual([
      "hero-1",
      "news-1",
    ]);
    expect(html).toContain('data-testid="public-page-renderer"');
    expect(html).toContain("background-image:url(/uploads/background.jpg)");
    expect(html).toContain('data-rendered-section="hero-1"');
    expect(html).toContain('data-rendered-section="news-1"');
    expect(html).not.toContain("gallery-disabled");
    expect(html.indexOf('data-rendered-section="hero-1"')).toBeLessThan(
      html.indexOf('data-rendered-section="news-1"')
    );
  });
});
