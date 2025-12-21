// features/page-renderer/components/renderers/HeroSectionRenderer.tsx

"use client";

import { HeroSection } from "@/features/home-hero";
import type { HeroSectionProps, PageConfig } from "@/domain/page-config/types";

export default function HeroSectionRenderer({
  props,
  id,
  pageConfig,
}: {
  props: HeroSectionProps;
  id: string;
  pageConfig?: PageConfig;
}) {
  // 将 HeroSectionProps 转换为 HeroSection 需要的格式
  const slides = props.slides.map((s) => ({
    src: s.src,
    alt: s.alt,
    href: s.href || null,
  }));

  return (
    <div data-section-id={id} data-section-type="hero">
      <HeroSection 
        initialSlides={slides}
        logo={pageConfig?.logo}
        socialLinks={pageConfig?.socialLinks}
        title={props.title}
        subtitle={props.subtitle}
      />
    </div>
  );
}
