// utils/pageConfig.ts

import type { BackgroundConfig, PageConfig, SectionConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";

type LegacyLinksSection = {
  id: string;
  type: "links";
  enabled: boolean;
  order: number;
  props?: {
    items?: Array<{
      id: string;
      label: string;
      href: string;
      icon?: string;
    }>;
    layout?: "grid" | "list";
  };
  layout?: {
    colSpan: 1 | 2 | 3 | 4;
    rowSpan?: number;
  };
};

type NormalizablePageConfig = Partial<Omit<PageConfig, "sections">> & {
  sections?: Array<SectionConfig | LegacyLinksSection | Record<string, unknown>>;
};

function createDefaultBackground(): BackgroundConfig {
  return {
    type: "color",
    value: "#000000",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRenderableSection(section: unknown): section is SectionConfig {
  if (!isRecord(section) || typeof section.type !== "string") {
    return false;
  }

  return ["hero", "gallery", "news", "video", "menu"].includes(section.type);
}

export function normalizePageConfig(config: unknown): PageConfig {
  if (!isRecord(config)) {
    return EMPTY_PAGE_CONFIG;
  }

  const source = config as NormalizablePageConfig;

  return {
    ...EMPTY_PAGE_CONFIG,
    ...source,
    background: isRecord(source.background)
      ? (source.background as BackgroundConfig)
      : EMPTY_PAGE_CONFIG.background,
    newsBackground: isRecord(source.newsBackground)
      ? (source.newsBackground as BackgroundConfig)
      : createDefaultBackground(),
    blogBackground: isRecord(source.blogBackground)
      ? (source.blogBackground as BackgroundConfig)
      : createDefaultBackground(),
    blogDetailBackground: isRecord(source.blogDetailBackground)
      ? (source.blogDetailBackground as BackgroundConfig)
      : createDefaultBackground(),
    shopBackground: isRecord(source.shopBackground)
      ? (source.shopBackground as BackgroundConfig)
      : createDefaultBackground(),
    shopDetailBackground: isRecord(source.shopDetailBackground)
      ? (source.shopDetailBackground as BackgroundConfig)
      : createDefaultBackground(),
    sections: Array.isArray(source.sections)
      ? source.sections.filter(isRenderableSection)
      : [],
  };
}

/**
 * 检查配置是否是默认配置（需要清空）
 */
export function isDefaultConfig(config: PageConfig): boolean {
  const normalizedConfig = normalizePageConfig(config);

  // 如果已发布过，不再清空
  if (normalizedConfig.hasPublished) {
    return false;
  }

  // 检查是否有默认的 sections（hero-1, gallery-1）
  const defaultSectionIds = ["hero-1", "gallery-1"];
  const hasDefaultSectionIds = normalizedConfig.sections.some((section) =>
    defaultSectionIds.includes(section.id)
  );

  if (!hasDefaultSectionIds) {
    // 如果没有默认的 section id，说明已经被修改过
    return false;
  }

  // 检查默认 sections 的内容是否被修改
  const heroSection = normalizedConfig.sections.find(
    (s) => s.id === "hero-1" && s.type === "hero"
  );
  if (heroSection && heroSection.type === "hero") {
    // 检查 title 或 subtitle 是否被修改
    if (heroSection.props.title && heroSection.props.title !== "Welcome") {
      return false; // 内容已修改
    }
    if (
      heroSection.props.subtitle &&
      heroSection.props.subtitle !== "VTuber Personal Page"
    ) {
      return false; // 内容已修改
    }
    // 检查 slides 是否被修改（数量或内容）
    const defaultSlides = [
      { src: "/hero/nakajima.jpeg", alt: "Hero 1" },
      { src: "/hero/2.jpeg", alt: "Hero 2" },
      { src: "/hero/3.jpeg", alt: "Hero 3" },
    ];
    if (heroSection.props.slides.length !== defaultSlides.length) {
      return false; // 数量已修改
    }
    // 检查是否有 slide 的 src 被修改
    const hasModifiedSlide = heroSection.props.slides.some((slide, index) => {
      const defaultSlide = defaultSlides[index];
      return (
        !defaultSlide ||
        slide.src !== defaultSlide.src ||
        slide.alt !== defaultSlide.alt
      );
    });
    if (hasModifiedSlide) {
      return false; // 内容已修改
    }
  }

  // 检查是否有默认的社交链接
  const hasDefaultSocialLinks = normalizedConfig.socialLinks?.some(
    (link) =>
      link.url.includes("example.com") ||
      link.url.includes("twitter.com/example")
  );

  // 如果只有默认的 section id 和社交链接，且内容未被修改，才认为是默认配置
  return Boolean(hasDefaultSectionIds && hasDefaultSocialLinks);
}

/**
 * 清理配置数据（过滤掉空的 slides 和 news items）
 */
export function cleanPageConfig(config: PageConfig): PageConfig {
  const normalizedConfig = normalizePageConfig(config);

  return {
    ...normalizedConfig,
    sections: normalizedConfig.sections.map((section) => {
      if (section.type === "hero") {
        // 过滤掉 src 为空的 slides
        const validSlides = section.props.slides.filter(
          (slide) => slide.src && slide.src.trim().length > 0
        );

        return {
          ...section,
          props: {
            ...section.props,
            slides: validSlides, // 允许空数组
          },
        };
      }
      if (section.type === "news") {
        // 只过滤掉 src 为空的 items（href 允许暂时为空，用户可能先选图再填链接）
        const validItems = section.props.items.filter(
          (item) =>
            item.src &&
            item.src.trim().length > 0
        );

        return {
          ...section,
          props: {
            ...section.props,
            items: validItems,
          },
        };
      }
      if (section.type === "gallery") {
        // 过滤掉 src 为空的 items（新增但未选图的占位项）
        const validItems = section.props.items.filter(
          (item) => item.src && item.src.trim().length > 0
        );
        return {
          ...section,
          props: { ...section.props, items: validItems },
        };
      }
      return section;
    }),
  };
}

