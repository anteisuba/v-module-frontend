// features/page-renderer/components/renderers/HeroSectionRenderer.tsx

"use client";

import { HeroSection } from "@/features/home-hero";
import type { HeroSectionProps } from "@/domain/page-config/types";

export default function HeroSectionRenderer({
  props,
  id,
}: {
  props: HeroSectionProps;
  id: string;
}) {
  // 将 HeroSectionProps 转换为 HeroSection 需要的格式
  const slides = props.slides.map((s) => ({
    src: s.src,
    alt: s.alt,
    href: s.href || null,
  }));

  return (
    <div data-section-id={id} data-section-type="hero">
      {props.title && (
        <div className="absolute top-20 left-0 right-0 z-10 text-center">
          <h1 className="text-4xl font-bold text-white">{props.title}</h1>
          {props.subtitle && (
            <p className="mt-2 text-xl text-white/80">{props.subtitle}</p>
          )}
        </div>
      )}
      <HeroSection initialSlides={slides} />
    </div>
  );
}

