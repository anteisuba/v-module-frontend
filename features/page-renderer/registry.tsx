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

  // Links section - 已移除
  if (section.type === "links") {
    return null;
  }

  // Gallery section
  if (section.type === "gallery") {
    return (
      <GallerySectionRenderer
        key={section.id}
        id={section.id}
        props={section.props}
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
      />
    );
  }

  // TypeScript exhaustive check
  const _exhaustive: never = section;
  console.warn(`Unknown section type: ${(_exhaustive as any).type}`);
  return null;
}

