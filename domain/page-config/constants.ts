// domain/page-config/constants.ts

import type { BackgroundConfig, PageConfig } from "./types";

/**
 * 默认背景色（near-black，匹配 editorial 设计系统的 --color-bg）
 */
const DEFAULT_BG_COLOR = "#0d0d0b";

/**
 * 判断 BackgroundConfig 是否有有效值
 */
function isValidBg(bg: BackgroundConfig | undefined): bg is BackgroundConfig {
  return !!bg && !!bg.type && !!bg.value && bg.value.trim() !== "";
}

/**
 * 将 BackgroundConfig 转为 React.CSSProperties
 */
function bgToStyle(bg: BackgroundConfig): React.CSSProperties {
  return bg.type === "color"
    ? { backgroundColor: bg.value }
    : {
        backgroundImage: `url(${bg.value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
}

/**
 * 从多个 BackgroundConfig 候选中解析出背景样式。
 * 按优先级尝试，第一个有效的会被使用，全部无效时返回默认 near-black。
 *
 * @example
 * resolveBackgroundStyle(config?.shopDetailBackground, config?.shopBackground, config?.newsBackground)
 */
export function resolveBackgroundStyle(
  ...candidates: (BackgroundConfig | undefined)[]
): React.CSSProperties {
  for (const bg of candidates) {
    if (isValidBg(bg)) {
      return bgToStyle(bg);
    }
  }
  return { backgroundColor: DEFAULT_BG_COLOR };
}

/**
 * 从多个 BackgroundConfig 候选中找出第一个有效的背景类型。
 */
export function resolveBackgroundType(
  ...candidates: (BackgroundConfig | undefined)[]
): "color" | "image" {
  for (const bg of candidates) {
    if (isValidBg(bg)) {
      return bg.type;
    }
  }
  return "color";
}

/**
 * 空页面配置
 * 用于首次访问 CMS 时显示空白状态
 */
export const EMPTY_PAGE_CONFIG: PageConfig = {
  background: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  newsBackground: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  blogBackground: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  blogDetailBackground: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  shopBackground: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  shopDetailBackground: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  sections: [],
  showHeroThumbStrip: true,
  showLogo: true,
  showSocialLinks: true,
};

/**
 * 默认页面配置
 * 用于首次创建页面时填充 draftConfig 和 publishedConfig
 */
export const DEFAULT_PAGE_CONFIG: PageConfig = {
  background: {
    type: "color",
    value: "#000000", // 默认黑色背景
  },
  logo: {
    // 默认不设置图片，显示文字 "ano"
  },
  socialLinks: [
    {
      id: "social-1",
      name: "Twitter",
      url: "https://twitter.com/example",
      icon: "X",
      enabled: true,
    },
    {
      id: "social-2",
      name: "YouTube",
      url: "https://youtube.com/example",
      icon: "YT",
      enabled: true,
    },
    {
      id: "social-3",
      name: "GitHub",
      url: "https://github.com/example",
      icon: "GH",
      enabled: true,
    },
  ],
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
      id: "gallery-1",
      type: "gallery",
      enabled: true,
      order: 1,
      props: {
        items: [],
        columns: 3,
        gap: "md",
      },
    },
  ],
  showHeroThumbStrip: true, // 默认显示 Hero 缩略图条
  showLogo: true, // 默认显示 Logo
  showSocialLinks: true, // 默认显示社交链接
  meta: {
    title: "My VTuber Page",
    description: "Welcome to my personal page",
  },
};
