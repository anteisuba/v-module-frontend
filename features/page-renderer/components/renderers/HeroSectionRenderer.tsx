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
    objectPosition: s.objectPosition,
  }));

  // 明确判断：如果配置为 false，则不显示；否则显示（包括 undefined 时使用默认值 true）
  const showThumbStrip = pageConfig?.showHeroThumbStrip ?? true;
  const showLogo = pageConfig?.showLogo ?? true;
  const showSocialLinks = pageConfig?.showSocialLinks ?? true;

  return (
    <div data-section-id={id} data-section-type="hero">
      <HeroSection 
        initialSlides={slides}
        logo={pageConfig?.logo}
        socialLinks={pageConfig?.socialLinks}
        title={props.title}
        subtitle={props.subtitle}
        showThumbStrip={showThumbStrip}
        showLogo={showLogo}
        showSocialLinks={showSocialLinks}
        layout={props.layout}
      />
    </div>
  );
}
