// utils/pageConfig.ts

import type { PageConfig } from "@/domain/page-config/types";
import { EMPTY_PAGE_CONFIG } from "@/domain/page-config/constants";

/**
 * 检查配置是否是默认配置（需要清空）
 */
export function isDefaultConfig(config: PageConfig): boolean {
  // 如果已发布过，不再清空
  if (config.hasPublished) {
    return false;
  }

  // 检查是否有默认的 sections（hero-1, links-1, gallery-1）
  const defaultSectionIds = ["hero-1", "links-1", "gallery-1"];
  const hasDefaultSectionIds = config.sections.some((section) =>
    defaultSectionIds.includes(section.id)
  );

  if (!hasDefaultSectionIds) {
    // 如果没有默认的 section id，说明已经被修改过
    return false;
  }

  // 检查默认 sections 的内容是否被修改
  const heroSection = config.sections.find(
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

  // 检查默认的 links section
  const linksSection = config.sections.find(
    (s) => s.id === "links-1" && s.type === "links"
  );
  if (linksSection && linksSection.type === "links") {
    const defaultLinks = [
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
    ];
    if (linksSection.props.items.length !== defaultLinks.length) {
      return false; // 数量已修改
    }
    // 检查是否有 link 的内容被修改
    const hasModifiedLink = linksSection.props.items.some((item, index) => {
      const defaultLink = defaultLinks[index];
      return (
        !defaultLink ||
        item.label !== defaultLink.label ||
        item.href !== defaultLink.href ||
        item.icon !== defaultLink.icon
      );
    });
    if (hasModifiedLink) {
      return false; // 内容已修改
    }
  }

  // 检查是否有默认的社交链接
  const hasDefaultSocialLinks = config.socialLinks?.some(
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
  return {
    ...config,
    // 确保各页面背景字段有默认值
    newsBackground: config.newsBackground || {
      type: "color" as const,
      value: "#000000",
    },
    // 确保 blogBackground 有默认值
    blogBackground: config.blogBackground || {
      type: "color" as const,
      value: "#000000",
    },
    // 确保 blogDetailBackground 有默认值
    blogDetailBackground: config.blogDetailBackground || {
      type: "color" as const,
      value: "#000000",
    },
    shopBackground: config.shopBackground || {
      type: "color" as const,
      value: "#000000",
    },
    shopDetailBackground: config.shopDetailBackground || {
      type: "color" as const,
      value: "#000000",
    },
    sections: config.sections.map((section) => {
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
        // 过滤掉 src 或 href 为空的 items
        const validItems = section.props.items.filter(
          (item) =>
            item.src &&
            item.src.trim().length > 0 &&
            item.href &&
            item.href.trim().length > 0
        );

        return {
          ...section,
          props: {
            ...section.props, // 保留现有的 props（包括 layout）
            items: validItems, // 允许空数组
          },
        };
      }
      return section;
    }),
  };
}

