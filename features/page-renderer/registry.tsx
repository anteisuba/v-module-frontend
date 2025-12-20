// features/page-renderer/registry.tsx

import type { SectionConfig } from "@/domain/page-config/types";
import HeroSectionRenderer from "./components/renderers/HeroSectionRenderer";
import LinksSectionRenderer from "./components/renderers/LinksSectionRenderer";
import GallerySectionRenderer from "./components/renderers/GallerySectionRenderer";

// 组件注册表：type -> React Component
export const SECTION_RENDERERS: Record<
  SectionConfig["type"],
  React.ComponentType<{ props: any; id: string }>
> = {
  hero: HeroSectionRenderer,
  links: LinksSectionRenderer,
  gallery: GallerySectionRenderer,
};

// 类型安全的渲染函数
export function renderSection(section: SectionConfig): React.ReactNode {
  const RendererComponent = SECTION_RENDERERS[section.type];
  if (!RendererComponent) {
    console.warn(`Unknown section type: ${section.type}`);
    return null;
  }

  if (!section.enabled) {
    return null; // 跳过禁用的 section
  }

  return (
    <RendererComponent key={section.id} id={section.id} props={section.props} />
  );
}

