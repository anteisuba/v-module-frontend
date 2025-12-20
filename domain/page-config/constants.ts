// domain/page-config/constants.ts

import type { PageConfig } from "./types";

/**
 * 默认页面配置
 * 用于首次创建页面时填充 draftConfig 和 publishedConfig
 */
export const DEFAULT_PAGE_CONFIG: PageConfig = {
  background: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  sections: [
    {
      id: "hero-1",
      type: "hero",
      enabled: true,
      order: 0,
      props: {
        slides: [
          { src: "/hero/nakajima.jpeg", alt: "Hero 1" },
          { src: "/hero/2.jpeg", alt: "Hero 2" },
          { src: "/hero/3.jpeg", alt: "Hero 3" },
        ],
        title: "Welcome",
        subtitle: "VTuber Personal Page",
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
            label: "Twitter",
            href: "https://twitter.com/example",
            icon: "🐦",
          },
          {
            id: "link-2",
            label: "YouTube",
            href: "https://youtube.com/example",
            icon: "📺",
          },
          {
            id: "link-3",
            label: "GitHub",
            href: "https://github.com/example",
            icon: "💻",
          },
        ],
        layout: "grid",
      },
    },
    {
      id: "gallery-1",
      type: "gallery",
      enabled: true,
      order: 2,
      props: {
        items: [],
        columns: 3,
        gap: "md",
      },
    },
  ],
  meta: {
    title: "My VTuber Page",
    description: "Welcome to my personal page",
  },
};
