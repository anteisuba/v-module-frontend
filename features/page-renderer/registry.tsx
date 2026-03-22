// features/page-renderer/registry.tsx

import type { SectionConfig, PageConfig } from "@/domain/page-config/types";
import HeroSectionRenderer from "./components/renderers/HeroSectionRenderer";
import GallerySectionRenderer from "./components/renderers/GallerySectionRenderer";
import NewsSectionRenderer from "./components/renderers/NewsSectionRenderer";
import VideoSectionRendererWrapper from "./components/renderers/VideoSectionRendererWrapper";

// 类型安全的渲染函数
export function renderSection(section: SectionConfig, pageConfig?: PageConfig): React.ReactNode {
  if (!section.enabled) {
    return null; // 跳过禁用的 section
  }

  // Hero section 需要传递 pageConfig
  if (section.type === "hero") {
    return (
      <HeroSectionRenderer
        key={section.id}
        id={section.id}
        props={section.props}
        pageConfig={pageConfig}
      />
    );
  }

  // Gallery section
  if (section.type === "gallery") {
    return (
      <GallerySectionRenderer
        key={section.id}
        id={section.id}
        props={section.props}
        variant={section.variant}
      />
    );
  }

  // News section
  if (section.type === "news") {
    return (
      <NewsSectionRenderer
        key={section.id}
        id={section.id}
        props={section.props}
        variant={section.variant}
      />
    );
  }

  // Video section - 使用包装器实现代码分割
  if (section.type === "video") {
    return (
      <VideoSectionRendererWrapper
        key={section.id}
        id={section.id}
        props={section.props}
        variant={section.variant}
      />
    );
  }

  // Menu section is rendered via the FloatingMenu component at layout level, not here
  if (section.type === "menu") {
    return null;
  }

  // TypeScript exhaustive check
  const exhaustiveCheck: never = section;
  console.warn("Unknown section type", exhaustiveCheck);
  return null;
}
